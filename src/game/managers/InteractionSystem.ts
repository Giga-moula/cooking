import Phaser from "phaser";
import { INSTANT_CRAFT_RECIPES } from "../data/recipes";
import { Logger } from "../utils/Logger";
import { ActionSoundManager } from "./ActionSoundManager";
import { CasseroleManager } from "./CasseroleManager";
import { CounterInteractionManager } from "./CounterInteractionManager";
import { DeliveryManager } from "./DeliveryManager";
import { MapManager } from "./MapManager";
import { OrderDisplayManager } from "./OrderDisplayManager";
import { OvenManager } from "./OvenManager";
import { PlayerManager } from "./PlayerManager";
import { RecipeManager } from "./RecipeManager";
import { ScoreManager } from "./ScoreManager";
import { TimerManager } from "./TimerManager";
import { TrashManager } from "./TrashManager";
import { VoiceManager } from "./VoiceManager";

/**
 * Système d'interaction orienté objet
 * Gère toutes les interactions du jeu de manière centralisée
 */
export class InteractionSystem {
    private scene: Phaser.Scene;
    private mapManager: MapManager;
    private counterManager: CounterInteractionManager;
    private deliveryManager: DeliveryManager;
    private recipeManager: RecipeManager;
    private orderDisplayManager: OrderDisplayManager;
    private scoreManager: ScoreManager;
    private timerManager: TimerManager;
    private ovenManager: OvenManager;
    private casseroleManager: CasseroleManager;
    private trashManager: TrashManager;
    private voiceManager: VoiceManager;
    private actionSoundManager: ActionSoundManager;

    constructor(
        scene: Phaser.Scene,
        mapManager: MapManager,
        counterManager: CounterInteractionManager,
        deliveryManager: DeliveryManager,
        recipeManager: RecipeManager,
        orderDisplayManager: OrderDisplayManager,
        scoreManager: ScoreManager,
        timerManager: TimerManager,
        ovenManager: OvenManager,
        casseroleManager: CasseroleManager,
        trashManager: TrashManager
    ) {
        this.scene = scene;
        this.mapManager = mapManager;
        this.counterManager = counterManager;
        this.deliveryManager = deliveryManager;
        this.recipeManager = recipeManager;
        this.orderDisplayManager = orderDisplayManager;
        this.scoreManager = scoreManager;
        this.timerManager = timerManager;
        this.ovenManager = ovenManager;
        this.casseroleManager = casseroleManager;
        this.trashManager = trashManager;
        this.voiceManager = new VoiceManager(scene);
        this.actionSoundManager = new ActionSoundManager(scene);

        // Initialiser le VoiceManager après un délai pour s'assurer que les sons sont chargés
        scene.time.delayedCall(1000, () => {
            this.voiceManager.initializeAfterLoad();
        });
    }

    /**
     * Traite une transformation pour un joueur donné
     * Cette méthode doit être appelée uniquement lors de l'appui sur la touche de transformation (R/P)
     */
    public handlePlayerTransformation(player: PlayerManager): void {
        const playerSprite = player?.getPlayer();
        if (!playerSprite) return;

        const playerGridX = player.getPlayerGridX();
        const playerGridY = player.getPlayerGridY();
        const target = player.getTargetPosition();
        if (!target) return;

        const targetX = target.x ?? playerGridX;
        const targetY = target.y ?? playerGridY;

        // Vérifier d'abord le four pour la cuisson (utilise le timer, pas le système de craft)
        if (this.handleOvenCooking(targetX, targetY, player)) {
            return;
        }

        // La casserole utilise le système de craft (enchaînement de touches)
        // Elle ne répond plus à un simple appui sur R/P

        // Vérifier si c'est un bloc de craft - si oui, ignorer la transformation automatique
        const tileTypeId = this.mapManager.getTileTypeId(targetX, targetY);
        if (this.isCraftingTile(tileTypeId)) {
            // Exception : si c'est une table de transformation avec un craft instantané, autoriser
            if (
                tileTypeId === 10 &&
                this.isInstantCraftRecipe(targetX, targetY)
            ) {
                // Autoriser la transformation instantanée
            } else {
                // Les blocs de craft ne répondent plus à R/P, seulement au système de craft
                Logger.log(
                    `Bloc de craft détecté - utilisez le système de craft à la place`
                );
                return;
            }
        }

        // Seules les tables de transformation peuvent être utilisées
        if (
            this.handleTransformationTableInteraction(targetX, targetY, player)
        ) {
            return;
        }
    }

    /**
     * Vérifie si une tile est un bloc de craft
     */
    private isCraftingTile(tileTypeId: number | null): boolean {
        if (!tileTypeId) return false;
        // IDs des blocs de craft : table-mono (10), oven (11), casserole_cuisson (13)
        return tileTypeId === 10 || tileTypeId === 11 || tileTypeId === 13;
    }

    /**
     * Vérifie si la recette qui va être créée est un craft instantané
     */
    private isInstantCraftRecipe(gridX: number, gridY: number): boolean {
        // Vérifier s'il y a un item sur la table
        if (!this.counterManager.hasItemOnCounter(gridX, gridY)) {
            return false;
        }

        const itemOnCounter = this.counterManager.getItemTypeOnCounter(
            gridX,
            gridY
        );
        if (!itemOnCounter) {
            return false;
        }

        // Pour vérifier si c'est une recette instantanée, on doit savoir quelles recettes sont possibles
        // avec cet item. On va vérifier toutes les recettes instantanées.
        const allRecipes = this.recipeManager.getAllRecipes();
        for (const recipe of allRecipes) {
            if (INSTANT_CRAFT_RECIPES.includes(recipe.id)) {
                // Vérifier si l'item sur la table fait partie de cette recette
                if (
                    itemOnCounter === recipe.ingredient1 ||
                    itemOnCounter === recipe.ingredient2
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Traite une interaction pour un joueur donné
     * Cette méthode doit être appelée uniquement lors de l'appui sur la touche d'interaction (E/O)
     */
    public handlePlayerInteraction(player: PlayerManager): void {
        const playerSprite = player?.getPlayer();
        if (!playerSprite) return;

        const isoMap = this.mapManager?.getIsoMap();
        if (!isoMap) return;

        const inventory = player?.getInventory();
        if (!inventory) return;

        const playerGridX = player.getPlayerGridX();
        const playerGridY = player.getPlayerGridY();
        const target = player.getTargetPosition();
        if (!target) return;

        let targetX = target.x ?? playerGridX;
        let targetY = target.y ?? playerGridY;

        // Si le joueur est sur une tile interactive, interagir avec cette même position
        if (this.isInteractiveTile(playerGridX, playerGridY, isoMap)) {
            targetX = playerGridX;
            targetY = playerGridY;
        }

        // Prioriser les interactions dans cet ordre:
        // 1. Ingrédient
        // 2. Zone de livraison
        // 3. Four (cuisson)
        // 4. Casserole (cuisson)
        // 5. Poubelle (jeter un objet)
        // 6. Plan de travail (normal et table de transformation)
        // Note: Les transformations spécifiques utilisent la touche R/P

        if (this.handleIngredientInteraction(targetX, targetY, player)) {
            return;
        }

        if (this.handleDeliveryInteraction(targetX, targetY, player)) {
            return;
        }

        if (this.handleOvenInteraction(targetX, targetY, player)) {
            return;
        }

        if (this.handleCasseroleInteraction(targetX, targetY, player)) {
            return;
        }

        if (this.handleTrashInteraction(targetX, targetY, player)) {
            return;
        }

        // Les tables de transformation sont aussi des comptoirs, donc on peut y poser/prendre des objets
        if (this.handleCounterInteraction(targetX, targetY, player, isoMap)) {
            return;
        }
    }

    /**
     * Vérifie si une tile est interactive
     */
    private isInteractiveTile(
        gridX: number,
        gridY: number,
        isoMap: { isCounter: (x: number, y: number) => boolean }
    ): boolean {
        return (
            isoMap.isCounter(gridX, gridY) ||
            this.mapManager.isIngredientTile(gridX, gridY) ||
            this.deliveryManager.isDeliveryZone(gridX, gridY)
        );
    }

    /**
     * Gère l'interaction avec les ingrédients
     */
    private handleIngredientInteraction(
        targetX: number,
        targetY: number,
        player: PlayerManager
    ): boolean {
        if (!this.mapManager.isIngredientTile(targetX, targetY)) {
            return false;
        }

        const inventory = player.getInventory();
        const playerSprite = player.getPlayer();
        if (!inventory || !playerSprite) return false;

        if (inventory.isEmpty()) {
            const ingredientType = this.mapManager.getIngredientFromTile(
                targetX,
                targetY
            );
            if (ingredientType) {
                inventory.addItem(ingredientType);
                player.updateCarriedItem();

                // Déclencher une voix pour cet ingrédient
                this.voiceManager.playVoiceForIngredient(
                    ingredientType,
                    player.getPlayerNumber()
                );

                // Jouer le son de récupération réussie
                Logger.debug(
                    `🎵 Récupération d'ingrédient depuis caisse: ${ingredientType}`
                );
                this.actionSoundManager.playRecupSuccess();
            }
        }

        return true;
    }

    /**
     * Gère l'interaction avec la zone de livraison
     * Maintenant que la zone est solide, on vérifie si le joueur regarde vers elle
     */
    private handleDeliveryInteraction(
        targetX: number,
        targetY: number,
        player: PlayerManager
    ): boolean {
        // Vérifier si la cible est la zone de livraison (utilise le MapManager pour la vraie position)
        const isTargetDeliveryZone = this.mapManager?.isDeliveryZone(
            targetX,
            targetY
        );

        if (!isTargetDeliveryZone) {
            return false;
        }

        const inventory = player?.getInventory();

        // Si l'inventaire est vide, on montre juste qu'on a détecté la zone
        if (!inventory || inventory.isEmpty()) {
            return true;
        }

        const carriedItem = inventory.peekItem();
        if (!carriedItem) return true;

        // Vérifier si c'est un plat fini
        if (this.recipeManager?.isDish(carriedItem)) {
            if (this.orderDisplayManager?.checkOrderCompletion(carriedItem)) {
                // Livraison réussie
                inventory.removeItem();
                player?.removeCarriedItem();

                const points =
                    this.scoreManager?.calculateRecipePoints(carriedItem) ?? 0;
                this.scoreManager?.addScore(points, `Livraison ${carriedItem}`);

                // Bonus de temps : +15 secondes par livraison + bonus des upgrades
                if (this.timerManager?.isTimerRunning()) {
                    this.timerManager.addTime(15);
                    this.timerManager.addDeliveryBonus(); // Ajouter le bonus d'upgrade
                }

                this.deliveryManager?.showDeliverySuccessEffect();
            }
        }

        return true;
    }

    /**
     * Gère l'interaction avec les tables de transformation
     * Cette méthode gère les transformations ET les combinaisons (appelée avec R/P)
     */
    private handleTransformationTableInteraction(
        targetX: number,
        targetY: number,
        player: PlayerManager
    ): boolean {
        if (!this.mapManager?.isTransformationTable(targetX, targetY)) {
            return false;
        }

        const inventory = player?.getInventory();
        const playerSprite = player?.getPlayer();
        if (!inventory || !playerSprite) return false;

        const hasItemOnTable = this.counterManager?.hasItemOnCounter(
            targetX,
            targetY
        ) ?? false;
        const hasItemInHand = !inventory.isEmpty();

        // Cas 1: Table pleine + Main pleine = Essayer de combiner (recette)
        if (hasItemOnTable && hasItemInHand) {
            const itemInHand = inventory.peekItem();
            const itemOnTable = this.counterManager?.getItemTypeOnCounter(
                targetX,
                targetY
            );

            if (itemInHand && itemOnTable) {
                // Essayer d'abord une recette (combinaison)
                const resultId = this.recipeManager?.combineIngredients(
                    itemInHand,
                    itemOnTable
                );

                if (resultId) {
                    // Retirer les ingrédients
                    inventory.removeItem();
                    player?.removeCarriedItem();
                    this.counterManager?.removeItemFromCounter(targetX, targetY);

                    // Créer le résultat
                    this.counterManager?.placeItemOnCounter(
                        targetX,
                        targetY,
                        resultId
                    );

                    // Effets visuels
                    this.counterManager?.playFusionEffect(targetX, targetY);
                    const ingredient =
                        this.recipeManager?.getIngredient(resultId);
                    if (ingredient) {
                        this.counterManager?.showCombinationMessage(
                            `✨ ${ingredient.name} créé !`,
                            targetX,
                            targetY
                        );
                    }

                    return true;
                }
            }

            // Si pas de recette, essayer transformation spéciale
            const success = this.counterManager?.performSpecialTransformation(
                targetX,
                targetY,
                inventory
            ) ?? false;
            if (success) {
                player?.updateCarriedItem();
                return true;
            }

            return true;
        }

        // Cas 2: Table pleine + Main vide = Essayer transformation simple
        if (hasItemOnTable && !hasItemInHand) {
            const success = this.counterManager?.performSpecialTransformation(
                targetX,
                targetY,
                inventory
            ) ?? false;
            if (success) {
                player?.updateCarriedItem();
            }
            return true;
        }

        return true;
    }

    /**
     * Gère l'interaction avec les plans de travail (normaux et tables de transformation)
     * Avec E/O : Poser/Prendre uniquement (pas de combinaison)
     */
    private handleCounterInteraction(
        targetX: number,
        targetY: number,
        player: PlayerManager,
        isoMap: { isCounter: (x: number, y: number) => boolean }
    ): boolean {
        if (!isoMap?.isCounter(targetX, targetY)) {
            return false;
        }

        const inventory = player?.getInventory();
        const playerSprite = player?.getPlayer();
        if (!inventory || !playerSprite) return false;

        const hasItemOnCounter = this.counterManager?.hasItemOnCounter(
            targetX,
            targetY
        ) ?? false;
        const inventoryEmpty = inventory.isEmpty();

        // Cas 1: Ramasser un objet de la table
        if (hasItemOnCounter && inventoryEmpty) {
            return this.pickupFromCounter(targetX, targetY, player);
        }

        // Cas 2: Poser un objet sur la table
        if (!hasItemOnCounter && !inventoryEmpty) {
            return this.placeOnCounter(targetX, targetY, player);
        }

        return true;
    }

    /**
     * Ramasse un objet d'un comptoir
     */
    private pickupFromCounter(
        targetX: number,
        targetY: number,
        player: PlayerManager
    ): boolean {
        const inventory = player?.getInventory();
        if (!inventory) return false;

        const itemType = this.counterManager?.removeItemFromCounter(
            targetX,
            targetY
        );

        if (itemType) {
            inventory.addItem(itemType);
            player?.updateCarriedItem();

            // Jouer le son de récupération réussie pour tous les items
            Logger.debug(`🎵 Récupération d'item depuis comptoir: ${itemType}`);
            this.actionSoundManager?.playRecupSuccess();

            return true;
        }

        return false;
    }

    /**
     * Pose un objet sur un comptoir
     */
    private placeOnCounter(
        targetX: number,
        targetY: number,
        player: PlayerManager
    ): boolean {
        const inventory = player?.getInventory();
        if (!inventory) return false;

        const itemType = inventory.removeItem();
        if (itemType) {
            this.counterManager?.placeItemOnCounter(targetX, targetY, itemType);
            player?.removeCarriedItem();
            return true;
        }

        return false;
    }

    /**
     * Gère l'interaction avec le four
     * Avec E/O : Poser/Prendre des ingrédients
     * Avec R/P : Cuire les ingrédients
     */
    private handleOvenInteraction(
        targetX: number,
        targetY: number,
        player: PlayerManager
    ): boolean {
        if (!this.mapManager?.isOven(targetX, targetY)) {
            return false;
        }

        const inventory = player?.getInventory();
        const playerSprite = player?.getPlayer();
        if (!inventory || !playerSprite) return false;

        const hasItemInOven = this.ovenManager?.hasItemInOven(targetX, targetY) ?? false;
        const inventoryEmpty = inventory.isEmpty();

        // Cas 1: Ramasser un objet du four
        if (hasItemInOven && inventoryEmpty) {
            return this.pickupFromOven(targetX, targetY, player);
        }

        // Cas 2: Poser un objet dans le four
        if (!hasItemInOven && !inventoryEmpty) {
            return this.placeInOven(targetX, targetY, player);
        }

        return true;
    }

    /**
     * Gère l'interaction avec la casserole
     * Avec E/O : Poser/Prendre des ingrédients
     * Avec R/P : Cuire les ingrédients
     */
    private handleCasseroleInteraction(
        targetX: number,
        targetY: number,
        player: PlayerManager
    ): boolean {
        if (!this.mapManager?.isCasserole(targetX, targetY)) {
            return false;
        }

        const inventory = player?.getInventory();
        const playerSprite = player?.getPlayer();
        if (!inventory || !playerSprite) return false;

        const hasItemInCasserole = this.casseroleManager?.hasItemInCasserole(
            targetX,
            targetY
        ) ?? false;
        const inventoryEmpty = inventory.isEmpty();

        // Cas 1: Ramasser un objet de la casserole
        if (hasItemInCasserole && inventoryEmpty) {
            return this.pickupFromCasserole(targetX, targetY, player);
        }

        // Cas 2: Poser un objet dans la casserole
        if (!hasItemInCasserole && !inventoryEmpty) {
            return this.placeInCasserole(targetX, targetY, player);
        }

        return true;
    }

    /**
     * Ramasse un objet de la casserole
     */
    private pickupFromCasserole(
        targetX: number,
        targetY: number,
        player: PlayerManager
    ): boolean {
        const itemType = this.casseroleManager?.removeItemFromCasserole(
            targetX,
            targetY
        );
        if (itemType) {
            const inventory = player?.getInventory();
            if (inventory) {
                inventory.addItem(itemType);
                player?.updateCarriedItem();
                return true;
            }
        }
        return false;
    }

    /**
     * Place un objet dans la casserole
     */
    private placeInCasserole(
        targetX: number,
        targetY: number,
        player: PlayerManager
    ): boolean {
        const inventory = player?.getInventory();
        if (!inventory) return false;

        const itemType = inventory.removeItem();
        if (itemType) {
            const success = this.casseroleManager?.placeItemInCasserole(
                targetX,
                targetY,
                itemType
            ) ?? false;
            if (success) {
                player?.removeCarriedItem();
                return true;
            } else {
                // Remettre l'objet dans l'inventaire si ça a échoué
                inventory.addItem(itemType);
            }
        }
        return false;
    }

    /**
     * Ramasse un objet du four
     */
    private pickupFromOven(
        targetX: number,
        targetY: number,
        player: PlayerManager
    ): boolean {
        const inventory = player?.getInventory();
        if (!inventory) return false;

        const itemType = this.ovenManager?.removeItemFromOven(targetX, targetY);

        if (itemType) {
            inventory.addItem(itemType);
            player?.updateCarriedItem();
            return true;
        }

        return false;
    }

    /**
     * Pose un objet dans le four
     */
    private placeInOven(
        targetX: number,
        targetY: number,
        player: PlayerManager
    ): boolean {
        const inventory = player?.getInventory();
        if (!inventory) return false;

        const itemType = inventory.removeItem();
        if (itemType) {
            this.ovenManager?.placeItemInOven(targetX, targetY, itemType);
            player?.removeCarriedItem();
            return true;
        }

        return false;
    }

    /**
     * Gère la cuisson dans le four (appelée avec R/P)
     */
    private handleOvenCooking(
        targetX: number,
        targetY: number,
        player: PlayerManager
    ): boolean {
        if (!this.mapManager?.isOven(targetX, targetY)) {
            return false;
        }

        const hasItemInOven = this.ovenManager?.hasItemInOven(targetX, targetY) ?? false;

        if (hasItemInOven) {
            this.ovenManager?.performCooking(
                targetX,
                targetY,
                player?.getPlayerNumber() ?? 1
            );
        }

        return true;
    }

    /**
     * Gère la cuisson dans la casserole (R/P)
     */
    private handleCasseroleCooking(
        targetX: number,
        targetY: number,
        player: PlayerManager
    ): boolean {
        if (!this.mapManager?.isCasserole(targetX, targetY)) {
            return false;
        }

        const hasItemInCasserole = this.casseroleManager?.hasItemInCasserole(
            targetX,
            targetY
        ) ?? false;

        if (hasItemInCasserole) {
            this.casseroleManager?.cookInCasserole(
                targetX,
                targetY,
                player?.getPlayerNumber() ?? 1
            );
            return true;
        } else {
            this.casseroleManager?.showCookingMessage(
                "❌ Vide !",
                targetX,
                targetY
            );
            return true;
        }
    }

    /**
     * Gère l'interaction avec la poubelle (jeter un objet)
     */
    private handleTrashInteraction(
        targetX: number,
        targetY: number,
        player: PlayerManager
    ): boolean {
        const mapConfig = this.mapManager?.getCurrentMapConfig();
        if (!mapConfig?.mapData) return false;

        return this.trashManager?.handleTrashInteraction(
            player,
            targetX,
            targetY,
            mapConfig.mapData
        ) ?? false;
    }

    /**
     * Obtient le gestionnaire de voix
     */
    getVoiceManager(): VoiceManager {
        return this.voiceManager;
    }

    /**
     * Obtient le gestionnaire de sons d'actions
     */
    getActionSoundManager(): ActionSoundManager {
        return this.actionSoundManager;
    }

    /**
     * Nettoie les ressources du système d'interaction
     */
    cleanup(): void {
        // Nettoyer les managers si nécessaire
        if (this.voiceManager) {
            this.voiceManager.cleanup();
        }
        if (this.actionSoundManager) {
            this.actionSoundManager.cleanup();
        }
    }
}


import Phaser from "phaser";
import { CounterInteractionManager } from "./CounterInteractionManager";
import { DeliveryManager } from "./DeliveryManager";
import { RecipeManager } from "./RecipeManager";
import { MapManager } from "./MapManager";
import { OrderDisplayManager } from "./OrderDisplayManager";
import { PlayerManager } from "./PlayerManager";
import { ScoreManager } from "./ScoreManager";
import { TimerManager } from "./TimerManager";
import { OvenManager } from "./OvenManager";
import { CasseroleManager } from "./CasseroleManager";

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
        casseroleManager: CasseroleManager
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
    }

    /**
     * Traite une transformation pour un joueur donné
     * Cette méthode doit être appelée uniquement lors de l'appui sur la touche de transformation (R/P)
     */
    public handlePlayerTransformation(player: PlayerManager): void {
        const playerSprite = player.getPlayer();
        if (!playerSprite) return;

        const playerGridX = player.getPlayerGridX();
        const playerGridY = player.getPlayerGridY();
        const target = player.getTargetPosition();
        const targetX = target.x;
        const targetY = target.y;


        // Seules les tables de transformation peuvent être utilisées
        if (this.handleTransformationTableInteraction(targetX, targetY, player)) {
            return;
        }

        // Vérifier aussi le four pour la cuisson
        if (this.handleOvenCooking(targetX, targetY, player)) {
            return;
        }

        // Vérifier aussi la casserole pour la cuisson
        if (this.handleCasseroleCooking(targetX, targetY, player)) {
            return;
        }

    }

    /**
     * Traite une interaction pour un joueur donné
     * Cette méthode doit être appelée uniquement lors de l'appui sur la touche d'interaction (E/O)
     */
    public handlePlayerInteraction(player: PlayerManager): void {
        const playerSprite = player.getPlayer();
        if (!playerSprite) return;

        const isoMap = this.mapManager.getIsoMap();
        if (!isoMap) return;

        const inventory = player.getInventory();
        if (!inventory) return;

        const playerGridX = player.getPlayerGridX();
        const playerGridY = player.getPlayerGridY();
        const target = player.getTargetPosition();
        let targetX = target.x;
        let targetY = target.y;

        // Si le joueur est sur une tile interactive, interagir avec cette même position
        if (this.isInteractiveTile(playerGridX, playerGridY, isoMap)) {
            targetX = playerGridX;
            targetY = playerGridY;
        }

        // Prioriser les interactions dans cet ordre:
        // 1. Ingrédient
        // 2. Zone de livraison
        // 3. Four (cuisson)
        // 4. Plan de travail (normal et table de transformation)
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
        isoMap: any
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
        const isTargetDeliveryZone = this.mapManager.isDeliveryZone(targetX, targetY);
        
        if (!isTargetDeliveryZone) {
            return false;
        }

        const inventory = player.getInventory();
        
        // Si l'inventaire est vide, on montre juste qu'on a détecté la zone
        if (!inventory || inventory.isEmpty()) {
            return true;
        }

        const carriedItem = inventory.peekItem();
        if (!carriedItem) return true;

        // Vérifier si c'est un plat fini
        if (this.recipeManager.isDish(carriedItem)) {
            if (this.orderDisplayManager.checkOrderCompletion(carriedItem)) {
                // Livraison réussie
                inventory.removeItem();
                player.removeCarriedItem();

                const points =
                    this.scoreManager.calculateRecipePoints(carriedItem);
                this.scoreManager.addScore(points, `Livraison ${carriedItem}`);

                // Bonus de temps : +15 secondes par livraison + bonus des upgrades
                if (this.timerManager && this.timerManager.isTimerRunning()) {
                    this.timerManager.addTime(15);
                    this.timerManager.addDeliveryBonus(); // Ajouter le bonus d'upgrade
                }

                this.deliveryManager.showDeliverySuccessEffect();
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
        if (!this.mapManager.isTransformationTable(targetX, targetY)) {
            return false;
        }


        const inventory = player.getInventory();
        const playerSprite = player.getPlayer();
        if (!inventory || !playerSprite) return false;

        const hasItemOnTable = this.counterManager.hasItemOnCounter(
            targetX,
            targetY
        );
        const hasItemInHand = !inventory.isEmpty();

        // Cas 1: Table pleine + Main pleine = Essayer de combiner (recette)
        if (hasItemOnTable && hasItemInHand) {
            const itemInHand = inventory.peekItem();
            const itemOnTable = this.counterManager.getItemTypeOnCounter(targetX, targetY);
            
            if (itemInHand && itemOnTable) {
                // Essayer d'abord une recette (combinaison)
                const resultId = this.recipeManager.combineIngredients(itemInHand, itemOnTable);

                if (resultId) {

                    // Retirer les ingrédients
                    inventory.removeItem();
                    player.removeCarriedItem();
                    this.counterManager.removeItemFromCounter(targetX, targetY);

                    // Créer le résultat
                    this.counterManager.placeItemOnCounter(targetX, targetY, resultId);

                    // Effets visuels
                    this.counterManager.playFusionEffect(targetX, targetY);
                    return true;
                }
            }

            // Si pas de recette, essayer transformation spéciale
            const success = this.counterManager.performSpecialTransformation(targetX, targetY, inventory);
            if (success) {
                player.updateCarriedItem();
                return true;
            }

            return true;
        }

        // Cas 2: Table pleine + Main vide = Essayer transformation simple
        if (hasItemOnTable && !hasItemInHand) {
            const success = this.counterManager.performSpecialTransformation(targetX, targetY, inventory);
            if (success) {
                player.updateCarriedItem();
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
        isoMap: any
    ): boolean {
        if (!isoMap.isCounter(targetX, targetY)) {
            return false;
        }

        const isTransformTable = this.mapManager.isTransformationTable(targetX, targetY);

        const inventory = player.getInventory();
        const playerSprite = player.getPlayer();
        if (!inventory || !playerSprite) return false;

        const hasItemOnCounter = this.counterManager.hasItemOnCounter(
            targetX,
            targetY
        );
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
        const inventory = player.getInventory();
        if (!inventory) return false;

        const itemType = this.counterManager.removeItemFromCounter(
            targetX,
            targetY
        );

        if (itemType) {
            inventory.addItem(itemType);
            player.updateCarriedItem();
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
        const inventory = player.getInventory();
        if (!inventory) return false;

        const itemType = inventory.removeItem();
        if (itemType) {
            this.counterManager.placeItemOnCounter(targetX, targetY, itemType);
            player.removeCarriedItem();
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
        if (!this.mapManager.isOven(targetX, targetY)) {
            return false;
        }

        const inventory = player.getInventory();
        const playerSprite = player.getPlayer();
        if (!inventory || !playerSprite) return false;

        const hasItemInOven = this.ovenManager.hasItemInOven(targetX, targetY);
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
        if (!this.mapManager.isCasserole(targetX, targetY)) {
            return false;
        }

        const inventory = player.getInventory();
        const playerSprite = player.getPlayer();
        if (!inventory || !playerSprite) return false;

        const hasItemInCasserole = this.casseroleManager.hasItemInCasserole(targetX, targetY);
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
        const itemType = this.casseroleManager.removeItemFromCasserole(targetX, targetY);
        if (itemType) {
            const inventory = player.getInventory();
            if (inventory) {
                inventory.addItem(itemType);
                player.updateCarriedItem();
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
        const inventory = player.getInventory();
        if (!inventory) return false;

        const itemType = inventory.removeItem();
        if (itemType) {
            const success = this.casseroleManager.placeItemInCasserole(targetX, targetY, itemType);
            if (success) {
                player.removeCarriedItem();
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
        const inventory = player.getInventory();
        if (!inventory) return false;

        const itemType = this.ovenManager.removeItemFromOven(targetX, targetY);

        if (itemType) {
            inventory.addItem(itemType);
            player.updateCarriedItem();
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
        const inventory = player.getInventory();
        if (!inventory) return false;

        const itemType = inventory.removeItem();
        if (itemType) {
            this.ovenManager.placeItemInOven(targetX, targetY, itemType);
            player.removeCarriedItem();
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
        if (!this.mapManager.isOven(targetX, targetY)) {
            return false;
        }


        const hasItemInOven = this.ovenManager.hasItemInOven(targetX, targetY);

        if (hasItemInOven) {
            this.ovenManager.performCooking(targetX, targetY);
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
        if (!this.mapManager.isCasserole(targetX, targetY)) {
            return false;
        }


        const hasItemInCasserole = this.casseroleManager.hasItemInCasserole(targetX, targetY);

        if (hasItemInCasserole) {
            this.casseroleManager.cookInCasserole(targetX, targetY);
        }

        return true;
    }
}


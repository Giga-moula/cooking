import Phaser from "phaser";
import { PlayerManager } from "./PlayerManager";
import { MapManager } from "./MapManager";
import { CounterInteractionManager } from "./CounterInteractionManager";
import { DeliveryManager } from "./DeliveryManager";
import { InventoryManager } from "./InventoryManager";
import { IngredientInteractionManager } from "./IngredientInteractionManager";
import { OrderDisplayManager } from "./OrderDisplayManager";
import { ScoreManager } from "./ScoreManager";
import { TimerManager } from "./TimerManager";

/**
 * Système d'interaction orienté objet
 * Gère toutes les interactions du jeu de manière centralisée
 */
export class InteractionSystem {
    private scene: Phaser.Scene;
    private mapManager: MapManager;
    private counterManager: CounterInteractionManager;
    private deliveryManager: DeliveryManager;
    private ingredientManager: IngredientInteractionManager;
    private orderDisplayManager: OrderDisplayManager;
    private scoreManager: ScoreManager;
    private timerManager?: TimerManager;

    constructor(
        scene: Phaser.Scene,
        mapManager: MapManager,
        counterManager: CounterInteractionManager,
        deliveryManager: DeliveryManager,
        ingredientManager: IngredientInteractionManager,
        orderDisplayManager: OrderDisplayManager,
        scoreManager: ScoreManager,
        timerManager?: TimerManager
    ) {
        this.scene = scene;
        this.mapManager = mapManager;
        this.counterManager = counterManager;
        this.deliveryManager = deliveryManager;
        this.ingredientManager = ingredientManager;
        this.orderDisplayManager = orderDisplayManager;
        this.scoreManager = scoreManager;
        this.timerManager = timerManager;
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
        const lastDirection = player.getLastDirection();

        // Calculer la tile adjacente dans la direction regardée
        const targetX = playerGridX + lastDirection.x;
        const targetY = playerGridY + lastDirection.y;

        console.log(
            `⚗️ Tentative de transformation - Position: (${playerGridX}, ${playerGridY}), Cible: (${targetX}, ${targetY})`
        );

        // Seules les tables de transformation peuvent être utilisées
        if (this.handleTransformationTableInteraction(targetX, targetY, player)) {
            return;
        }

        console.log(`❌ Aucune table de transformation à (${targetX}, ${targetY})`);
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
        const lastDirection = player.getLastDirection();

        // Calculer la tile adjacente dans la direction regardée
        let targetX = playerGridX + lastDirection.x;
        let targetY = playerGridY + lastDirection.y;

        // Si le joueur est sur une tile interactive, interagir avec cette même position
        if (this.isInteractiveTile(playerGridX, playerGridY, isoMap)) {
            targetX = playerGridX;
            targetY = playerGridY;
        }

        console.log(
            `🎮 Interaction joueur - Position: (${playerGridX}, ${playerGridY}), Cible: (${targetX}, ${targetY})`
        );

        // Prioriser les interactions dans cet ordre:
        // 1. Ingrédient
        // 2. Zone de livraison
        // 3. Plan de travail (normal et table de transformation)
        // Note: Les transformations spécifiques utilisent la touche R/P

        if (this.handleIngredientInteraction(targetX, targetY, player)) {
            return;
        }

        if (this.handleDeliveryInteraction(targetX, targetY, player)) {
            return;
        }

        // Les tables de transformation sont aussi des comptoirs, donc on peut y poser/prendre des objets
        if (this.handleCounterInteraction(targetX, targetY, player, isoMap)) {
            return;
        }

        console.log(`ℹ️ Aucune interaction possible à (${targetX}, ${targetY})`);
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

        console.log(
            `🍎 Interaction avec ingrédient à (${targetX}, ${targetY})`
        );

        if (inventory.isEmpty()) {
            const ingredientType = this.mapManager.getIngredientFromTile(
                targetX,
                targetY
            );
            if (ingredientType) {
                inventory.addItem(ingredientType);
                player.updateCarriedItem();
                console.log(`✅ Récupéré: ${ingredientType}`);
            }
        } else {
            console.log(`❌ Inventaire plein`);
        }

        return true;
    }

    /**
     * Gère l'interaction avec la zone de livraison
     */
    private handleDeliveryInteraction(
        targetX: number,
        targetY: number,
        player: PlayerManager
    ): boolean {
        const playerGridX = player.getPlayerGridX();
        const playerGridY = player.getPlayerGridY();
        const lastDirection = player.getLastDirection();

        const isInZone = this.deliveryManager.isInDeliveryZone(
            playerGridX,
            playerGridY
        );
        const isLookingAtZone = this.deliveryManager.isLookingAtDeliveryZone(
            playerGridX,
            playerGridY,
            lastDirection
        );

        if (!isInZone && !isLookingAtZone) {
            return false;
        }

        console.log(`📦 Interaction avec zone de livraison`);

        const inventory = player.getInventory();
        if (!inventory || inventory.isEmpty()) {
            console.log(`❌ Aucun objet à livrer`);
            return true;
        }

        const carriedItem = inventory.peekItem();
        if (!carriedItem) return true;

        // Vérifier si c'est un plat fini
        if (this.ingredientManager.getRecipeManager().isDish(carriedItem)) {
            if (this.orderDisplayManager.checkOrderCompletion(carriedItem)) {
                // Livraison réussie
                inventory.removeItem();
                player.removeCarriedItem();

                const points =
                    this.scoreManager.calculateRecipePoints(carriedItem);
                this.scoreManager.addScore(points, `Livraison ${carriedItem}`);

                // Bonus de temps : +15 secondes par livraison
                if (this.timerManager && this.timerManager.isTimerRunning()) {
                    this.timerManager.addTime(15);
                }

                console.log(`🎉 Plat livré avec succès: ${carriedItem} (+15s bonus)`);
                this.deliveryManager.showDeliverySuccessEffect();
            } else {
                console.log(`❌ Ce plat n'est pas dans les commandes`);
                this.deliveryManager.showDeliveryErrorEffect();
            }
        } else {
            console.log(`❌ Ce n'est pas un plat fini: ${carriedItem}`);
            this.deliveryManager.showDeliveryErrorEffect();
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

        console.log(`⚗️ Tentative de transformation/combinaison à (${targetX}, ${targetY})`);

        const inventory = player.getInventory();
        const playerSprite = player.getPlayer();
        if (!inventory || !playerSprite) return false;

        const hasItemOnTable = this.counterManager.hasItemOnCounter(
            targetX,
            targetY
        );
        const hasItemInHand = !inventory.isEmpty();

        console.log(
            `État: Table=${hasItemOnTable ? "pleine" : "vide"}, Inventaire=${hasItemInHand ? "plein" : "vide"}`
        );

        // Cas 1: Table pleine + Main pleine = Essayer de combiner (recette)
        if (hasItemOnTable && hasItemInHand) {
            const itemInHand = inventory.peekItem();
            const itemOnTable = this.counterManager.getItemTypeOnCounter(targetX, targetY);
            
            if (itemInHand && itemOnTable) {
                // Essayer d'abord une recette (combinaison)
                const resultId = this.ingredientManager
                    .getRecipeManager()
                    .combineIngredients(itemInHand, itemOnTable);

                if (resultId) {
                    console.log(
                        `✨ Recette trouvée: ${itemInHand} + ${itemOnTable} = ${resultId}`
                    );

                    // Retirer les ingrédients
                    inventory.removeItem();
                    player.removeCarriedItem();
                    this.counterManager.removeItemFromCounter(targetX, targetY);

                    // Créer le résultat
                    this.counterManager.placeItemOnCounter(targetX, targetY, resultId);

                    // Effets visuels
                    this.counterManager.playFusionEffect(targetX, targetY);
                    const ingredient = this.ingredientManager
                        .getRecipeManager()
                        .getIngredient(resultId);
                    if (ingredient) {
                        this.counterManager.showCombinationMessage(
                            `✨ ${ingredient.name} créé !`,
                            targetX,
                            targetY
                        );
                    }

                    return true;
                }
            }

            // Si pas de recette, essayer transformation spéciale
            const success = this.counterManager.performSpecialTransformation(targetX, targetY, inventory);
            if (success) {
                console.log(`✅ Transformation spéciale réussie`);
                player.updateCarriedItem();
                return true;
            }

            console.log(`❌ Aucune recette pour ${itemInHand} + ${itemOnTable}`);
            this.counterManager.showCombinationMessage(
                "❌ Pas de recette",
                targetX,
                targetY
            );
            return true;
        }

        // Cas 2: Table pleine + Main vide = Essayer transformation simple
        if (hasItemOnTable && !hasItemInHand) {
            const success = this.counterManager.performSpecialTransformation(targetX, targetY, inventory);
            if (success) {
                console.log(`✅ Transformation simple réussie`);
                player.updateCarriedItem();
                return true;
            } else {
                console.log(`❌ Aucune transformation possible pour cet ingrédient`);
                this.counterManager.showCombinationMessage(
                    "❌ Pas de transformation",
                    targetX,
                    targetY
                );
                return true;
            }
        }

        // Cas 3: Table vide
        if (!hasItemOnTable) {
            console.log(`❌ Table vide - posez d'abord un ingrédient avec E/O`);
            this.counterManager.showCombinationMessage(
                "❌ Table vide",
                targetX,
                targetY
            );
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
        console.log(`📦 Interaction avec ${isTransformTable ? 'table bleue' : 'table normale'} à (${targetX}, ${targetY})`);

        const inventory = player.getInventory();
        const playerSprite = player.getPlayer();
        if (!inventory || !playerSprite) return false;

        const hasItemOnCounter = this.counterManager.hasItemOnCounter(
            targetX,
            targetY
        );
        const inventoryEmpty = inventory.isEmpty();

        console.log(
            `État: Table=${hasItemOnCounter ? "pleine" : "vide"}, Inventaire=${inventoryEmpty ? "vide" : "plein"}`
        );

        // Cas 1: Ramasser un objet de la table
        if (hasItemOnCounter && inventoryEmpty) {
            return this.pickupFromCounter(targetX, targetY, player);
        }

        // Cas 2: Poser un objet sur la table
        if (!hasItemOnCounter && !inventoryEmpty) {
            return this.placeOnCounter(targetX, targetY, player);
        }

        // Cas 3: Table occupée et inventaire plein = Combiner (uniquement sur table bleue avec R/P)
        if (hasItemOnCounter && !inventoryEmpty) {
            if (isTransformTable) {
                console.log(`💡 Utilisez R/P pour combiner sur la table bleue !`);
                this.counterManager.showCombinationMessage(
                    "💡 Appuyez sur R/P",
                    targetX,
                    targetY
                );
            } else {
                console.log(`❌ Table occupée. Utilisez la table bleue (R/P) pour combiner !`);
                this.counterManager.showCombinationMessage(
                    "❌ Table occupée",
                    targetX,
                    targetY
                );
            }
            return true;
        }

        console.log(`ℹ️ Aucune action possible sur cette table`);
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
            console.log(`✅ Ramassé: ${itemType}`);
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
            console.log(`✅ Posé: ${itemType}`);
            return true;
        }

        return false;
    }
}


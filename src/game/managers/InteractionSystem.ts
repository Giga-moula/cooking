import Phaser from "phaser";
import { PlayerManager } from "./PlayerManager";
import { MapManager } from "./MapManager";
import { CounterInteractionManager } from "./CounterInteractionManager";
import { DeliveryManager } from "./DeliveryManager";
import { InventoryManager } from "./InventoryManager";
import { IngredientInteractionManager } from "./IngredientInteractionManager";
import { OrderDisplayManager } from "./OrderDisplayManager";
import { ScoreManager } from "./ScoreManager";

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

    constructor(
        scene: Phaser.Scene,
        mapManager: MapManager,
        counterManager: CounterInteractionManager,
        deliveryManager: DeliveryManager,
        ingredientManager: IngredientInteractionManager,
        orderDisplayManager: OrderDisplayManager,
        scoreManager: ScoreManager
    ) {
        this.scene = scene;
        this.mapManager = mapManager;
        this.counterManager = counterManager;
        this.deliveryManager = deliveryManager;
        this.ingredientManager = ingredientManager;
        this.orderDisplayManager = orderDisplayManager;
        this.scoreManager = scoreManager;
    }

    /**
     * Traite une interaction pour un joueur donné
     * Cette méthode doit être appelée uniquement lors de l'appui sur la touche d'interaction
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
        // 3. Plan de travail

        if (this.handleIngredientInteraction(targetX, targetY, player)) {
            return;
        }

        if (this.handleDeliveryInteraction(targetX, targetY, player)) {
            return;
        }

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

                console.log(`🎉 Plat livré avec succès: ${carriedItem}`);
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
     * Gère l'interaction avec les plans de travail
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

        console.log(`🔨 Interaction avec plan de travail à (${targetX}, ${targetY})`);

        const inventory = player.getInventory();
        const playerSprite = player.getPlayer();
        if (!inventory || !playerSprite) return false;

        const hasItemOnCounter = this.counterManager.hasItemOnCounter(
            targetX,
            targetY
        );
        const inventoryEmpty = inventory.isEmpty();

        console.log(
            `État: Comptoir=${hasItemOnCounter ? "plein" : "vide"}, Inventaire=${inventoryEmpty ? "vide" : "plein"}`
        );

        // Cas 1: Ramasser un objet du comptoir
        if (hasItemOnCounter && inventoryEmpty) {
            return this.pickupFromCounter(targetX, targetY, player);
        }

        // Cas 2: Poser un objet sur le comptoir
        if (!hasItemOnCounter && !inventoryEmpty) {
            return this.placeOnCounter(targetX, targetY, player);
        }

        // Cas 3: Combiner deux objets
        if (hasItemOnCounter && !inventoryEmpty) {
            return this.combineIngredients(targetX, targetY, player);
        }

        console.log(`ℹ️ Aucune action possible sur ce comptoir`);
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

    /**
     * Combine deux ingrédients
     */
    private combineIngredients(
        targetX: number,
        targetY: number,
        player: PlayerManager
    ): boolean {
        const inventory = player.getInventory();
        if (!inventory) return false;

        const itemInHand = inventory.peekItem();
        const itemOnCounter = this.counterManager.getItemTypeOnCounter(
            targetX,
            targetY
        );

        if (!itemInHand || !itemOnCounter) return false;

        const resultId = this.ingredientManager
            .getRecipeManager()
            .combineIngredients(itemInHand, itemOnCounter);

        if (resultId) {
            console.log(
                `✨ Combinaison réussie: ${itemInHand} + ${itemOnCounter} = ${resultId}`
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
        } else {
            console.log(`❌ Aucune recette pour ${itemInHand} + ${itemOnCounter}`);
            this.counterManager.showCombinationMessage(
                "❌ Pas de recette",
                targetX,
                targetY
            );
            return true;
        }
    }
}


import Phaser from "phaser";
import { PlayerManager } from "./PlayerManager";
import { MapManager } from "./MapManager";
import { CounterInteractionManager } from "./CounterInteractionManager";
import { IngredientInteractionManager } from "./IngredientInteractionManager";
import { OrderDisplayManager } from "./OrderDisplayManager";
import { ScoreManager } from "./ScoreManager";
import { TimerManager } from "./TimerManager";
import { OvenManager } from "./OvenManager";
import { DeliveryManager } from "./DeliveryManager";

// Import des handlers spécialisés
import { IngredientInteractionHandler } from "./handlers/IngredientInteractionHandler";
import { DeliveryInteractionHandler } from "./handlers/DeliveryInteractionHandler";
import { OvenInteractionHandler } from "./handlers/OvenInteractionHandler";
import { IInteractionManager, ITransformationManager } from "./interfaces/IInteractionInterfaces";

/**
 * Système d'interaction refactorisé et orienté objet
 * Utilise des handlers spécialisés pour chaque type d'interaction
 */
export class InteractionSystem {
    private scene: Phaser.Scene;
    private mapManager: MapManager;
    private counterManager: CounterInteractionManager;
    private ingredientManager: IngredientInteractionManager;
    private orderDisplayManager: OrderDisplayManager;
    private scoreManager: ScoreManager;
    private timerManager?: TimerManager;
    private ovenManager: OvenManager;
    private deliveryManager: DeliveryManager;

    // Handlers spécialisés
    private ingredientHandler: IngredientInteractionHandler;
    private deliveryHandler: DeliveryInteractionHandler;
    private ovenHandler: OvenInteractionHandler;

    constructor(
        scene: Phaser.Scene,
        mapManager: MapManager,
        counterManager: CounterInteractionManager,
        deliveryManager: DeliveryManager,
        ingredientManager: IngredientInteractionManager,
        orderDisplayManager: OrderDisplayManager,
        scoreManager: ScoreManager,
        timerManager?: TimerManager,
        ovenManager?: OvenManager
    ) {
        this.scene = scene;
        this.mapManager = mapManager;
        this.counterManager = counterManager;
        this.deliveryManager = deliveryManager;
        this.ingredientManager = ingredientManager;
        this.orderDisplayManager = orderDisplayManager;
        this.scoreManager = scoreManager;
        this.timerManager = timerManager;
        this.ovenManager = ovenManager!;

        // Initialiser les handlers spécialisés
        this.ingredientHandler = new IngredientInteractionHandler(scene, mapManager);
        this.deliveryHandler = new DeliveryInteractionHandler(scene, mapManager, deliveryManager, scoreManager);
        this.ovenHandler = new OvenInteractionHandler(scene, mapManager, ovenManager!);
    }

    /**
     * Gère les interactions normales (E/O)
     */
    public handlePlayerInteraction(player: PlayerManager): void {
        const targetX = player.getGridX();
        const targetY = player.getGridY();

        // Essayer chaque handler dans l'ordre de priorité
        const handlers: IInteractionManager[] = [
            this.ingredientHandler,
            this.deliveryHandler,
            this.ovenHandler,
        ];

        for (const handler of handlers) {
            if (handler.canInteract(targetX, targetY)) {
                if (handler.handleInteraction(targetX, targetY, player)) {
                    return;
                }
            }
        }

        // Si aucun handler spécialisé n'a géré l'interaction, essayer les comptoirs
        this.handleCounterInteraction(targetX, targetY, player);
    }

    /**
     * Gère les transformations (R/P)
     */
    public handlePlayerTransformation(player: PlayerManager): void {
        const targetX = player.getGridX();
        const targetY = player.getGridY();

        // Essayer les transformations spécialisées
        const transformationHandlers: ITransformationManager[] = [
            this.ovenHandler,
        ];

        for (const handler of transformationHandlers) {
            if (handler.canTransform(targetX, targetY)) {
                if (handler.handleTransformation(targetX, targetY, player)) {
                    return;
                }
            }
        }

        // Si c'est une table de transformation, essayer les recettes
        if (this.mapManager.isTransformationTable(targetX, targetY)) {
            this.handleTransformationTableInteraction(targetX, targetY, player);
        }
    }

    /**
     * Gère les interactions avec les comptoirs (logique existante simplifiée)
     */
    private handleCounterInteraction(targetX: number, targetY: number, player: PlayerManager): void {
        if (!this.mapManager.isCounter(targetX, targetY)) {
            return;
        }

        const inventory = player.getInventory();
        if (!inventory) return;

        const hasItemOnCounter = this.counterManager.hasItemOnCounter(targetX, targetY);
        const inventoryEmpty = inventory.isEmpty();

        console.log(`📦 Interaction avec ${this.mapManager.isTransformationTable(targetX, targetY) ? 'table bleue' : 'table normale'} à (${targetX}, ${targetY})`);
        console.log(`État: Table=${hasItemOnCounter ? "pleine" : "vide"}, Inventaire=${inventoryEmpty ? "vide" : "plein"}`);

        // Cas 1: Ramasser un objet de la table
        if (hasItemOnCounter && inventoryEmpty) {
            this.pickupFromCounter(targetX, targetY, player);
            return;
        }

        // Cas 2: Poser un objet sur la table
        if (!hasItemOnCounter && !inventoryEmpty) {
            this.placeOnCounter(targetX, targetY, player);
            return;
        }

        // Cas 3: Table occupée et inventaire plein = Combiner (uniquement sur table bleue avec R/P)
        if (hasItemOnCounter && !inventoryEmpty) {
            const isTransformTable = this.mapManager.isTransformationTable(targetX, targetY);
            if (isTransformTable) {
                console.log(`💡 Utilisez R/P pour combiner sur la table bleue !`);
                this.counterManager.showCombinationMessage("💡 Appuyez sur R/P", targetX, targetY);
            } else {
                console.log(`❌ Table occupée. Utilisez la table bleue (R/P) pour combiner !`);
                this.counterManager.showCombinationMessage("❌ Table occupée", targetX, targetY);
            }
        }
    }

    /**
     * Gère les interactions avec les tables de transformation (logique existante simplifiée)
     */
    private handleTransformationTableInteraction(targetX: number, targetY: number, player: PlayerManager): boolean {
        const inventory = player.getInventory();
        if (!inventory) return false;

        const hasItemOnTable = this.counterManager.hasItemOnCounter(targetX, targetY);
        const hasItemInHand = !inventory.isEmpty();

        console.log(`⚗️ Tentative de transformation/combinaison à (${targetX}, ${targetY})`);
        console.log(`État: Table=${hasItemOnTable ? "pleine" : "vide"}, Inventaire=${hasItemInHand ? "plein" : "vide"}`);

        // Cas 1: Table pleine + Main pleine = Essayer de combiner (recette)
        if (hasItemOnTable && hasItemInHand) {
            return this.tryRecipeCombination(targetX, targetY, player);
        }

        // Cas 2: Transformation spéciale (chocolat → chunks, etc.)
        if (hasItemOnTable) {
            return this.counterManager.performSpecialTransformation(targetX, targetY, inventory);
        }

        return false;
    }

    /**
     * Essaie de combiner des ingrédients selon les recettes
     */
    private tryRecipeCombination(targetX: number, targetY: number, player: PlayerManager): boolean {
        const inventory = player.getInventory();
        if (!inventory) return false;

        const itemInHand = inventory.peekItem();
        const itemOnTable = this.counterManager.getItemTypeOnCounter(targetX, targetY);
        
        if (itemInHand && itemOnTable) {
            // Essayer d'abord une recette (combinaison)
            const resultId = this.ingredientManager
                .getRecipeManager()
                .combineIngredients(itemInHand, itemOnTable);

            if (resultId) {
                console.log(`✨ Recette trouvée: ${itemInHand} + ${itemOnTable} = ${resultId}`);

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
                console.log(`❌ Aucune recette pour ${itemInHand} + ${itemOnTable}`);
            }
        }

        return false;
    }

    /**
     * Ramasse un objet d'un comptoir
     */
    private pickupFromCounter(targetX: number, targetY: number, player: PlayerManager): boolean {
        const inventory = player.getInventory();
        if (!inventory) return false;

        const itemType = this.counterManager.getItemTypeOnCounter(targetX, targetY);
        if (itemType) {
            this.counterManager.removeItemFromCounter(targetX, targetY);
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
    private placeOnCounter(targetX: number, targetY: number, player: PlayerManager): boolean {
        const inventory = player.getInventory();
        if (!inventory) return false;

        const itemType = inventory.peekItem();
        if (itemType && this.counterManager.placeItemOnCounter(targetX, targetY, itemType)) {
            inventory.removeItem();
            player.removeCarriedItem();
            console.log(`✅ Posé: ${itemType}`);
            return true;
        }
        return false;
    }
}

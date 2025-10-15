import Phaser from "phaser";
import { PlayerManager } from "../PlayerManager";
import { MapManager } from "../MapManager";
import { BaseInteractionHandler } from "../interfaces/IInteractionInterfaces";

/**
 * Gestionnaire spécialisé pour les interactions avec les ingrédients
 */
export class IngredientInteractionHandler extends BaseInteractionHandler {
    handleInteraction(targetX: number, targetY: number, player: PlayerManager): boolean {
        if (!this.mapManager.isIngredientTile(targetX, targetY)) {
            return false;
        }

        const inventory = player.getInventory();
        const playerSprite = player.getPlayer();
        if (!inventory || !playerSprite) return false;

        this.logInteraction("Interaction avec ingrédient", targetX, targetY);

        if (inventory.isEmpty()) {
            const ingredientType = this.mapManager.getIngredientFromTile(targetX, targetY);
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

    canInteract(targetX: number, targetY: number): boolean {
        return this.mapManager.isIngredientTile(targetX, targetY);
    }
}

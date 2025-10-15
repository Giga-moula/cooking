import Phaser from "phaser";
import { PlayerManager } from "../PlayerManager";
import { MapManager } from "../MapManager";
import { OvenManager } from "../OvenManager";
import { BaseInteractionHandler } from "../interfaces/IInteractionInterfaces";

/**
 * Gestionnaire spécialisé pour les interactions avec le four
 */
export class OvenInteractionHandler extends BaseInteractionHandler {
    private ovenManager: OvenManager;

    constructor(scene: Phaser.Scene, mapManager: MapManager, ovenManager: OvenManager) {
        super(scene, mapManager);
        this.ovenManager = ovenManager;
    }

    handleInteraction(targetX: number, targetY: number, player: PlayerManager): boolean {
        if (!this.mapManager.isOven(targetX, targetY)) {
            return false;
        }

        const inventory = player.getInventory();
        if (!inventory) return false;

        this.logInteraction("Interaction avec le four", targetX, targetY);

        const hasItemInOven = this.ovenManager.hasItemInOven(targetX, targetY);
        const inventoryEmpty = inventory.isEmpty();

        console.log(`État: Four=${hasItemInOven ? "plein" : "vide"}, Inventaire=${inventoryEmpty ? "vide" : "plein"}`);

        // Cas 1: Ramasser un objet du four
        if (hasItemInOven && inventoryEmpty) {
            return this.pickupFromOven(targetX, targetY, player);
        }

        // Cas 2: Poser un objet dans le four
        if (!hasItemInOven && !inventoryEmpty) {
            return this.placeInOven(targetX, targetY, player);
        }

        return false;
    }

    handleTransformation(targetX: number, targetY: number, player: PlayerManager): boolean {
        if (!this.mapManager.isOven(targetX, targetY)) {
            return false;
        }

        this.logInteraction("Tentative de cuisson", targetX, targetY);
        
        if (this.ovenManager.hasItemInOven(targetX, targetY)) {
            const success = this.ovenManager.performCooking(targetX, targetY);
            if (success) {
                console.log(`✅ Cuisson réussie dans le four`);
                return true;
            }
        }

        return false;
    }

    canInteract(targetX: number, targetY: number): boolean {
        return this.mapManager.isOven(targetX, targetY);
    }

    canTransform(targetX: number, targetY: number): boolean {
        return this.mapManager.isOven(targetX, targetY) && this.ovenManager.hasItemInOven(targetX, targetY);
    }

    private pickupFromOven(targetX: number, targetY: number, player: PlayerManager): boolean {
        const itemType = this.ovenManager.removeItemFromOven(targetX, targetY);
        if (itemType) {
            const inventory = player.getInventory();
            if (inventory) {
                inventory.addItem(itemType);
                player.updateCarriedItem();
                console.log(`✅ Ramassé du four: ${itemType}`);
                return true;
            }
        }
        return false;
    }

    private placeInOven(targetX: number, targetY: number, player: PlayerManager): boolean {
        const inventory = player.getInventory();
        if (!inventory) return false;

        const itemType = inventory.peekItem();
        if (itemType && this.ovenManager.placeItemInOven(targetX, targetY, itemType)) {
            inventory.removeItem();
            player.removeCarriedItem();
            console.log(`✅ Posé dans le four: ${itemType}`);
            return true;
        }
        return false;
    }
}

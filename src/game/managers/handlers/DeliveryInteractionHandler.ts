import Phaser from "phaser";
import { PlayerManager } from "../PlayerManager";
import { MapManager } from "../MapManager";
import { DeliveryManager } from "../DeliveryManager";
import { ScoreManager } from "../ScoreManager";
import { BaseInteractionHandler } from "../interfaces/IInteractionInterfaces";

/**
 * Gestionnaire spécialisé pour les interactions avec la zone de livraison
 */
export class DeliveryInteractionHandler extends BaseInteractionHandler {
    private deliveryManager: DeliveryManager;
    private scoreManager: ScoreManager;

    constructor(scene: Phaser.Scene, mapManager: MapManager, deliveryManager: DeliveryManager, scoreManager: ScoreManager) {
        super(scene, mapManager);
        this.deliveryManager = deliveryManager;
        this.scoreManager = scoreManager;
    }

    handleInteraction(targetX: number, targetY: number, player: PlayerManager): boolean {
        if (!this.mapManager.isDeliveryZone(targetX, targetY)) {
            return false;
        }

        const inventory = player.getInventory();
        if (!inventory || inventory.isEmpty()) {
            return false;
        }

        this.logInteraction("Interaction avec zone de livraison", targetX, targetY);

        const item = inventory.peekItem();
        if (item && this.deliveryManager.canDeliver(item)) {
            const deliveredItem = inventory.removeItem();
            if (deliveredItem) {
                player.removeCarriedItem();
                const points = this.deliveryManager.deliverItem(deliveredItem);
                this.scoreManager.addScore(points);
                console.log(`✅ Livré: ${deliveredItem} (+${points} points)`);
                return true;
            }
        }

        return false;
    }

    canInteract(targetX: number, targetY: number): boolean {
        return this.mapManager.isDeliveryZone(targetX, targetY);
    }
}

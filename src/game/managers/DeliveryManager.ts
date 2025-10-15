import Phaser from "phaser";
import { IsometricUtils } from "../utils/IsometricUtils";
import { MapManager } from "./MapManager";
import { VisualEffectsManager } from "./VisualEffectsManager";

/**
 * Gestionnaire du système de livraison
 */
export class DeliveryManager {
    private scene: Phaser.Scene;
    private deliveryZone: { x: number; y: number } = { x: 5, y: 6 };
    private deliveryZoneGraphics?: Phaser.GameObjects.Graphics;
    private mapOffsetX: number;
    private mapOffsetY: number;
    private mapManager?: MapManager;
    private visualEffects: VisualEffectsManager;

    constructor(scene: Phaser.Scene, mapOffsetX: number, mapOffsetY: number) {
        this.scene = scene;
        this.mapOffsetX = mapOffsetX;
        this.mapOffsetY = mapOffsetY;
        this.visualEffects = new VisualEffectsManager(scene, mapOffsetX, mapOffsetY);
    }

    /**
     * Définit le MapManager pour accéder aux informations de la carte
     */
    setMapManager(mapManager: MapManager): void {
        this.mapManager = mapManager;
    }

    /**
     * Initialise la zone de livraison
     */
    initializeDeliveryZone(): void {
        const screenPos = IsometricUtils.gridToScreen(
            this.deliveryZone.x,
            this.deliveryZone.y
        );
        const x = screenPos.x + this.mapOffsetX;
        const y = screenPos.y + this.mapOffsetY;

        this.deliveryZoneGraphics = this.scene.add.graphics();
        this.deliveryZoneGraphics.fillStyle(0xff6b6b, 0.3);
        this.deliveryZoneGraphics.fillRoundedRect(x - 24, y - 24, 48, 48, 8);
        this.deliveryZoneGraphics.lineStyle(3, 0xff6b6b, 0.8);
        this.deliveryZoneGraphics.strokeRoundedRect(x - 24, y - 24, 48, 48, 8);
        this.deliveryZoneGraphics.setDepth(100);

        // Texte "LIVRAISON"
        const deliveryText = this.scene.add.text(x, y - 30, "LIVRAISON", {
            fontFamily: "Arial",
            fontSize: "12px",
            color: "#FF6B6B",
            stroke: "#ffffff",
            strokeThickness: 2,
        });
        deliveryText.setOrigin(0.5);
        deliveryText.setDepth(101);
    }

    /**
     * Vérifie si une position est une zone de livraison
     */
    isDeliveryZone(gridX: number, gridY: number): boolean {
        const isDelivery =
            gridX === this.deliveryZone.x && gridY === this.deliveryZone.y;

        return isDelivery;
    }

    /**
     * Vérifie si le joueur est dans la zone de livraison
     */
    isInDeliveryZone(playerGridX: number, playerGridY: number): boolean {
        // Utiliser le MapManager si disponible, sinon utiliser la position par défaut
        if (this.mapManager) {
            return this.mapManager.isDeliveryZone(playerGridX, playerGridY);
        }
        
        return (
            playerGridX === this.deliveryZone.x &&
            playerGridY === this.deliveryZone.y
        );
    }

    /**
     * Vérifie si le joueur regarde vers la zone de livraison
     */
    isLookingAtDeliveryZone(
        playerGridX: number,
        playerGridY: number,
        lastDirection: { x: number; y: number }
    ): boolean {
        const targetX = playerGridX + lastDirection.x;
        const targetY = playerGridY + lastDirection.y;
        const isLooking = this.isDeliveryZone(targetX, targetY);

        return isLooking;
    }

    /**
     * Affiche un effet de succès pour la livraison
     */
    showDeliverySuccessEffect(): void {
        // Effet de particules
        this.visualEffects.showSuccessEffect(this.deliveryZone.x, this.deliveryZone.y);

        // Message de succès
        this.visualEffects.showTemporaryMessage({
            text: "✓ Livré !",
            gridX: this.deliveryZone.x,
            gridY: this.deliveryZone.y,
            fontSize: "20px",
            color: "#4CAF50",
            stroke: "#ffffff",
            strokeThickness: 3,
            duration: 2000,
            offsetY: -50,
        });
    }

    /**
     * Affiche un effet d'erreur pour la livraison
     */
    showDeliveryErrorEffect(): void {
        // Message d'erreur
        this.visualEffects.showTemporaryMessage({
            text: "❌ Pas de commande",
            gridX: this.deliveryZone.x,
            gridY: this.deliveryZone.y,
            fontSize: "16px",
            color: "#FF6B6B",
            stroke: "#ffffff",
            strokeThickness: 2,
            duration: 1500,
            offsetY: -50,
        });
    }

    // Getters
    getDeliveryZone(): { x: number; y: number } {
        return this.deliveryZone;
    }
}


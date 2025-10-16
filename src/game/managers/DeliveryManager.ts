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
     * Vérifie si une position est une zone de livraison
     * Utilise le MapManager pour vérifier la vraie position de la zone
     */
    isDeliveryZone(gridX: number, gridY: number): boolean {
        // Utiliser le MapManager si disponible pour vérifier la vraie position
        if (this.mapManager) {
            return this.mapManager.isDeliveryZone(gridX, gridY);
        }
        
        // Fallback sur la position hardcodée (pour compatibilité)
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
     * Récupère la vraie position de la zone de livraison
     */
    private getRealDeliveryZonePosition(): { x: number; y: number } {
        // Chercher la vraie position dans la carte générée
        if (this.mapManager) {
            const mapConfig = this.mapManager.getCurrentMapConfig();
            if (mapConfig && mapConfig.mapData) {
                for (let y = 0; y < mapConfig.mapData.length; y++) {
                    for (let x = 0; x < mapConfig.mapData[y].length; x++) {
                        if (mapConfig.mapData[y][x] === 9) { // Tile type 9 = zone de livraison
                            return { x, y };
                        }
                    }
                }
            }
        }
        
        // Fallback sur la position hardcodée
        return this.deliveryZone;
    }

    /**
     * Affiche un effet de succès pour la livraison
     */
    showDeliverySuccessEffect(): void {
        const position = this.getRealDeliveryZonePosition();
        
        // Effet de particules
        this.visualEffects.showSuccessEffect(position.x, position.y);

        // Message de succès
        this.visualEffects.showTemporaryMessage({
            text: "✓ Livré !",
            gridX: position.x,
            gridY: position.y,
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
        const position = this.getRealDeliveryZonePosition();
        
        // Message d'erreur
        this.visualEffects.showTemporaryMessage({
            text: "❌ Pas de commande",
            gridX: position.x,
            gridY: position.y,
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


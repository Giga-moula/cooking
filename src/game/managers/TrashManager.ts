import Phaser from "phaser";
import { IsometricUtils } from "../utils/IsometricUtils";
import { VisualEffectsManager } from "./VisualEffectsManager";

/**
 * Gestionnaire des interactions avec les poubelles
 */
export class TrashManager {
    private scene: Phaser.Scene;
    private mapOffsetX: number;
    private mapOffsetY: number;
    private visualEffects: VisualEffectsManager;

    constructor(scene: Phaser.Scene, mapOffsetX: number, mapOffsetY: number) {
        this.scene = scene;
        this.mapOffsetX = mapOffsetX;
        this.mapOffsetY = mapOffsetY;
        this.visualEffects = new VisualEffectsManager(scene, mapOffsetX, mapOffsetY);
    }

    /**
     * Vérifie si une position correspond à une poubelle
     */
    isTrash(gridX: number, gridY: number, mapData: number[][]): boolean {
        if (gridY < 0 || gridY >= mapData.length || gridX < 0 || gridX >= mapData[0].length) {
            return false;
        }
        return mapData[gridY][gridX] === 14; // ID de la poubelle
    }

    /**
     * Gère l'interaction avec la poubelle (jeter un objet)
     */
    handleTrashInteraction(
        player: any, // PlayerManager
        targetX: number,
        targetY: number,
        mapData: number[][]
    ): boolean {
        // Vérifier si c'est bien une poubelle
        if (!this.isTrash(targetX, targetY, mapData)) {
            return false;
        }

        // Vérifier si le joueur porte un objet
        const inventory = player.getInventory();
        if (inventory.isEmpty()) {
            return false;
        }

        // Récupérer l'objet porté
        const carriedItem = inventory.peekItem();
        if (!carriedItem) {
            return false;
        }

        // Supprimer l'objet de l'inventaire
        const removedItem = inventory.removeItem();
        if (!removedItem) {
            return false;
        }

        // Supprimer l'objet visuel porté
        inventory.removeCarriedItem();

        // Afficher un effet visuel de suppression
        this.showTrashEffect(targetX, targetY);

        return true;
    }

    /**
     * Affiche un effet visuel quand un objet est jeté dans la poubelle
     */
    private showTrashEffect(gridX: number, gridY: number): void {
        // Créer des particules pour l'effet de suppression
        this.visualEffects.showParticleEffect({
            gridX,
            gridY,
            texture: 'star',
            tint: 0x8B4513, // Couleur marron
            speed: { min: -80, max: 80 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.4, end: 0 },
            lifespan: 500,
            quantity: 8,
            blendMode: 'NORMAL'
        });
        
        // Créer un effet de son (si disponible)
        // this.scene.sound.play('trash-sound', { volume: 0.3 });
    }

    /**
     * Nettoie les ressources du TrashManager
     */
    cleanup(): void {
        // Pas de ressources spécifiques à nettoyer pour la poubelle
    }
}

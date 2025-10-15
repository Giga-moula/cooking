import Phaser from "phaser";
import { PlayerManager } from "../PlayerManager";
import { MapManager } from "../MapManager";

/**
 * Interface commune pour tous les managers d'interaction
 */
export interface IInteractionManager {
    handleInteraction(targetX: number, targetY: number, player: PlayerManager): boolean;
    canInteract(targetX: number, targetY: number): boolean;
}

/**
 * Interface pour les managers de transformation
 */
export interface ITransformationManager {
    handleTransformation(targetX: number, targetY: number, player: PlayerManager): boolean;
    canTransform(targetX: number, targetY: number): boolean;
}

/**
 * Classe de base pour les interactions
 */
export abstract class BaseInteractionHandler implements IInteractionManager {
    protected scene: Phaser.Scene;
    protected mapManager: MapManager;

    constructor(scene: Phaser.Scene, mapManager: MapManager) {
        this.scene = scene;
        this.mapManager = mapManager;
    }

    abstract handleInteraction(targetX: number, targetY: number, player: PlayerManager): boolean;
    abstract canInteract(targetX: number, targetY: number): boolean;

    protected logInteraction(type: string, targetX: number, targetY: number): void {
        console.log(`🎮 ${type} - Position: (${targetX}, ${targetY})`);
    }

    protected showMessage(message: string, x: number, y: number): void {
        // Méthode commune pour afficher des messages
        const text = this.scene.add.text(x, y, message, {
            fontFamily: "Arial",
            fontSize: "16px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 2,
        });
        text.setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: text,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy(),
        });
    }
}

import Phaser from "phaser";
import { IsometricUtils } from "../utils/IsometricUtils";

/**
 * Classe de base pour tous les managers qui utilisent des coordonnées de carte
 */
export abstract class BaseMapManager {
    protected scene: Phaser.Scene;
    protected mapOffsetX: number;
    protected mapOffsetY: number;

    constructor(scene: Phaser.Scene, mapOffsetX: number, mapOffsetY: number) {
        this.scene = scene;
        this.mapOffsetX = mapOffsetX;
        this.mapOffsetY = mapOffsetY;
    }

    /**
     * Convertit les coordonnées de grille en coordonnées d'écran
     */
    protected gridToScreen(gridX: number, gridY: number): { x: number; y: number } {
        const screenPos = IsometricUtils.gridToScreen(gridX, gridY);
        return {
            x: screenPos.x + this.mapOffsetX,
            y: screenPos.y + this.mapOffsetY
        };
    }

    /**
     * Génère une clé unique pour une position de grille
     */
    protected getGridKey(gridX: number, gridY: number): string {
        return `${gridX},${gridY}`;
    }

    /**
     * Affiche un message temporaire à une position donnée
     */
    protected showTemporaryMessage(
        text: string, 
        gridX: number, 
        gridY: number, 
        duration: number = 2000,
        offsetY: number = -50
    ): void {
        const screenPos = this.gridToScreen(gridX, gridY);
        const x = screenPos.x;
        const y = screenPos.y + offsetY;

        const message = this.scene.add.text(x, y, text, {
            fontFamily: "Arial",
            fontSize: "16px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 2,
        });
        message.setOrigin(0.5);

        this.scene.tweens.add({
            targets: message,
            y: y - 30,
            alpha: 0,
            duration: duration,
            ease: "Cubic.easeOut",
            onComplete: () => message.destroy(),
        });
    }

    /**
     * Crée un effet de particules à une position donnée
     */
    protected createParticleEffect(
        gridX: number, 
        gridY: number, 
        particleConfig: any = {}
    ): Phaser.GameObjects.Particles.ParticleEmitter {
        const screenPos = this.gridToScreen(gridX, gridY);
        const x = screenPos.x;
        const y = screenPos.y;

        const defaultConfig = {
            speed: { min: -50, max: 50 },
            angle: { min: 270, max: 90 },
            scale: { start: 0.3, end: 0 },
            lifespan: 800,
            quantity: 10,
            tint: 0xff4500,
            blendMode: "ADD",
        };

        const config = { ...defaultConfig, ...particleConfig };

        const particles = this.scene.add.particles(x, y, "star", config);

        this.scene.time.delayedCall(config.lifespan, () => {
            particles.destroy();
        });

        return particles;
    }

    /**
     * Log une action avec des coordonnées
     */
    protected logAction(action: string, gridX: number, gridY: number, details?: string): void {
        const detailsStr = details ? ` - ${details}` : '';
        console.log(`🎮 ${action} à (${gridX}, ${gridY})${detailsStr}`);
    }
}

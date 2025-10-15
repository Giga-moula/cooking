import Phaser from "phaser";
import { IsometricUtils } from "../utils/IsometricUtils";

/**
 * Configuration pour les messages temporaires
 */
export interface MessageConfig {
    text: string;
    gridX: number;
    gridY: number;
    fontSize?: string;
    color?: string;
    stroke?: string;
    strokeThickness?: number;
    duration?: number;
    offsetY?: number;
}

/**
 * Configuration pour les effets de particules
 */
export interface ParticleEffectConfig {
    gridX: number;
    gridY: number;
    texture?: string;
    tint?: number;
    speed?: { min: number; max: number };
    angle?: { min: number; max: number };
    scale?: { start: number; end: number };
    lifespan?: number;
    quantity?: number;
    blendMode?: string;
}

/**
 * Gestionnaire centralisé pour tous les effets visuels et messages du jeu
 * Évite la duplication de code pour l'affichage de messages et effets
 */
export class VisualEffectsManager {
    private scene: Phaser.Scene;
    private mapOffsetX: number;
    private mapOffsetY: number;

    constructor(scene: Phaser.Scene, mapOffsetX: number, mapOffsetY: number) {
        this.scene = scene;
        this.mapOffsetX = mapOffsetX;
        this.mapOffsetY = mapOffsetY;
    }

    /**
     * Affiche un message temporaire au-dessus d'une position de grille
     */
    showTemporaryMessage(config: MessageConfig): Phaser.GameObjects.Text {
        const screenPos = IsometricUtils.gridToScreen(config.gridX, config.gridY);
        const x = screenPos.x + this.mapOffsetX;
        const y = screenPos.y + this.mapOffsetY + (config.offsetY || -50);

        const text = this.scene.add.text(x, y, config.text, {
            fontFamily: "Arial",
            fontSize: config.fontSize || "24px",
            color: config.color || "#ffffff",
            stroke: config.stroke || "#000000",
            strokeThickness: config.strokeThickness || 4,
        });
        text.setOrigin(0.5);
        text.setDepth(1000);

        // Animation de montée et disparition
        const duration = config.duration || 1000;
        this.scene.tweens.add({
            targets: text,
            y: y - 30,
            alpha: 0,
            duration: duration,
            ease: "Cubic.easeOut",
            onComplete: () => {
                if (text && text.scene) {
                    text.destroy();
                }
            },
        });

        return text;
    }

    /**
     * Affiche un effet de particules à une position de grille
     */
    showParticleEffect(config: ParticleEffectConfig): Phaser.GameObjects.Particles.ParticleEmitter {
        const screenPos = IsometricUtils.gridToScreen(config.gridX, config.gridY);
        const x = screenPos.x + this.mapOffsetX;
        const y = screenPos.y + this.mapOffsetY;

        const particleConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
            speed: config.speed || { min: -100, max: 100 },
            angle: config.angle || { min: 0, max: 360 },
            scale: config.scale || { start: 0.5, end: 0 },
            lifespan: config.lifespan || 600,
            quantity: config.quantity || 15,
            blendMode: (config.blendMode as any) || "ADD",
        };

        if (config.tint !== undefined) {
            particleConfig.tint = config.tint;
        }

        const particles = this.scene.add.particles(
            x,
            y,
            config.texture || "star",
            particleConfig
        );

        const lifespan = config.lifespan || 600;
        this.scene.time.delayedCall(lifespan, () => {
            particles.destroy();
        });

        return particles;
    }

    /**
     * Affiche un effet de fusion (pour les recettes)
     */
    showFusionEffect(gridX: number, gridY: number): void {
        this.showParticleEffect({
            gridX,
            gridY,
            speed: { min: -100, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            lifespan: 600,
            quantity: 15,
            blendMode: "ADD",
        });
    }

    /**
     * Affiche un effet de cuisson pour le four (particules de feu)
     */
    showOvenCookingEffect(gridX: number, gridY: number): void {
        this.showParticleEffect({
            gridX,
            gridY,
            speed: { min: -50, max: 50 },
            angle: { min: 270, max: 90 }, // Particules qui montent
            scale: { start: 0.3, end: 0 },
            lifespan: 800,
            quantity: 10,
            tint: 0xff4500, // Couleur orange-rouge
            blendMode: "ADD",
        });
    }

    /**
     * Affiche un effet de cuisson pour la casserole (vapeur/bulles)
     */
    showCasseroleCookingEffect(gridX: number, gridY: number): void {
        this.showParticleEffect({
            gridX,
            gridY,
            speed: { min: -30, max: 30 },
            angle: { min: 270, max: 270 }, // Particules qui montent
            scale: { start: 0.2, end: 0 },
            lifespan: 1000,
            quantity: 8,
            tint: 0x87ceeb, // Couleur bleu ciel
            blendMode: "ADD",
        });
    }

    /**
     * Affiche un effet de succès (pour les livraisons)
     */
    showSuccessEffect(gridX: number, gridY: number): void {
        this.showParticleEffect({
            gridX,
            gridY,
            speed: { min: -100, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            lifespan: 1000,
            quantity: 20,
            blendMode: "ADD",
        });
    }

    /**
     * Affiche un message de combinaison/transformation
     */
    showCombinationMessage(text: string, gridX: number, gridY: number): void {
        this.showTemporaryMessage({
            text,
            gridX,
            gridY,
            fontSize: "24px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4,
            duration: 1000,
            offsetY: -50,
        });
    }

    /**
     * Affiche un message de cuisson
     */
    showCookingMessage(text: string, gridX: number, gridY: number): void {
        this.showTemporaryMessage({
            text,
            gridX,
            gridY,
            fontSize: "24px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4,
            duration: 1000,
            offsetY: -50,
        });
    }
}


import Phaser from "phaser";
import { RecipeBox } from "./RecipeBox";

/**
 * Gestionnaire des effets visuels pour les commandes
 */
export class OrderVisualEffects {
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * Affiche un effet de succès quand une commande est complétée
     */
    showOrderCompleteEffect(box: RecipeBox): void {
        const x = box.container.x + 60;
        const y = box.container.y + 70;

        // Effet de particules
        this.createParticleEffect(x, y);
    }

    /**
     * Affiche un effet quand une recette expire
     */
    showRecipeExpiredEffect(box: RecipeBox): void {
        const x = box.container.x + 60;
        const y = box.container.y + 70;

        // Message d'expiration
        this.createExpirationMessage(x, y - 20);

        // Effet de secousse
        box.shake();
    }

    /**
     * Crée un effet de particules
     */
    private createParticleEffect(x: number, y: number): void {
        try {
            const particles = this.scene.add.particles(x, y, "star", {
                speed: { min: -50, max: 50 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.3, end: 0 },
                lifespan: 800,
                quantity: 10,
                blendMode: "ADD",
            });

            this.scene.time.delayedCall(800, () => {
                particles.destroy();
            });
        } catch (e) {
            console.warn("Effet de particules non disponible");
        }
    }

    /**
     * Crée un message d'expiration
     */
    private createExpirationMessage(x: number, y: number): void {
        const message = this.scene.add.text(
            x,
            y,
            "❌ Recette ratée ! Continuez !",
            {
                fontFamily: "Arial",
                fontSize: "16px",
                color: "#F44336",
                stroke: "#ffffff",
                strokeThickness: 2,
            }
        );
        message.setOrigin(0.5);
        message.setScrollFactor(0);
        message.setDepth(3000);

        this.scene.tweens.add({
            targets: message,
            y: y - 20,
            alpha: 0,
            duration: 1500,
            ease: "Cubic.easeOut",
            onComplete: () => message.destroy(),
        });
    }
}


import Phaser from "phaser";

/**
 * Gestionnaire du système de score
 */
export class ScoreManager {
    private scene: Phaser.Scene;
    private score: number = 0;
    private scoreText?: Phaser.GameObjects.Text;
    private totalDeliveries: number = 0;
    private scoreMultiplier: number = 1.0;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * Initialise l'affichage du score
     */
    initializeScoreDisplay(x: number = 855, y: number = 60): void {
        this.scoreText = this.scene.add.text(x, y, "Score: 0", {
            fontFamily: "Arial",
            fontSize: "24px",
            color: "#FFD700", // Or
            stroke: "#000000",
            strokeThickness: 3,
        });
        this.scoreText.setScrollFactor(0);
        this.scoreText.setDepth(2000);
    }

    /**
     * Met à jour l'affichage du score
     */
    updateScoreDisplay(): void {
        if (this.scoreText) {
            this.scoreText.setText(`Score: ${this.score}`);
        }
    }

    /**
     * Ajoute des points au score
     */
    addScore(points: number, reason: string = ""): void {
        const pointsToAdd = points * this.scoreMultiplier;
        this.score += pointsToAdd;
        this.totalDeliveries++;

        this.updateScoreDisplay();
        this.showScoreEffect(pointsToAdd);
    }

    /**
     * Affiche un effet visuel pour les points gagnés
     */
    showScoreEffect(points: number): void {
        if (!this.scoreText) return;

        // Texte flottant pour les points
        const scoreEffect = this.scene.add.text(
            this.scoreText.x + 100,
            this.scoreText.y,
            `+${points}`,
            {
                fontFamily: "Arial",
                fontSize: "20px",
                color: "#00FF00", // Vert
                stroke: "#000000",
                strokeThickness: 2,
            }
        );
        scoreEffect.setScrollFactor(0);
        scoreEffect.setDepth(3000);

        // Animation de montée et disparition
        this.scene.tweens.add({
            targets: scoreEffect,
            y: scoreEffect.y - 30,
            alpha: 0,
            duration: 1500,
            ease: "Cubic.easeOut",
            onComplete: () => scoreEffect.destroy(),
        });

        // Animation de pulsation du score principal
        this.scene.tweens.add({
            targets: this.scoreText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            yoyo: true,
            ease: "Cubic.easeInOut",
        });
    }

    /**
     * Calcule les points pour une recette donnée
     */
    calculateRecipePoints(dishId: string): number {
        const basePoints: { [key: string]: number } = {
            cookie: 100,
        };

        const points = basePoints[dishId] || 50;
        return Math.floor(points * this.scoreMultiplier);
    }

    /**
     * Applique un multiplicateur de score (depuis les upgrades)
     */
    applyScoreMultiplier(multiplier: number): void {
        this.scoreMultiplier = multiplier;
    }

    // Getters
    getScore(): number {
        return this.score;
    }

    getTotalDeliveries(): number {
        return this.totalDeliveries;
    }

    getScoreMultiplier(): number {
        return this.scoreMultiplier;
    }

    // Setters
    setScoreMultiplier(multiplier: number): void {
        this.scoreMultiplier = multiplier;
    }

    /**
     * Nettoie le manager (reset complet)
     */
    public cleanup(): void {
        this.score = 0;
        this.totalDeliveries = 0;
        this.scoreMultiplier = 1.0;
        if (this.scoreText) {
            this.scoreText.destroy();
            this.scoreText = undefined;
        }
    }
}


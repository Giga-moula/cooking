import Phaser from "phaser";

/**
 * Gestionnaire des vies du joueur
 * Gère l'affichage et la logique des vies (3 vies au total)
 */
export class LivesManager {
    private scene: Phaser.Scene;
    private lives: number = 3;
    private maxLives: number = 3;
    private hearts: Phaser.GameObjects.Image[] = [];
    private livesText?: Phaser.GameObjects.Text;
    private onGameOver?: () => void;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * Initialise l'affichage des vies
     */
    public initializeLivesDisplay(x: number = 50, y: number = 50): void {
        // Créer les cœurs pour représenter les vies
        for (let i = 0; i < this.maxLives; i++) {
            const heart = this.scene.add.image(x + i * 50, y, "heart");
            heart.setScale(0.04);
            heart.setScrollFactor(0);
            heart.setDepth(2000);
            this.hearts.push(heart);
        }

        // Mettre à jour l'affichage initial
        this.updateLivesDisplay();
    }

    /**
     * Perd une vie
     */
    public loseLife(): void {
        if (this.lives > 0) {
            this.lives--;
            this.updateLivesDisplay();

            // Si plus de vies, déclencher le game over
            if (this.lives <= 0 && this.onGameOver) {
                this.onGameOver();
            }
        }
    }

    /**
     * Gagne une vie (bonus)
     */
    public gainLife(): void {
        if (this.lives < this.maxLives) {
            this.lives++;
            this.updateLivesDisplay();
        }
    }

    /**
     * Remet toutes les vies
     */
    public resetLives(): void {
        this.lives = this.maxLives;
        this.updateLivesDisplay();
    }

    /**
     * Met à jour l'affichage des vies
     */
    private updateLivesDisplay(): void {
        for (let i = 0; i < this.hearts.length; i++) {
            if (i < this.lives) {
                // Vie présente - cœur plein
                this.hearts[i].setAlpha(1);
                this.hearts[i].setTint(0xffffff); // Couleur normale
            } else {
                // Vie perdue - cœur grisé
                this.hearts[i].setAlpha(0.3);
                this.hearts[i].setTint(0x666666); // Gris
            }
        }
    }

    /**
     * Définit le callback de game over
     */
    public setGameOverCallback(callback: () => void): void {
        this.onGameOver = callback;
    }

    /**
     * Obtient le nombre de vies restantes
     */
    public getLives(): number {
        return this.lives;
    }

    /**
     * Obtient le nombre maximum de vies
     */
    public getMaxLives(): number {
        return this.maxLives;
    }

    /**
     * Vérifie si le joueur est encore en vie
     */
    public isAlive(): boolean {
        return this.lives > 0;
    }

    /**
     * Nettoyage
     */
    public cleanup(): void {
        this.hearts.forEach((heart) => heart.destroy());
        this.hearts = [];
        if (this.livesText) {
            this.livesText.destroy();
            this.livesText = undefined;
        }
    }
}


import Phaser from "phaser";

/**
 * Informations sur les gains d'une vague
 */
export interface WaveEarnings {
    baseReward: number; // Récompense de base par recette
    timeBonus: number; // Bonus pour avoir terminé rapidement
    comboBonus: number; // Bonus pour enchaîner les livraisons
    recipeBonus: number; // Bonus selon le type de recette
    total: number; // Total gagné
}

/**
 * Gestionnaire de la monnaie du jeu
 */
export class CurrencyManager {
    private scene: Phaser.Scene;
    private totalCoins: number = 0;
    private coinsText?: Phaser.GameObjects.Text;
    private startCoins: number = 0; // Argent de départ

    constructor(scene: Phaser.Scene, startingCoins: number = 0) {
        this.scene = scene;
        this.totalCoins = startingCoins;
        this.startCoins = startingCoins;
    }

    /**
     * Initialise l'affichage de la monnaie
     */
    public initializeCoinDisplay(x: number = 850, y: number = 20): void {
        this.coinsText = this.scene.add.text(
            x,
            y,
            `💰 ${this.totalCoins} coins`,
            {
                fontFamily: "Arial Black",
                fontSize: "24px",
                color: "#FFD700",
                stroke: "#8B4513",
                strokeThickness: 4,
            }
        );
        this.coinsText.setScrollFactor(0);
        this.coinsText.setDepth(2500);
    }

    /**
     * Calcule les gains d'une vague
     */
    public calculateWaveEarnings(
        completedRecipes: number,
        timeSpent: number,
        maxTime: number,
        recipeTypes: string[],
        difficulty: string
    ): WaveEarnings {
        // Récompense de base : 50 coins par recette
        const baseReward = completedRecipes * 50;

        // Bonus de temps : plus c'est rapide, plus on gagne
        const timeRatio = maxTime > 0 ? timeSpent / maxTime : 1;
        let timeBonus = 0;
        if (timeRatio < 0.5) {
            timeBonus = Math.floor(completedRecipes * 50); // Très rapide !
        } else if (timeRatio < 0.75) {
            timeBonus = Math.floor(completedRecipes * 25); // Rapide
        } else if (timeRatio < 1.0) {
            timeBonus = Math.floor(completedRecipes * 10); // Normal
        }

        // Bonus de combo : récompense pour l'efficacité
        const comboBonus = Math.floor(completedRecipes * 5);

        // Bonus selon les recettes (les recettes complexes rapportent plus)
        let recipeBonus = 0;
        recipeTypes.forEach((recipeId) => {
            if (recipeId.includes("choco-cara")) {
                recipeBonus += 30; // Recette combo
            } else if (recipeId.includes("cara")) {
                recipeBonus += 15; // Recette caramel
            } else {
                recipeBonus += 10; // Recette simple
            }
        });

        // Multiplicateur de difficulté
        const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);
        const total = Math.floor(
            (baseReward + timeBonus + comboBonus + recipeBonus) *
                difficultyMultiplier
        );
        return {
            baseReward,
            timeBonus,
            comboBonus,
            recipeBonus,
            total,
        };
    }

    /**
     * Obtient le multiplicateur de difficulté
     */
    private getDifficultyMultiplier(difficulty: string): number {
        const multipliers: { [key: string]: number } = {
            easy: 1.0,
            medium: 1.25,
            hard: 1.5,
            extreme: 2.0,
        };
        return multipliers[difficulty] || 1.0;
    }

    /**
     * Ajoute des coins au total
     */
    public addCoins(amount: number): void {
        this.totalCoins += amount;
        this.updateDisplay();

        // Animation de gain
        this.animateCoinGain(amount);
    }

    /**
     * Retire des coins (pour les achats)
     */
    public spendCoins(amount: number): boolean {
        if (amount > this.totalCoins) {
            return false; // Pas assez de coins
        }
        this.totalCoins -= amount;
        this.updateDisplay();
        return true;
    }

    /**
     * Vérifie si on a assez de coins
     */
    public canAfford(amount: number): boolean {
        return this.totalCoins >= amount;
    }

    /**
     * Obtient le nombre total de coins
     */
    public getTotalCoins(): number {
        return this.totalCoins;
    }

    /**
     * Met à jour l'affichage
     */
    private updateDisplay(): void {
        if (this.coinsText) {
            this.coinsText.setText(`💰 ${this.totalCoins} coins`);
        }
    }

    /**
     * Animation de gain de coins
     */
    private animateCoinGain(amount: number): void {
        if (!this.coinsText) return;

        // Créer un texte temporaire pour l'animation
        const gainText = this.scene.add.text(
            this.coinsText.x,
            this.coinsText.y + 40,
            `+${amount}`,
            {
                fontFamily: "Arial Black",
                fontSize: "28px",
                color: "#00FF00",
                stroke: "#004400",
                strokeThickness: 3,
            }
        );
        gainText.setScrollFactor(0);
        gainText.setDepth(2600);
        gainText.setAlpha(0);

        // Animation de montée et disparition
        this.scene.tweens.add({
            targets: gainText,
            y: gainText.y - 50,
            alpha: 1,
            duration: 800,
            ease: "Cubic.easeOut",
            onComplete: () => {
                this.scene.tweens.add({
                    targets: gainText,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => gainText.destroy(),
                });
            },
        });

        // Animation de pulsation sur le texte principal
        this.scene.tweens.add({
            targets: this.coinsText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            yoyo: true,
            ease: "Back.easeOut",
        });
    }

    /**
     * Réinitialise la monnaie
     */
    public reset(): void {
        this.totalCoins = this.startCoins;
        this.updateDisplay();
    }

    /**
     * Détruit l'affichage
     */
    public destroy(): void {
        if (this.coinsText) {
            this.coinsText.destroy();
        }
    }

    /**
     * Nettoie le manager (reset complet)
     */
    public cleanup(): void {
        this.totalCoins = 0;
        this.startCoins = 0;
        if (this.coinsText) {
            this.coinsText.destroy();
            this.coinsText = undefined;
        }
    }
}

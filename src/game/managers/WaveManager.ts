import Phaser from "phaser";
import { OrderDisplayManager } from "./OrderDisplayManager";
import { RecipeManager } from "./RecipeManager";
import { ScoreManager } from "./ScoreManager";

// Configuration d'une vague
export interface WaveConfig {
    waveNumber: number;
    name: string;
    targetRecipes: number; // Nombre de recettes à compléter
    orderCount: number; // Nombre de commandes simultanées
    orderDuration: number; // Durée de chaque commande (secondes)
    difficulty: "easy" | "medium" | "hard" | "extreme";
    unlockedRecipe?: string; // Nouvelle recette débloquée
    description: string; // Description de la vague
    specificRecipes: string[]; // Recettes spécifiques pour cette vague (obligatoire)
}

// État d'une vague
interface WaveState {
    currentWave: number;
    completedRecipes: number;
    isActive: boolean;
    startTime: number;
    completedWaves: number[];
}

/**
 * Gestionnaire du système de vagues
 */
export class WaveManager {
    private scene: Phaser.Scene;
    private orderDisplayManager: OrderDisplayManager;
    private scoreManager: ScoreManager;
    private recipeManager: RecipeManager;

    private waveState: WaveState;
    private waves: WaveConfig[];
    private currentWaveConfig: WaveConfig | null = null;

    // Pas d'interface séparée - on utilise les boîtes de recettes

    constructor(
        scene: Phaser.Scene,
        orderDisplayManager: OrderDisplayManager,
        scoreManager: ScoreManager,
        recipeManager: RecipeManager
    ) {
        this.scene = scene;
        this.orderDisplayManager = orderDisplayManager;
        this.scoreManager = scoreManager;
        this.recipeManager = recipeManager;

        this.waveState = {
            currentWave: 1,
            completedRecipes: 0,
            isActive: false,
            startTime: 0,
            completedWaves: [],
        };

        this.initializeWaves();
    }

    /**
     * Initialise la configuration des vagues
     */
    private initializeWaves(): void {
        this.waves = [
            {
                waveNumber: 1,
                name: "Premiers pas",
                targetRecipes: 1,
                orderCount: 1,
                orderDuration: 45,
                difficulty: "easy",
                unlockedRecipe: "dough",
                description: "Apprenez les bases de la cuisine !",
                specificRecipes: ["cookie-choco"],
            },
            {
                waveNumber: 2,
                name: "Service du midi",
                targetRecipes: 2,
                orderCount: 2,
                orderDuration: 35,
                difficulty: "easy",
                unlockedRecipe: "cookie-choco",
                description: "Le rush commence !",
                specificRecipes: ["cookie-choco", "cookie-choco"],
            },
        ];
    }

    /**
     * Initialise l'affichage des vagues (maintenant intégré dans les boîtes de recettes)
     */
    public initializeWaveDisplay(): void {
        // Plus besoin d'interface séparée - tout se passe dans les boîtes de recettes
        console.log(
            "🌊 Système de vagues initialisé - affichage intégré dans les boîtes de recettes"
        );
    }

    /**
     * Démarre une vague
     */
    public startWave(waveNumber: number = this.waveState.currentWave): void {
        const waveConfig = this.waves.find((w) => w.waveNumber === waveNumber);
        if (!waveConfig) {
            console.error(`Vague ${waveNumber} non trouvée`);
            return;
        }

        this.currentWaveConfig = waveConfig;
        this.waveState.currentWave = waveNumber;
        this.waveState.completedRecipes = 0;
        this.waveState.isActive = true;
        this.waveState.startTime = this.scene.time.now;

        // Configurer l'OrderDisplayManager selon la vague
        this.orderDisplayManager.setOrderDuration(waveConfig.orderDuration);
        this.orderDisplayManager.setMaxOrders(waveConfig.targetRecipes); // Utiliser le nombre de recettes de la vague

        // Créer exactement le nombre de boîtes nécessaires pour cette vague
        this.orderDisplayManager.createBoxesForWave(waveConfig.targetRecipes);

        // Générer les recettes de la vague (une par boîte)
        this.generateWaveRecipes();

        console.log(
            `🌊 Vague ${waveNumber} démarrée: ${waveConfig.name} - ${waveConfig.targetRecipes} recettes à faire`
        );
    }

    /**
     * Génère les recettes pour la vague actuelle (une par boîte)
     */
    private generateWaveRecipes(): void {
        if (!this.currentWaveConfig) return;

        // Vérifier que des recettes spécifiques sont définies
        if (
            !this.currentWaveConfig.specificRecipes ||
            this.currentWaveConfig.specificRecipes.length === 0
        ) {
            console.error(
                `Aucune recette spécifique définie pour la vague ${this.currentWaveConfig.waveNumber}`
            );
            return;
        }

        // Utiliser les recettes spécifiques
        for (let i = 0; i < this.currentWaveConfig.targetRecipes; i++) {
            const recipeId = this.currentWaveConfig.specificRecipes[i];
            if (recipeId) {
                // Trouver le plat correspondant
                const dishes = this.recipeManager.getDishes();
                const dish = dishes.find((d) => d.id === recipeId);

                if (dish) {
                    this.orderDisplayManager.assignRecipeToBox(i, dish);
                } else {
                    console.warn(
                        `Plat non trouvé pour la recette: ${recipeId}`
                    );
                }
            }
        }
    }

    /**
     * Marque une recette comme complétée
     */
    public completeRecipe(): void {
        if (!this.waveState.isActive || !this.currentWaveConfig) return;

        this.waveState.completedRecipes++;
        // Plus besoin d'updateWaveDisplay

        // Vérifier si la vague est terminée
        if (
            this.waveState.completedRecipes >=
            this.currentWaveConfig.targetRecipes
        ) {
            this.completeWave();
        }
    }

    /**
     * Termine la vague actuelle
     */
    private completeWave(): void {
        if (!this.currentWaveConfig) return;

        this.waveState.isActive = false;
        this.waveState.completedWaves.push(this.currentWaveConfig.waveNumber);

        // Calculer le score de la vague
        const waveScore = this.calculateWaveScore();
        this.scoreManager.addScore(waveScore);

        // Passer à la vague suivante après un délai
        this.scene.time.delayedCall(3000, () => {
            this.startNextWave();
        });
    }

    /**
     * Démarre la vague suivante
     */
    private startNextWave(): void {
        const nextWaveNumber = this.waveState.currentWave + 1;
        const nextWave = this.waves.find(
            (w) => w.waveNumber === nextWaveNumber
        );

        if (nextWave) {
            this.startWave(nextWaveNumber);
        } else {
            // Toutes les vagues sont terminées
            this.showGameComplete();
        }
    }

    /**
     * Calcule le score de la vague
     */
    private calculateWaveScore(): number {
        if (!this.currentWaveConfig) return 0;

        const baseScore = this.currentWaveConfig.targetRecipes * 100;
        const difficultyMultiplier = this.getDifficultyMultiplier(
            this.currentWaveConfig.difficulty
        );
        const timeBonus = this.calculateTimeBonus();

        return Math.floor(baseScore * difficultyMultiplier + timeBonus);
    }

    /**
     * Obtient le multiplicateur de difficulté
     */
    private getDifficultyMultiplier(difficulty: string): number {
        const multipliers = {
            easy: 1.0,
            medium: 1.5,
            hard: 2.0,
            extreme: 3.0,
        };
        return multipliers[difficulty as keyof typeof multipliers] || 1.0;
    }

    /**
     * Calcule le bonus de temps
     */
    private calculateTimeBonus(): number {
        if (!this.currentWaveConfig) return 0;

        const elapsedTime =
            (this.scene.time.now - this.waveState.startTime) / 1000;
        const targetTime = this.currentWaveConfig.targetRecipes * 30; // 30s par recette en moyenne

        if (elapsedTime < targetTime) {
            return Math.floor((targetTime - elapsedTime) * 10);
        }
        return 0;
    }

    /**
     * Affiche la fin du jeu
     */
    private showGameComplete(): void {
        // Toutes les vagues sont terminées - pas de message affiché
    }

    // Plus besoin d'updateWaveDisplay - l'affichage est intégré dans les boîtes

    /**
     * Obtient l'état actuel des vagues
     */
    public getWaveState(): WaveState {
        return { ...this.waveState };
    }

    /**
     * Obtient la configuration de la vague actuelle
     */
    public getCurrentWaveConfig(): WaveConfig | null {
        return this.currentWaveConfig;
    }

    /**
     * Redémarre le système de vagues
     */
    public restart(): void {
        this.waveState = {
            currentWave: 1,
            completedRecipes: 0,
            isActive: false,
            startTime: 0,
            completedWaves: [],
        };
        this.currentWaveConfig = null;
    }
}


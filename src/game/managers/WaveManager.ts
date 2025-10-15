import Phaser from "phaser";
import { OrderDisplayManager } from "./OrderDisplayManager";
import { RecipeManager } from "./RecipeManager";
import { ScoreManager } from "./ScoreManager";

// Configuration d'une vague
export interface WaveConfig {
    waveNumber: number;
    name: string;
    targetRecipes: number; // Nombre de recettes à compléter
    orderCount: number; // Nombre de commandes simultanées max
    orderDuration: number; // Durée de chaque commande (secondes)
    difficulty: "easy" | "medium" | "hard" | "extreme";
    unlockedRecipe?: string; // Nouvelle recette débloquée
    description: string; // Description de la vague
    specificRecipes: string[]; // Recettes spécifiques pour cette vague (obligatoire)
    orderSpawnDelay?: number; // Délai entre l'apparition de nouvelles commandes (secondes)
    ordersPerSpawn?: number; // Nombre de commandes qui apparaissent à chaque spawn
}

// État d'une vague
interface WaveState {
    currentWave: number;
    completedRecipes: number;
    isActive: boolean;
    startTime: number;
    completedWaves: number[];
    pendingOrderIndex: number; // Index de la prochaine commande à faire apparaître
    currentActiveOrders: number; // Nombre de commandes actuellement affichées
    completedRecipeIds: string[]; // IDs des recettes complétées dans cette vague
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
    private orderSpawnTimer?: Phaser.Time.TimerEvent; // Timer pour l'apparition progressive des commandes

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
            pendingOrderIndex: 0,
            currentActiveOrders: 0,
            completedRecipeIds: [],
        };

        this.initializeWaves();
    }

    /**
     * Initialise la configuration des vagues
     */
    private initializeWaves(): void {
        this.waves = [
            // VAGUE 1 - Premier cookie chocolat
            {
                waveNumber: 1,
                name: "Premier cookie",
                targetRecipes: 1,
                orderCount: 4, // Maximum 4 commandes simultanées (fixe)
                orderDuration: 60,
                difficulty: "easy",
                unlockedRecipe: "cookie-choco",
                description: "Créez votre premier cookie chocolat !",
                specificRecipes: ["cookie-choco", "cookie-choco", "cookie-choco"],
                orderSpawnDelay: 15, // Une commande toutes les 15 secondes
                ordersPerSpawn: 1, // 1 commande à la fois
            },

            // VAGUE 2 - Cookie caramel
            {
                waveNumber: 2,
                name: "Cookie caramel",
                targetRecipes: 4,
                orderCount: 4, // Maximum 4 commandes simultanées (fixe)
                orderDuration: 50,
                difficulty: "easy",
                unlockedRecipe: "cookie-cara",
                description: "Créez des cookies caramel !",
                specificRecipes: ["cookie-choco", "cookie-cara", "cookie-choco", "cookie-cara"],
                orderSpawnDelay: 14, // 14 secondes
                ordersPerSpawn: 1,
            },

            // VAGUE 3 - Mélange des saveurs
            {
                waveNumber: 3,
                name: "Mélange des saveurs",
                targetRecipes: 5,
                orderCount: 4, // Maximum 4 commandes simultanées (fixe)
                orderDuration: 45,
                difficulty: "medium",
                unlockedRecipe: "cookie-choco-cara",
                description: "Combinez chocolat et caramel !",
                specificRecipes: [
                    "cookie-choco",
                    "cookie-cara",
                    "cookie-choco-cara",
                    "cookie-choco",
                    "cookie-cara",
                ],
                orderSpawnDelay: 13, // 13 secondes
                ordersPerSpawn: 1,
            },

            // VAGUE 4 - Accélération
            {
                waveNumber: 4,
                name: "Accélération",
                targetRecipes: 6,
                orderCount: 4, // Maximum 4 commandes simultanées (fixe)
                orderDuration: 40,
                difficulty: "medium",
                description: "Le rythme s'accélère !",
                specificRecipes: [
                    "cookie-choco",
                    "cookie-cara",
                    "cookie-choco-cara",
                    "cookie-choco",
                    "cookie-cara",
                    "cookie-choco-cara",
                ],
                orderSpawnDelay: 12, // 12 secondes
                ordersPerSpawn: 1,
            },

            // VAGUE 5 - Défi
            {
                waveNumber: 5,
                name: "Défi",
                targetRecipes: 7,
                orderCount: 4, // Maximum 4 commandes simultanées (fixe)
                orderDuration: 35,
                difficulty: "hard",
                description: "Restez concentré !",
                specificRecipes: [
                    "cookie-choco",
                    "cookie-cara",
                    "cookie-choco-cara",
                    "cookie-choco",
                    "cookie-cara",
                    "cookie-choco-cara",
                    "cookie-choco",
                ],
                orderSpawnDelay: 11, // 11 secondes
                ordersPerSpawn: 1,
            },

            // VAGUE 6 - Chaos
            {
                waveNumber: 6,
                name: "Chaos",
                targetRecipes: 8,
                orderCount: 4, // Maximum 4 commandes simultanées (fixe)
                orderDuration: 30,
                difficulty: "hard",
                description: "Les commandes arrivent par paires !",
                specificRecipes: [
                    "cookie-choco",
                    "cookie-cara",
                    "cookie-choco-cara",
                    "cookie-choco",
                    "cookie-cara",
                    "cookie-choco-cara",
                    "cookie-choco",
                    "cookie-cara",
                ],
                orderSpawnDelay: 10, // 10 secondes (minimum)
                ordersPerSpawn: 2, // 2 commandes en même temps !
            },

            // VAGUE 7 - Extrême
            {
                waveNumber: 7,
                name: "Extrême",
                targetRecipes: 10,
                orderCount: 4, // Maximum 4 commandes simultanées (fixe)
                orderDuration: 25,
                difficulty: "extreme",
                description: "Défi ultime !",
                specificRecipes: [
                    "cookie-choco",
                    "cookie-cara",
                    "cookie-choco-cara",
                    "cookie-choco",
                    "cookie-cara",
                    "cookie-choco-cara",
                    "cookie-choco",
                    "cookie-cara",
                    "cookie-choco-cara",
                    "cookie-choco",
                ],
                orderSpawnDelay: 10, // 10 secondes (minimum)
                ordersPerSpawn: 2,
            },
        ];
    }

    /**
     * Initialise l'affichage des vagues (maintenant intégré dans les boîtes de recettes)
     */
    public initializeWaveDisplay(): void {
        // Plus besoin d'interface séparée - tout se passe dans les boîtes de recettes
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

        // Arrêter le timer existant s'il y en a un
        if (this.orderSpawnTimer) {
            this.orderSpawnTimer.destroy();
            this.orderSpawnTimer = undefined;
        }

        this.currentWaveConfig = waveConfig;
        this.waveState.currentWave = waveNumber;
        this.waveState.completedRecipes = 0;
        this.waveState.isActive = true;
        this.waveState.startTime = this.scene.time.now;
        this.waveState.pendingOrderIndex = 0;
        this.waveState.currentActiveOrders = 0;
        this.waveState.completedRecipeIds = []; // Réinitialiser les recettes complétées

        // Configurer l'OrderDisplayManager selon la vague
        this.orderDisplayManager.setOrderDuration(waveConfig.orderDuration);
        this.orderDisplayManager.setMaxOrders(waveConfig.orderCount); // Nombre max de commandes simultanées

        // Nettoyer les boîtes existantes
        this.orderDisplayManager.clearAllBoxes();

        // Faire apparaître les premières commandes immédiatement
        this.spawnNextOrders();

        // Démarrer le timer pour l'apparition progressive
        this.startOrderSpawnTimer();
    }

    /**
     * Démarre le timer pour l'apparition progressive des commandes
     */
    private startOrderSpawnTimer(): void {
        if (!this.currentWaveConfig) return;

        const spawnDelay = (this.currentWaveConfig.orderSpawnDelay || 15) * 1000;

        this.orderSpawnTimer = this.scene.time.addEvent({
            delay: spawnDelay,
            callback: () => this.spawnNextOrders(),
            callbackScope: this,
            loop: true,
        });
    }

    /**
     * Fait apparaître la/les prochaine(s) commande(s)
     */
    private spawnNextOrders(): void {
        if (!this.currentWaveConfig) return;

        const ordersPerSpawn = this.currentWaveConfig.ordersPerSpawn || 1;
        const maxSimultaneous = this.currentWaveConfig.orderCount;

        // Faire apparaître plusieurs commandes si nécessaire
        for (let i = 0; i < ordersPerSpawn; i++) {
            // Vérifier qu'on n'a pas atteint la limite de commandes simultanées
            if (this.waveState.currentActiveOrders >= maxSimultaneous) {
                break;
            }

            // Vérifier qu'il reste des commandes à faire apparaître
            if (this.waveState.pendingOrderIndex >= this.currentWaveConfig.targetRecipes) {
                // Arrêter le timer
                if (this.orderSpawnTimer) {
                    this.orderSpawnTimer.destroy();
                    this.orderSpawnTimer = undefined;
                }
                break;
            }

            // Créer la commande
            this.spawnSingleOrder(this.waveState.pendingOrderIndex);
            this.waveState.pendingOrderIndex++;
            this.waveState.currentActiveOrders++;
        }
    }

    /**
     * Fait apparaître une seule commande
     */
    private spawnSingleOrder(orderIndex: number): void {
        if (!this.currentWaveConfig) return;

        const recipeId = this.currentWaveConfig.specificRecipes[orderIndex];
        if (!recipeId) return;

        // Trouver la recette qui produit le cookie-mix correspondant
        const allRecipes = this.recipeManager.getAllRecipes();
        let recipe = allRecipes.find((r) => r.result === recipeId);

        // Si c'est un cookie cuit, trouver la recette du cookie-mix correspondant
        if (
            !recipe &&
            recipeId.includes("cookie-") &&
            !recipeId.includes("cookie-mix-")
        ) {
            const cookieMixId = recipeId.replace("cookie-", "cookie-mix-");
            recipe = allRecipes.find((r) => r.result === cookieMixId);
        }

        if (recipe) {
            // Créer un objet recette avec le cookie cuit comme résultat mais les ingrédients du cookie-mix
            const displayRecipe = {
                ...recipe,
                result: recipeId, // Afficher le cookie cuit
                displayIngredients: [
                    recipe.ingredient1,
                    recipe.ingredient2,
                ], // Mais garder les ingrédients du cookie-mix
            };
            
            // Ajouter la commande progressivement
            this.orderDisplayManager.addNewOrder(displayRecipe);
            
        } else {
            console.warn(`Recette non trouvée pour le plat: ${recipeId}`);
        }
    }

    /**
     * Marque une recette comme complétée
     */
    public completeRecipe(recipeId?: string): void {
        if (!this.waveState.isActive || !this.currentWaveConfig) return;

        this.waveState.completedRecipes++;
        this.waveState.currentActiveOrders--;

        // Enregistrer l'ID de la recette complétée pour le calcul des gains
        if (recipeId) {
            this.waveState.completedRecipeIds.push(recipeId);
        } else {
            console.warn(`⚠️ completeRecipe() appelé sans recipeId !`);
        }

        // Tenter de faire apparaître une nouvelle commande immédiatement
        if (this.waveState.pendingOrderIndex < this.currentWaveConfig.targetRecipes) {
            this.spawnNextOrders();
        }

        // Vérifier si la vague est terminée
        if (
            this.waveState.completedRecipes >=
            this.currentWaveConfig.targetRecipes
        ) {
            this.completeWave();
        }
    }

    /**
     * Marque une commande comme expirée (timer à 0)
     * GAME OVER - Une commande expirée = défaite immédiate !
     */
    public expireOrder(): void {
        if (!this.waveState.isActive || !this.currentWaveConfig) return;

        // Arrêter le timer de spawn
        if (this.orderSpawnTimer) {
            this.orderSpawnTimer.destroy();
            this.orderSpawnTimer = undefined;
        }

        this.waveState.isActive = false;

        // Déclencher le callback de défaite si défini
        if (this.onGameOverByExpiration) {
            this.onGameOverByExpiration();
        }
    }

    /**
     * Callback appelé quand une commande expire (Game Over)
     */
    private onGameOverByExpiration?: () => void;

    /**
     * Callback appelé quand une vague est terminée (pour ouvrir le shop)
     */
    private onWaveCompleted?: (waveNumber: number, timeSpent: number, recipeIds: string[]) => void;

    /**
     * Définit le callback de Game Over par expiration
     */
    public setGameOverCallback(callback: () => void): void {
        this.onGameOverByExpiration = callback;
    }

    /**
     * Définit le callback de complétion de vague (pour le shop)
     */
    public setWaveCompletedCallback(callback: (waveNumber: number, timeSpent: number, recipeIds: string[]) => void): void {
        this.onWaveCompleted = callback;
    }

    /**
     * Termine la vague actuelle
     */
    private completeWave(): void {
        if (!this.currentWaveConfig) return;

        this.waveState.isActive = false;
        this.waveState.completedWaves.push(this.currentWaveConfig.waveNumber);

        // Arrêter le timer de spawn
        if (this.orderSpawnTimer) {
            this.orderSpawnTimer.destroy();
            this.orderSpawnTimer = undefined;
        }

        // Calculer le score de la vague
        const waveScore = this.calculateWaveScore();
        this.scoreManager.addScore(waveScore);

        // Calculer le temps passé sur la vague
        const timeSpent = (this.scene.time.now - this.waveState.startTime) / 1000;

        // Appeler le callback pour ouvrir le shop
        if (this.onWaveCompleted) {
            this.onWaveCompleted(
                this.currentWaveConfig.waveNumber,
                timeSpent,
                this.waveState.completedRecipeIds
            );
        }

        // Passer à la vague suivante sera déclenché par le shop au lieu d'ici
        // this.scene.time.delayedCall(3000, () => {
        //     this.startNextWave();
        // });
    }

    /**
     * Obtient le numéro de la prochaine vague
     */
    public getNextWaveNumber(): number {
        return this.waveState.currentWave + 1;
    }

    /**
     * Démarre la vague suivante
     */
    public startNextWave(): void {
        const nextWaveNumber = this.getNextWaveNumber();
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
        // Arrêter le timer de spawn
        if (this.orderSpawnTimer) {
            this.orderSpawnTimer.destroy();
            this.orderSpawnTimer = undefined;
        }

        this.waveState = {
            currentWave: 1,
            completedRecipes: 0,
            isActive: false,
            startTime: 0,
            completedWaves: [],
            pendingOrderIndex: 0,
            currentActiveOrders: 0,
            completedRecipeIds: [],
        };
        this.currentWaveConfig = null;
    }
}


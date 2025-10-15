import Phaser from "phaser";
import { IngredientInteractionManager } from "./IngredientInteractionManager";
import { OrderVisualEffects } from "./OrderVisualEffects";
import { RecipeBox } from "./RecipeBox";

/**
 * Gestionnaire de l'affichage des commandes (recettes)
 */
export class OrderDisplayManager {
    private scene: Phaser.Scene;
    private recipeBoxes: RecipeBox[] = [];
    private activeOrders: string[] = [];
    private maxOrders: number = 4;
    private ingredientManager: IngredientInteractionManager;
    private orderDuration: number = 60; // Durée par défaut des commandes
    private recipeContainer?: Phaser.GameObjects.Container;
    private visualEffects: OrderVisualEffects;

    constructor(
        scene: Phaser.Scene,
        ingredientManager: IngredientInteractionManager
    ) {
        this.scene = scene;
        this.ingredientManager = ingredientManager;
        this.visualEffects = new OrderVisualEffects(scene);
    }

    /**
     * Initialise l'affichage des recettes en haut à gauche
     */
    initializeRecipeDisplay(): void {
        // Créer un conteneur pour toutes les boîtes de recettes
        this.recipeContainer = this.scene.add.container(20, 20);
        this.recipeContainer.setScrollFactor(0);
        this.recipeContainer.setDepth(2000);

        // Ne pas créer de boîtes ici - elles seront créées dynamiquement selon la vague
        console.log(
            "📦 Système de boîtes de recettes initialisé - création dynamique selon les vagues"
        );
    }

    /**
     * Crée une boîte de recette individuelle
     */
    private createRecipeBox(index: number): void {
        if (!this.recipeContainer) return;

        const recipeBox = new RecipeBox(
            this.scene,
            index,
            this.recipeContainer
        );
        recipeBox.onExpired = () => this.handleRecipeExpired(recipeBox);

        this.recipeBoxes.push(recipeBox);
    }

    /**
     * Génère de nouvelles commandes
     */
    generateNewOrders(): void {
        const recipeManager = this.ingredientManager.getRecipeManager();
        const dishes = recipeManager.getDishes();

        // Nettoyer les commandes existantes
        this.activeOrders = [];
        this.recipeBoxes.forEach((box) => {
            box.clear();
        });

        // Générer de nouvelles commandes (2-4 commandes)
        const numOrders = Phaser.Math.Between(2, this.maxOrders);
        const availableDishes = [...dishes];

        for (let i = 0; i < numOrders && availableDishes.length > 0; i++) {
            const randomIndex = Phaser.Math.Between(
                0,
                availableDishes.length - 1
            );
            const dish = availableDishes[randomIndex];
            availableDishes.splice(randomIndex, 1);

            this.activeOrders.push(dish.id);
            this.assignRecipeToBox(i, dish);
        }
    }

    /**
     * Gère l'expiration d'une recette
     */
    private handleRecipeExpired(recipeBox: RecipeBox): void {
        // Supprimer la commande de la liste active
        const orderIndex = this.activeOrders.indexOf(recipeBox.orderId!);
        if (orderIndex !== -1) {
            this.activeOrders.splice(orderIndex, 1);
        }

        // Effet visuel d'expiration
        this.visualEffects.showRecipeExpiredEffect(recipeBox);
    }

    /**
     * Vérifie si un plat réalisé correspond à une commande
     */
    checkOrderCompletion(dishId: string): boolean {
        const orderIndex = this.activeOrders.indexOf(dishId);
        if (orderIndex !== -1) {
            this.completeOrder(orderIndex);
            return true;
        }
        return false;
    }

    /**
     * Marque une commande comme complétée
     */
    private completeOrder(orderIndex: number): void {
        if (orderIndex >= this.activeOrders.length) return;

        const recipeBox = this.recipeBoxes[orderIndex];

        // Effet visuel de succès avant de faire disparaître la boîte
        this.visualEffects.showOrderCompleteEffect(recipeBox);

        // Faire disparaître la boîte avec animation
        this.removeBoxWithAnimation(orderIndex);

        // Notifier le système de vagues qu'une recette est complétée
        if (this.onOrderCompleted) {
            this.onOrderCompleted();
        }
    }

    /**
     * Supprime une boîte avec animation et décale les autres
     */
    private removeBoxWithAnimation(boxIndex: number): void {
        if (boxIndex >= this.recipeBoxes.length) return;

        const box = this.recipeBoxes[boxIndex];

        // Animation de disparition
        box.animateDisappearance(() => {
            // Détruire la boîte
            box.destroy();

            // Supprimer la boîte du tableau
            this.recipeBoxes.splice(boxIndex, 1);

            // Décale les boîtes restantes vers la gauche
            this.shiftRemainingBoxes(boxIndex);
        });
    }

    /**
     * Décale les boîtes restantes vers la gauche
     */
    private shiftRemainingBoxes(removedIndex: number): void {
        const boxWidth = 120;
        const spacing = 10;

        // Décale toutes les boîtes après l'index supprimé
        for (let i = removedIndex; i < this.recipeBoxes.length; i++) {
            const box = this.recipeBoxes[i];
            const newX = i * (boxWidth + spacing);

            // Animation de décalage
            box.animateToPosition(newX, i);
        }
    }

    /**
     * Définit le nombre maximum de commandes simultanées
     */
    public setMaxOrders(maxOrders: number): void {
        this.maxOrders = maxOrders;
    }

    /**
     * Crée le nombre exact de boîtes nécessaires pour la vague
     */
    public createBoxesForWave(numberOfRecipes: number): void {
        // Nettoyer les boîtes existantes
        this.clearAllBoxes();

        // Créer exactement le nombre de boîtes nécessaires
        for (let i = 0; i < numberOfRecipes; i++) {
            this.createRecipeBox(i);
        }

        console.log(`📦 Créé ${numberOfRecipes} boîtes pour la vague`);
    }

    /**
     * Nettoie toutes les boîtes existantes
     */
    private clearAllBoxes(): void {
        // Détruire toutes les boîtes existantes
        this.recipeBoxes.forEach((box) => {
            box.destroy();
        });

        // Vider les tableaux
        this.recipeBoxes = [];
        this.activeOrders = [];

        // Vider le conteneur
        if (this.recipeContainer) {
            this.recipeContainer.removeAll(true);
        }
    }

    /**
     * Obtient le nombre de commandes actives
     */
    public getActiveOrderCount(): number {
        return this.activeOrders.length;
    }

    /**
     * Callback appelé quand une commande est complétée (pour le système de vagues)
     */
    private onOrderCompleted?: () => void;

    /**
     * Définit le callback de complétion de commande
     */
    public setOrderCompletedCallback(callback: () => void): void {
        this.onOrderCompleted = callback;
    }

    /**
     * Marque une commande comme complétée (version publique pour le WaveManager)
     */
    public completeOrderPublic(dishId: string): boolean {
        const success = this.checkOrderCompletion(dishId);
        if (success && this.onOrderCompleted) {
            this.onOrderCompleted();
        }
        return success;
    }

    /**
     * Définit la durée des commandes
     */
    public setOrderDuration(duration: number): void {
        this.orderDuration = duration;
    }

    /**
     * Nettoie toutes les commandes existantes
     */
    public clearAllOrders(): void {
        this.activeOrders = [];
        this.recipeBoxes.forEach((box) => {
            box.stopTimer();
            box.clear();
        });
    }

    /**
     * Assigne une recette à une boîte spécifique
     */
    public assignRecipeToBox(boxIndex: number, dish: any): void {
        if (boxIndex >= this.recipeBoxes.length) return;

        const recipeManager = this.ingredientManager.getRecipeManager();
        const allRecipes = recipeManager.getAllRecipes();
        const recipe = allRecipes.find((r) => r.result === dish.id);

        if (!recipe) {
            console.warn(`Aucune recette trouvée pour le plat: ${dish.id}`);
            return;
        }

        const box = this.recipeBoxes[boxIndex];

        // Ajouter la commande à la liste active
        this.activeOrders.push(dish.id);

        // Mettre à jour la boîte avec la recette
        box.updateWithRecipe(recipe);

        // Démarrer le timer
        box.startTimer(this.orderDuration);
    }
}


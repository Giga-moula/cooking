import Phaser from "phaser";
import { IngredientInteractionManager } from "./IngredientInteractionManager";
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
    private orderDuration: number = 60;
    private recipeContainer?: Phaser.GameObjects.Container;

    constructor(
        scene: Phaser.Scene,
        ingredientManager: IngredientInteractionManager
    ) {
        this.scene = scene;
        this.ingredientManager = ingredientManager;
    }

    /**
     * Initialise l'affichage des recettes en haut à gauche
     */
    initializeRecipeDisplay(): void {
        // Créer un conteneur pour toutes les boîtes de recettes
        this.recipeContainer = this.scene.add.container(20, 20);
        this.recipeContainer.setScrollFactor(0);
        this.recipeContainer.setDepth(2000);
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

            // Trouver la recette qui produit ce plat
            const allRecipes = recipeManager.getAllRecipes();
            const recipe = allRecipes.find((r) => r.result === dish.id);

            if (recipe) {
                this.activeOrders.push(dish.id);
                this.assignRecipeToBox(i, recipe);
            }
        }
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

        const dishId = this.activeOrders[orderIndex];
        const recipeBox = this.recipeBoxes[orderIndex];

        // Faire disparaître la boîte avec animation
        this.removeBoxWithAnimation(orderIndex);

        // Notifier le système de vagues qu'une recette est complétée
        if (this.onOrderCompleted && dishId) {
            this.onOrderCompleted(dishId);
        } else {
            console.warn(`⚠️ Callback non appelé - onOrderCompleted: ${!!this.onOrderCompleted}, dishId: ${dishId}`);
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

            // Supprimer de activeOrders aussi
            this.activeOrders.splice(boxIndex, 1);

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
    }

    /**
     * Nettoie toutes les boîtes existantes
     */
    public clearAllBoxes(): void {
        // Détruire toutes les boîtes existantes
        this.recipeBoxes.forEach((box) => {
            box.destroy();
        });

        // Vider les tableaux
        this.recipeBoxes = [];
        this.activeOrders = [];
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
    private onOrderCompleted?: (dishId: string) => void;

    /**
     * Callback appelé quand une commande expire (pour le système de vagues)
     */
    private onOrderExpired?: () => void;

    /**
     * Définit le callback de complétion de commande
     */
    public setOrderCompletedCallback(callback: (dishId: string) => void): void {
        this.onOrderCompleted = callback;
    }

    /**
     * Définit le callback d'expiration de commande
     */
    public setOrderExpiredCallback(callback: () => void): void {
        this.onOrderExpired = callback;
    }

    /**
     * Marque une commande comme complétée (version publique pour le WaveManager)
     */
    public completeOrderPublic(dishId: string): boolean {
        const success = this.checkOrderCompletion(dishId);
        if (success && this.onOrderCompleted) {
            this.onOrderCompleted(dishId);
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
    public assignRecipeToBox(boxIndex: number, recipe: any): void {
        if (boxIndex >= this.recipeBoxes.length) return;

        if (!recipe) {
            return;
        }

        const box = this.recipeBoxes[boxIndex];

        // Ajouter la commande à la liste active
        this.activeOrders.push(recipe.result);

        // Mettre à jour la boîte avec la recette
        box.updateWithRecipe(recipe);

        // Démarrer le timer
        box.startTimer(this.orderDuration);
    }

    /**
     * Arrête tous les timers des commandes
     */
    public stopAllTimers(): void {
        this.recipeBoxes.forEach((box) => {
            box.stopTimer();
        });
    }

    /**
     * Affiche un effet visuel dramatique quand une commande expire
     */
    private showExpirationEffect(box: RecipeBox): void {
        const container = box.container;
        
        // Effet de tremblement violent
        this.scene.tweens.add({
            targets: container,
            x: container.x - 10,
            duration: 50,
            yoyo: true,
            repeat: 10,
            ease: "Linear",
        });

        // Flash rouge
        const redFlash = this.scene.add.graphics();
        redFlash.fillStyle(0xff0000, 0.8);
        redFlash.fillRect(0, 0, 1024, 768);
        redFlash.setDepth(9999);
        redFlash.setScrollFactor(0);

        this.scene.tweens.add({
            targets: redFlash,
            alpha: 0,
            duration: 800,
            ease: "Cubic.easeOut",
            onComplete: () => redFlash.destroy(),
        });

        // Afficher un message d'avertissement au centre de l'écran
        const warningText = this.scene.add.text(512, 384, "⚠️ COMMANDE RATÉE !\nGAME OVER", {
            fontFamily: "Arial Black",
            fontSize: "72px",
            color: "#FF0000",
            stroke: "#FFFF00",
            strokeThickness: 8,
            align: "center",
        });
        warningText.setOrigin(0.5);
        warningText.setDepth(10000);
        warningText.setScrollFactor(0);
        warningText.setScale(0);

        // Animation d'explosion du texte
        this.scene.tweens.add({
            targets: warningText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 300,
            ease: "Back.easeOut",
            yoyo: true,
            repeat: 1,
            onComplete: () => {
                this.scene.time.delayedCall(400, () => {
                    warningText.destroy();
                });
            },
        });
    }

    /**
     * Ajoute une nouvelle commande progressivement (pour le système d'apparition progressive)
     */
    public addNewOrder(recipe: any): void {
        if (!this.recipeContainer) return;

        // Créer une nouvelle boîte à la fin
        const newIndex = this.recipeBoxes.length;
        
        // Créer la boîte
        this.createRecipeBox(newIndex);

        // Ajouter la commande à la liste active
        this.activeOrders.push(recipe.result);

        // Mettre à jour la boîte avec la recette
        const box = this.recipeBoxes[newIndex];
        if (!box) return;
        
        box.updateWithRecipe(recipe);

        // Définir le callback d'expiration
        box.onExpired = () => {
            
            // EFFET VISUEL DRAMATIQUE !
            this.showExpirationEffect(box);
            
            // Retirer de la liste des commandes actives
            const expiredIndex = this.activeOrders.indexOf(recipe.result);
            if (expiredIndex !== -1) {
                this.activeOrders.splice(expiredIndex, 1);
            }
            
            // Attendre la fin de l'animation avant de notifier
            this.scene.time.delayedCall(1000, () => {
                // Notifier le système de vagues (GAME OVER)
                if (this.onOrderExpired) {
                    this.onOrderExpired();
                }
            });

            // Supprimer la boîte avec animation après un délai
            const boxIndex = this.recipeBoxes.indexOf(box);
            if (boxIndex !== -1) {
                this.scene.time.delayedCall(800, () => {
                    this.removeBoxWithAnimation(boxIndex);
                });
            }
        };

        // Démarrer le timer
        box.startTimer(this.orderDuration);

        // Animation d'apparition
        box.container.setAlpha(0);
        box.container.setScale(0.8);
        this.scene.tweens.add({
            targets: box.container,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 300,
            ease: "Back.easeOut",
        });
    }
}


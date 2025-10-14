import Phaser from "phaser";
import { IngredientInteractionManager } from "./IngredientInteractionManager";

// Interface pour les boîtes de recettes
interface RecipeBox {
    container: Phaser.GameObjects.Container;
    colorBar: Phaser.GameObjects.Graphics;
    dishIcon: Phaser.GameObjects.Image;
    ingredientIcons: Phaser.GameObjects.Image[];
    orderId: string | null;
}

/**
 * Gestionnaire de l'affichage des commandes (recettes)
 */
export class OrderDisplayManager {
    private scene: Phaser.Scene;
    private recipeBoxes: RecipeBox[] = [];
    private activeOrders: string[] = [];
    private maxOrders: number = 4;
    private ingredientManager: IngredientInteractionManager;

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
        const recipeContainer = this.scene.add.container(20, 20);
        recipeContainer.setScrollFactor(0);
        recipeContainer.setDepth(2000);

        // Créer les boîtes de recettes
        for (let i = 0; i < this.maxOrders; i++) {
            this.createRecipeBox(recipeContainer, i);
        }
    }

    /**
     * Crée une boîte de recette individuelle
     */
    private createRecipeBox(
        parent: Phaser.GameObjects.Container,
        index: number
    ): void {
        const boxWidth = 120;
        const boxHeight = 140;
        const spacing = 10;
        const x = index * (boxWidth + spacing);
        const y = 0;

        const boxContainer = this.scene.add.container(x, y);
        parent.add(boxContainer);

        // Fond de la boîte
        const background = this.scene.add.graphics();
        background.fillStyle(0xf0f0f0, 1);
        background.fillRoundedRect(0, 0, boxWidth, boxHeight, 8);
        background.lineStyle(2, 0x333333, 1);
        background.strokeRoundedRect(0, 0, boxWidth, boxHeight, 8);
        boxContainer.add(background);

        // Barre de couleur en haut
        const colorBar = this.scene.add.graphics();
        colorBar.fillStyle(0x4caf50, 1);
        colorBar.fillRoundedRect(2, 2, boxWidth - 4, 8, 4);
        boxContainer.add(colorBar);

        // Zone du plat fini
        const dishArea = this.scene.add.graphics();
        dishArea.fillStyle(0xffffff, 1);
        dishArea.fillRoundedRect(5, 15, boxWidth - 10, 60, 4);
        dishArea.lineStyle(1, 0xcccccc, 1);
        dishArea.strokeRoundedRect(5, 15, boxWidth - 10, 60, 4);
        boxContainer.add(dishArea);

        // Zone des ingrédients
        const ingredientArea = this.scene.add.graphics();
        ingredientArea.fillStyle(0xe3f2fd, 1);
        ingredientArea.fillRoundedRect(5, 80, boxWidth - 10, 55, 4);
        ingredientArea.lineStyle(1, 0xcccccc, 1);
        ingredientArea.strokeRoundedRect(5, 80, boxWidth - 10, 55, 4);
        boxContainer.add(ingredientArea);

        // Icône du plat fini
        const dishIcon = this.scene.add.image(boxWidth / 2, 45, "cookie");
        dishIcon.setScale(1.5);
        boxContainer.add(dishIcon);

        // Icônes des ingrédients
        const ingredientIcons: Phaser.GameObjects.Image[] = [];
        for (let i = 0; i < 3; i++) {
            const icon = this.scene.add.image(35 + i * 50, 110, "chocolate");
            icon.setScale(1.2);
            icon.setVisible(false);
            boxContainer.add(icon);
            ingredientIcons.push(icon);
        }

        const recipeBox: RecipeBox = {
            container: boxContainer,
            colorBar: colorBar,
            dishIcon: dishIcon,
            ingredientIcons: ingredientIcons,
            orderId: null,
        };

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
            box.orderId = null;
            box.dishIcon.setVisible(false);
            box.ingredientIcons.forEach((icon) => icon.setVisible(false));
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
            this.updateRecipeBoxForDish(i, dish);
        }
    }

    /**
     * Met à jour une boîte de recette avec les données d'un plat fini
     */
    private updateRecipeBoxForDish(boxIndex: number, dish: any): void {
        if (boxIndex >= this.recipeBoxes.length) return;

        const recipeManager = this.ingredientManager.getRecipeManager();
        const allRecipes = recipeManager.getAllRecipes();
        const recipe = allRecipes.find((r) => r.result === dish.id);

        if (!recipe) {
            console.warn(`Aucune recette trouvée pour le plat: ${dish.id}`);
            return;
        }

        this.updateRecipeBox(boxIndex, recipe);
    }

    /**
     * Met à jour une boîte de recette avec les données d'une recette
     */
    private updateRecipeBox(boxIndex: number, recipe: any): void {
        if (boxIndex >= this.recipeBoxes.length) return;

        const box = this.recipeBoxes[boxIndex];
        box.orderId = recipe.result;

        // Couleur de la barre selon le type de plat
        let color = 0x4caf50;
        switch (recipe.result) {
            case "cookie":
                color = 0xff9800;
                break;
            case "dough":
                color = 0x8bc34a;
                break;
            default:
                color = 0x4caf50;
        }
        box.colorBar.clear();
        box.colorBar.fillStyle(color, 1);
        box.colorBar.fillRoundedRect(2, 2, 116, 8, 4);

        // Icône du plat fini
        box.dishIcon.setTexture(recipe.result);
        box.dishIcon.setVisible(true);

        // Icônes des ingrédients
        const ingredients = [recipe.ingredient1, recipe.ingredient2];
        box.ingredientIcons.forEach((icon, index) => {
            if (index < ingredients.length) {
                icon.setTexture(ingredients[index]);
                icon.setVisible(true);
            } else {
                icon.setVisible(false);
            }
        });
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

        // Supprimer la commande de la liste
        this.activeOrders.splice(orderIndex, 1);

        // Effacer la boîte de recette
        const box = this.recipeBoxes[orderIndex];
        box.orderId = null;
        box.dishIcon.setVisible(false);
        box.ingredientIcons.forEach((icon) => icon.setVisible(false));

        // Effet visuel de succès
        this.showOrderCompleteEffect(orderIndex);

        // Générer une nouvelle commande après un délai
        this.scene.time.delayedCall(2000, () => {
            this.generateNewOrders();
        });
    }

    /**
     * Affiche un effet visuel quand une commande est complétée
     */
    private showOrderCompleteEffect(orderIndex: number): void {
        const box = this.recipeBoxes[orderIndex];
        const x = box.container.x + 60;
        const y = box.container.y + 70;

        // Effet de particules
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

        // Message de succès
        const message = this.scene.add.text(
            x,
            y - 20,
            "✓ Commande terminée !",
            {
                fontFamily: "Arial",
                fontSize: "16px",
                color: "#4CAF50",
                stroke: "#ffffff",
                strokeThickness: 2,
            }
        );
        message.setOrigin(0.5);
        message.setScrollFactor(0);
        message.setDepth(3000);

        this.scene.tweens.add({
            targets: message,
            y: y - 40,
            alpha: 0,
            duration: 1500,
            ease: "Cubic.easeOut",
            onComplete: () => message.destroy(),
        });
    }
}


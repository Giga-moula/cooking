import Phaser from "phaser";
import { RECIPES } from "../data/recipes";
import { RecipeManager } from "./RecipeManager";

/**
 * Gestionnaire pour afficher toutes les recettes disponibles en dessous des cœurs
 */
export class AllRecipesDisplayManager {
    private scene: Phaser.Scene;
    private recipeManager: RecipeManager;
    private recipeBoxes: Phaser.GameObjects.Container[] = [];
    private container?: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene, recipeManager: RecipeManager) {
        this.scene = scene;
        this.recipeManager = recipeManager;
    }

    /**
     * Initialise l'affichage de toutes les recettes disponibles
     */
    public initializeAllRecipesDisplay(x: number = 30, y: number = 250): void {
        // Créer un conteneur principal pour toutes les recettes
        this.container = this.scene.add.container(x, y);
        this.container.setScrollFactor(0);
        this.container.setDepth(2000);

        // Créer les boîtes pour toutes les recettes
        this.createAllRecipeBoxes();
    }

    /**
     * Crée les boîtes pour toutes les recettes disponibles
     */
    private createAllRecipeBoxes(): void {
        if (!this.container) return;

        const ingredientSize = 80; // Doublé la taille
        const verticalSpacing = 50; // Augmenté l'espacement vertical
        const horizontalSpacing = 15; // Espacement horizontal réduit entre les éléments

        RECIPES.forEach((recipe, index) => {
            const x = 0; // Toutes les recettes alignées à gauche
            const y = index * (ingredientSize + verticalSpacing);

            // Créer le conteneur pour cette recette
            const recipeBox = this.scene.add.container(x, y);
            recipeBox.setScrollFactor(0);
            recipeBox.setDepth(2000);

            // Créer l'icône du premier ingrédient
            const ingredient1Icon = this.scene.add.image(
                0,
                0,
                recipe.ingredient1
            );
            ingredient1Icon.setScale(1.5); // Doublé la taille
            ingredient1Icon.setOrigin(0.5);
            recipeBox.add(ingredient1Icon);

            // Créer le signe "+" entre les ingrédients
            const plusSign = this.scene.add.text(50, 0, "+", {
                fontFamily: "Arial",
                fontSize: "32px", // Agrandi le texte
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 4, // Épaissi le contour
            });
            plusSign.setOrigin(0.5);
            recipeBox.add(plusSign);

            // Créer l'icône du deuxième ingrédient
            const ingredient2Icon = this.scene.add.image(
                90,
                0,
                recipe.ingredient2
            );
            ingredient2Icon.setScale(1.5); // Doublé la taille
            ingredient2Icon.setOrigin(0.5);
            recipeBox.add(ingredient2Icon);

            // Créer le signe "=" avant le résultat
            const equalsSign = this.scene.add.text(130, 0, "=", {
                fontFamily: "Arial",
                fontSize: "32px",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 4,
            });
            equalsSign.setOrigin(0.5);
            recipeBox.add(equalsSign);

            // Créer l'icône du résultat sur la même ligne
            const resultIcon = this.scene.add.image(165, 0, recipe.result);
            resultIcon.setScale(1.5); // Agrandi aussi le résultat
            resultIcon.setOrigin(0.5);
            recipeBox.add(resultIcon);

            // Ajouter le conteneur à la liste
            this.recipeBoxes.push(recipeBox);
            if (this.container) {
                this.container.add(recipeBox);
            }
        });
    }

    /**
     * Affiche ou cache toutes les recettes
     */
    public setVisible(visible: boolean): void {
        if (this.container) {
            this.container.setVisible(visible);
        }
    }

    /**
     * Nettoie l'affichage
     */
    public cleanup(): void {
        if (this.container) {
            this.container.destroy();
            this.container = undefined;
        }
        this.recipeBoxes = [];
    }
}


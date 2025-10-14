/**
 * Gestionnaire de recettes et de combinaisons d'ingrédients
 */

import { INGREDIENTS } from "../data/ingredients";
import { RECIPES } from "../data/recipes";
import { Recipe } from "../types/Ingredient";

export class RecipeManager {
    private recipes: Recipe[];

    constructor() {
        this.recipes = RECIPES;
    }

    /**
     * Vérifie si deux ingrédients peuvent être combinés
     * @param ingredientId1 ID du premier ingrédient
     * @param ingredientId2 ID du deuxième ingrédient
     * @returns La recette trouvée ou null
     */
    public findRecipe(
        ingredientId1: string,
        ingredientId2: string
    ): Recipe | null {
        // Chercher une recette qui correspond aux deux ingrédients
        // L'ordre n'a pas d'importance (cookie + star = star + cookie)
        const recipe = this.recipes.find((r) => {
            const [ing1, ing2] = r.ingredients;
            return (
                (ing1 === ingredientId1 && ing2 === ingredientId2) ||
                (ing1 === ingredientId2 && ing2 === ingredientId1)
            );
        });

        return recipe || null;
    }

    /**
     * Tente de combiner deux ingrédients
     * @param ingredientId1 ID du premier ingrédient
     * @param ingredientId2 ID du deuxième ingrédient
     * @returns L'ID de l'ingrédient résultant ou null si pas de recette
     */
    public combineIngredients(
        ingredientId1: string,
        ingredientId2: string
    ): string | null {
        const recipe = this.findRecipe(ingredientId1, ingredientId2);

        if (recipe) {
            console.log(`✨ Recette trouvée : ${recipe.name} !`);
            return recipe.result;
        }

        console.log(
            `❌ Aucune recette pour ${ingredientId1} + ${ingredientId2}`
        );
        return null;
    }

    /**
     * Récupère les informations d'un ingrédient
     * @param ingredientId ID de l'ingrédient
     * @returns Les données de l'ingrédient ou undefined
     */
    public getIngredient(ingredientId: string) {
        return INGREDIENTS[ingredientId];
    }

    /**
     * Récupère toutes les recettes
     * @returns Tableau de toutes les recettes
     */
    public getAllRecipes(): Recipe[] {
        return [...this.recipes];
    }

    /**
     * Ajoute une nouvelle recette dynamiquement
     * @param recipe La recette à ajouter
     */
    public addRecipe(recipe: Recipe): void {
        this.recipes.push(recipe);
    }
}


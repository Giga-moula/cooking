/**
 * Gestionnaire de recettes pour les combinaisons d'ingrédients
 */

import { INGREDIENTS, type Ingredient } from "../data/ingredients";
import {
    OVEN_COOKING,
    CASSEROLE_COOKING,
    RECIPES,
    SPECIAL_TRANSFORMATIONS,
    type OvenCooking,
    type CasseroleCooking,
    type Recipe,
    type SpecialTransformation,
} from "../data/recipes";

export class RecipeManager {
    private ingredients: Map<string, Ingredient> = new Map();
    private recipes: Map<string, Recipe> = new Map();

    constructor() {
        this.initializeIngredients();
        this.initializeRecipes();
    }

    private initializeIngredients() {
        // Charger tous les ingrédients depuis le fichier de données
        INGREDIENTS.forEach((ingredient) => {
            this.addIngredient(ingredient);
        });
    }

    private initializeRecipes() {
        // Charger toutes les recettes depuis le fichier de données
        RECIPES.forEach((recipe) => {
            this.addRecipe(recipe);
        });
    }

    private addIngredient(ingredient: Ingredient) {
        this.ingredients.set(ingredient.id, ingredient);
    }

    private addRecipe(recipe: Recipe) {
        // Créer une clé pour la recette (ordre des ingrédients n'importe pas)
        const key1 = `${recipe.ingredient1}+${recipe.ingredient2}`;
        const key2 = `${recipe.ingredient2}+${recipe.ingredient1}`;

        this.recipes.set(key1, recipe);
        this.recipes.set(key2, recipe);
    }

    public getIngredient(id: string): Ingredient | undefined {
        return this.ingredients.get(id);
    }

    public getAllIngredients(): Ingredient[] {
        return Array.from(this.ingredients.values());
    }

    public combineIngredients(
        ingredient1: string,
        ingredient2: string
    ): string | null {
        const key = `${ingredient1}+${ingredient2}`;
        const recipe = this.recipes.get(key);

        if (recipe) {
            return recipe.result;
        }

        return null;
    }

    public getRecipe(
        ingredient1: string,
        ingredient2: string
    ): Recipe | undefined {
        const key = `${ingredient1}+${ingredient2}`;
        return this.recipes.get(key);
    }

    public getAllRecipes(): Recipe[] {
        const uniqueRecipes = new Map<string, Recipe>();
        this.recipes.forEach((recipe) => {
            uniqueRecipes.set(recipe.id, recipe);
        });
        return Array.from(uniqueRecipes.values());
    }

    /**
     * Effectue une transformation spéciale (1 ingrédient → 1 autre ingrédient)
     * Utilisé pour les transformations comme chocolat → chunks
     */
    public performSpecialTransformation(ingredientId: string): string | null {
        const transformation = SPECIAL_TRANSFORMATIONS.find(
            (t) => t.from === ingredientId
        );
        return transformation ? transformation.to : null;
    }

    /**
     * Vérifie si un ingrédient peut être transformé spécialement
     */
    public canPerformSpecialTransformation(ingredientId: string): boolean {
        return this.performSpecialTransformation(ingredientId) !== null;
    }

    /**
     * Récupère uniquement les plats finis (pas les ingrédients intermédiaires)
     */
    public getDishes(): Ingredient[] {
        return this.getAllIngredients().filter(
            (ingredient) => ingredient.isDish
        );
    }

    /**
     * Récupère uniquement les ingrédients (pas les plats finis)
     */
    public getIngredients(): Ingredient[] {
        return this.getAllIngredients().filter(
            (ingredient) => !ingredient.isDish
        );
    }

    /**
     * Vérifie si un élément est un plat fini
     */
    public isDish(id: string): boolean {
        const ingredient = this.getIngredient(id);
        return ingredient ? ingredient.isDish : false;
    }

    /**
     * Récupère toutes les transformations spéciales disponibles
     */
    public getAllSpecialTransformations(): SpecialTransformation[] {
        return SPECIAL_TRANSFORMATIONS;
    }

    /**
     * Récupère toutes les cuissons au four disponibles
     */
    public getAllOvenCooking(): OvenCooking[] {
        return OVEN_COOKING;
    }

    /**
     * Trouve une cuisson au four pour un ingrédient donné
     */
    public getOvenCooking(ingredientId: string): OvenCooking | undefined {
        return OVEN_COOKING.find((cooking) => cooking.from === ingredientId);
    }

    /**
     * Vérifie si un ingrédient peut être cuit au four
     */
    public canCookInOven(ingredientId: string): boolean {
        return this.getOvenCooking(ingredientId) !== undefined;
    }

    /**
     * Récupère toutes les cuissons à la casserole disponibles
     */
    public getAllCasseroleCooking(): CasseroleCooking[] {
        return CASSEROLE_COOKING;
    }

    /**
     * Trouve une cuisson à la casserole pour un ingrédient donné
     */
    public getCasseroleCooking(ingredientId: string): CasseroleCooking | undefined {
        return CASSEROLE_COOKING.find((cooking) => cooking.from === ingredientId);
    }

    /**
     * Vérifie si un ingrédient peut être cuit à la casserole
     */
    public canCookInCasserole(ingredientId: string): boolean {
        return this.getCasseroleCooking(ingredientId) !== undefined;
    }

    /**
     * Nettoie le manager (reset complet)
     */
    public cleanup(): void {
        this.ingredients.clear();
        this.recipes.clear();
    }
}


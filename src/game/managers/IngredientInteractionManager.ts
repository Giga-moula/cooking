import { RecipeManager, Ingredient, Recipe } from './RecipeManager';

/**
 * Gestionnaire des interactions entre ingrédients
 */
export class IngredientInteractionManager {
    private recipeManager: RecipeManager;

    constructor() {
        this.recipeManager = new RecipeManager();
    }

    /**
     * Récupère le gestionnaire de recettes
     */
    public getRecipeManager(): RecipeManager {
        return this.recipeManager;
    }

    /**
     * Vérifie si deux ingrédients peuvent être combinés
     */
    public canCombine(ingredient1: string, ingredient2: string): boolean {
        return this.recipeManager.combineIngredients(ingredient1, ingredient2) !== null;
    }

    /**
     * Combine deux ingrédients et retourne le résultat
     */
    public combineIngredients(ingredient1: string, ingredient2: string): string | null {
        return this.recipeManager.combineIngredients(ingredient1, ingredient2);
    }

    /**
     * Récupère les informations d'un ingrédient
     */
    public getIngredientInfo(ingredientId: string): Ingredient | undefined {
        return this.recipeManager.getIngredient(ingredientId);
    }

    /**
     * Récupère tous les ingrédients disponibles
     */
    public getAllIngredients(): Ingredient[] {
        return this.recipeManager.getAllIngredients();
    }

    /**
     * Récupère toutes les recettes disponibles
     */
    public getAllRecipes(): Recipe[] {
        return this.recipeManager.getAllRecipes();
    }

    /**
     * Affiche les informations de debug
     */
    public printDebugInfo(): void {
        console.log('=== INGRÉDIENTS DISPONIBLES ===');
        this.getAllIngredients().forEach(ingredient => {
            console.log(`- ${ingredient.id}: ${ingredient.name} (texture: ${ingredient.texture})`);
        });

        console.log('\n=== RECETTES DISPONIBLES ===');
        this.getAllRecipes().forEach(recipe => {
            console.log(`- ${recipe.ingredient1} + ${recipe.ingredient2} = ${recipe.result} (${recipe.name})`);
        });
    }

    /**
     * Nettoyage des ressources
     */
    public cleanup(): void {
        // Pour l'instant, rien à nettoyer
        // Mais cette méthode est prête pour des futures améliorations
    }
}
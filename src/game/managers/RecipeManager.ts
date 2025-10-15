/**
 * Gestionnaire de recettes pour les combinaisons d'ingrédients
 */

export interface Ingredient {
    id: string;
    name: string;
    texture: string;
    isDish: boolean; // true si c'est un plat fini, false si c'est un ingrédient
}

export interface Recipe {
    id: string;
    ingredient1: string;
    ingredient2: string;
    result: string;
    name: string;
}

export class RecipeManager {
    private ingredients: Map<string, Ingredient> = new Map();
    private recipes: Map<string, Recipe> = new Map();

    constructor() {
        this.initializeIngredients();
        this.initializeRecipes();
    }

    private initializeIngredients() {
        // Ingrédients de base
        this.addIngredient({
            id: "butter",
            name: "Beurre",
            texture: "butter",
            isDish: false,
        });

        this.addIngredient({
            id: "flour",
            name: "Farine",
            texture: "flour",
            isDish: false,
        });

        this.addIngredient({
            id: "chocolate",
            name: "Chocolat",
            texture: "chocolate",
            isDish: false,
        });

        // Ingrédients créés par combinaison (intermédiaires)
        this.addIngredient({
            id: "dough",
            name: "Pâte",
            texture: "dough",
            isDish: false, // La pâte est un ingrédient intermédiaire, pas un plat fini
        });

        this.addIngredient({
            id: "molten_butter",
            name: "Beurre fondu",
            texture: "molten_butter",
            isDish: false, // Le beurre fondu est un ingrédient intermédiaire
        });

        this.addIngredient({
            id: "cookie-mix",
            name: "Cookie Mix",
            texture: "cookie-mix",
            isDish: false, // Le cookie mix est un ingrédient intermédiaire
        });

        // Plats finis
        this.addIngredient({
            id: "cookie",
            name: "Cookie",
            texture: "cookie",
            isDish: true, // Le cookie est un plat fini
        });

        // Ingrédients bonus
        this.addIngredient({
            id: "star",
            name: "Étoile",
            texture: "star",
            isDish: false,
        });

        this.addIngredient({
            id: "chocolate-chunks",
            name: "Chunks de chocolat",
            texture: "chocolate-chunks",
            isDish: false,
        });
    }

    private initializeRecipes() {

        // Beurre fondu + Farine = Pâte (SEULEMENT avec beurre fondu)
        this.addRecipe({
            id: "molten_butter_flour_dough",
            ingredient1: "molten_butter",
            ingredient2: "flour",
            result: "dough",
            name: "Pâte avec beurre fondu",
        });

        // Pâte + Chunks de chocolat = Cookie Mix
        this.addRecipe({
            id: "dough_chocolate_chunks_cookie_mix",
            ingredient1: "dough",
            ingredient2: "chocolate-chunks",
            result: "cookie-mix",
            name: "Cookie Mix avec chunks",
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
        const transformations: { [key: string]: string } = {
            "chocolate": "chocolate-chunks",
        };

        return transformations[ingredientId] || null;
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
}


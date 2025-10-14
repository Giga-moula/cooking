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
            id: "wheat_floor",
            name: "Farine",
            texture: "wheat_floor",
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

        // Plats finis
        this.addIngredient({
            id: "cookie",
            name: "Cookie",
            texture: "cookie",
            isDish: true, // Le cookie est un plat fini
        });
    }

    private initializeRecipes() {
        // Beurre + Farine = Pâte
        this.addRecipe({
            id: "butter_flour_dough",
            ingredient1: "butter",
            ingredient2: "wheat_floor",
            result: "dough",
            name: "Pâte à biscuits",
        });

        // Chocolat + Pâte = Cookie
        this.addRecipe({
            id: "chocolate_dough_cookie",
            ingredient1: "chocolate",
            ingredient2: "dough",
            result: "cookie",
            name: "Cookie au chocolat",
        });

        // Chocolat + Beurre + Farine = Cookie (recette directe)
        // Note: Cette recette sera gérée différemment car elle nécessite 3 ingrédients
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


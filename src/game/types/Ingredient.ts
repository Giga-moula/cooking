/**
 * Types et interfaces pour le système d'ingrédients
 */

export interface Ingredient {
    id: string;
    name: string;
    texture: string;
    type: "base" | "crafted"; // base = ingrédient de départ, crafted = résultat de combinaison
}

export interface Recipe {
    ingredients: [string, string]; // Toujours 2 ingrédients pour une combinaison
    result: string; // ID de l'ingrédient résultant
    name: string; // Nom de la recette
}

export interface IngredientSprite extends Phaser.Physics.Arcade.Sprite {
    ingredientId: string;
}


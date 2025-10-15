/**
 * Base de données des recettes - combinaisons d'ingrédients
 */

import { Recipe } from "../types/Ingredient";

export const RECIPES: Recipe[] = [
    // Recettes principales
    {
        name: "Pâte à Cookie",
        ingredients: ["butter", "flour"],
        result: "dough",
    },
    {
        name: "Pâte à Cookie chocolatée",
        ingredients: ["chocolate", "dough"],
        result: "cookie",
    },

    // Recettes bonus
    {
        name: "Cookie Étoilé",
        ingredients: ["cookie", "star"],
        result: "favicon",
    },
];

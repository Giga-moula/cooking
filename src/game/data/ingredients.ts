/**
 * Base de données des ingrédients disponibles dans le jeu
 */

import { Ingredient } from "../types/Ingredient";

export const INGREDIENTS: Record<string, Ingredient> = {
    // Ingrédients de base
    butter: {
        id: "butter",
        name: "Beurre",
        texture: "butter",
        type: "base",
    },
    flour: {
        id: "flour",
        name: "Farine",
        texture: "flour",
        type: "base",
    },
    chocolate: {
        id: "chocolate",
        name: "Chocolat",
        texture: "chocolate",
        type: "base",
    },

    // Ingrédients craftés
    dough: {
        id: "dough",
        name: "Pâte",
        texture: "dough",
        type: "crafted",
    },
    cookie: {
        id: "cookie",
        name: "Cookie",
        texture: "cookie",
        type: "crafted",
    },

    // Autres (exemples)
    star: {
        id: "star",
        name: "Étoile",
        texture: "star",
        type: "base",
    },
    favicon: {
        id: "favicon",
        name: "Favicon",
        texture: "favicon",
        type: "crafted",
    },
};


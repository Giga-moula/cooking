/**
 * Configuration des recettes, transformations et cuissons du jeu
 */

export interface Recipe {
    id: string;
    ingredient1: string;
    ingredient2: string;
    result: string;
    name: string;
}

export interface SpecialTransformation {
    from: string;
    to: string;
    name: string;
}

export interface OvenCooking {
    from: string;
    to: string;
    name: string;
}

export interface CasseroleCooking {
    from: string;
    to: string;
    name: string;
}

/**
 * Liste de toutes les recettes disponibles dans le jeu
 */
export const RECIPES: Recipe[] = [
    // Beurre fondu + Farine = Pâte (SEULEMENT avec beurre fondu)
    {
        id: "molten_butter_flour_dough",
        ingredient1: "molten_butter",
        ingredient2: "flour",
        result: "dough",
        name: "Pâte avec beurre fondu",
    },

    // Pâte + Chunks de chocolat = Cookie Mix Choco
    {
        id: "dough_chocolate_chunks_cookie_mix_choco",
        ingredient1: "dough",
        ingredient2: "chocolate-chunks",
        result: "cookie-mix-choco",
        name: "Cookie Mix avec chunks",
    },

    // Pâte + Caramel = Cookie Mix Cara
    {
        id: "dough_caramel_cookie_mix_cara",
        ingredient1: "dough",
        ingredient2: "caramel",
        result: "cookie-mix-cara",
        name: "Cookie Mix avec caramel",
    },

    // Cookie Mix Choco + Caramel = Cookie Mix Choco Cara
    {
        id: "cookie_mix_choco_caramel_choco_cara",
        ingredient1: "cookie-mix-choco",
        ingredient2: "caramel",
        result: "cookie-mix-choco-cara",
        name: "Cookie Mix avec caramel et chocolat",
    },
];

/**
 * Liste de toutes les transformations spéciales disponibles dans le jeu
 * (1 ingrédient → 1 autre ingrédient)
 */
export const SPECIAL_TRANSFORMATIONS: SpecialTransformation[] = [
    {
        from: "chocolate",
        to: "chocolate-chunks",
        name: "Chocolat en chunks",
    },
    // Les transformations vers cookie-dead sont gérées directement dans OvenManager pour les échecs de cuisson
    // Elles ne doivent PAS être dans les transformations spéciales automatiques
];

/**
 * Liste de toutes les cuissons au four disponibles dans le jeu
 * Four : Cookie-mix uniquement (pas le beurre)
 */
export const OVEN_COOKING: OvenCooking[] = [
    {
        from: "cookie-mix-choco",
        to: "cookie-choco",
        name: "Cookie chocolat",
    },
    {
        from: "cookie-mix-cara",
        to: "cookie-cara",
        name: "Cookie caramel",
    },
    {
        from: "cookie-mix-choco-cara",
        to: "cookie-choco-cara",
        name: "Cookie chocolat caramel",
    },
];

/**
 * Liste de toutes les cuissons à la casserole disponibles dans le jeu
 * Casserole : Sucre + Beurre uniquement
 */
export const CASSEROLE_COOKING: CasseroleCooking[] = [
    {
        from: "sugar",
        to: "caramel",
        name: "Caramel",
    },
    {
        from: "butter",
        to: "molten_butter",
        name: "Beurre fondu",
    },
];

/**
 * Liste des recettes qui ne nécessitent pas de combinaison de touches
 * (crafts instantanés)
 */
export const INSTANT_CRAFT_RECIPES = [
    "molten_butter_flour_dough", // Pâte
    "dough_chocolate_chunks_cookie_mix_choco", // Cookie Mix Choco
    "dough_caramel_cookie_mix_cara", // Cookie Mix Cara
    "cookie_mix_choco_caramel_choco_cara", // Cookie Mix Choco Cara
    "cookie_mix_cara_chocolate_choco_cara", // Cookie Mix Choco Cara
];


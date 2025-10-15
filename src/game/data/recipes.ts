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

    // Cookie Mix Choco + Caramel = Cookie Mix Choco Cara / Cookie Mix Cara + Chocolat = Cookie Mix Choco Cara
    {
        id: "dough_caramel_cookie_mix_choco_cara",
        ingredient1: "cookie-mix-choco",
        ingredient2: "caramel",
        result: "cookie-mix-choco-cara",
        name: "Cookie Mix avec caramel et chocolat",
    },
    {
        id: "dough_caramel_cookie_mix_choco_cara",
        ingredient1: "cookie-mix-cara",
        ingredient2: "chocolate",
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
];

/**
 * Liste de toutes les cuissons au four disponibles dans le jeu
 */
export const OVEN_COOKING: OvenCooking[] = [
    {
        from: "butter",
        to: "molten_butter",
        name: "Beurre fondu",
    },
    {
        from: "sugar",
        to: "caramel",
        name: "Sucre → Caramel",
    },
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


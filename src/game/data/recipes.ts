/**
 * Configuration des recettes du jeu
 */

export interface Recipe {
    id: string;
    ingredient1: string;
    ingredient2: string;
    result: string;
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


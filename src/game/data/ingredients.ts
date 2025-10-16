/**
 * Configuration des ingrédients du jeu
 */

export interface Ingredient {
    id: string;
    name: string;
    texture: string;
    isDish: boolean; // true si c'est un plat fini, false si c'est un ingrédient
}

/**
 * Liste de tous les ingrédients disponibles dans le jeu
 */
export const INGREDIENTS: Ingredient[] = [
    // Ingrédients de base
    {
        id: "butter",
        name: "Beurre",
        texture: "butter",
        isDish: false,
    },
    {
        id: "flour",
        name: "Farine",
        texture: "flour",
        isDish: false,
    },
    {
        id: "chocolate",
        name: "Chocolat",
        texture: "chocolate",
        isDish: false,
    },
    {
        id: "sugar",
        name: "Sucre",
        texture: "sugar",
        isDish: false,
    },

    // Ingrédients créés par combinaison (intermédiaires)
    {
        id: "caramel",
        name: "Caramel",
        texture: "caramel",
        isDish: false,
    },
    {
        id: "chocolate-chunks",
        name: "Chunks de chocolat",
        texture: "chocolate-chunks",
        isDish: false,
    },
    {
        id: "cookie-mix-cara",
        name: "Cookie Mix Cara",
        texture: "cookie-mix-cara",
        isDish: false, // Le cookie mix est un ingrédient intermédiaire
    },
    {
        id: "cookie-mix-choco-cara",
        name: "Cookie Mix Choco Cara",
        texture: "cookie-mix-choco-cara",
        isDish: false, // Le cookie mix est un ingrédient intermédiaire
    },
    {
        id: "cookie-mix-choco",
        name: "Cookie Mix Choco",
        texture: "cookie-mix-choco",
        isDish: false, // Le cookie mix est un ingrédient intermédiaire
    },
    {
        id: "molten_butter",
        name: "Beurre fondu",
        texture: "molten_butter",
        isDish: false, // Le beurre fondu est un ingrédient intermédiaire
    },
    {
        id: "dough",
        name: "Pâte",
        texture: "dough",
        isDish: false, // La pâte est un ingrédient intermédiaire, pas un plat fini
    },

    // Plats finis
    {
        id: "cookie-cara",
        name: "Cookie Cara",
        texture: "cookie-cara",
        isDish: true, // Le cookie est un plat fini
    },
    {
        id: "cookie-choco-cara",
        name: "Cookie Choco Cara",
        texture: "cookie-choco-cara",
        isDish: true, // Le cookie est un plat fini
    },
    {
        id: "cookie-choco",
        name: "Cookie Choco",
        texture: "cookie-choco",
        isDish: true, // Le cookie est un plat fini
    },
    {
        id: "cookie-dead",
        name: "Cookie Dead",
        texture: "cookie-dead",
        isDish: true, // Le cookie est un plat fini
    },
];

// Les transformations spéciales sont maintenant dans src/game/data/recipes.ts


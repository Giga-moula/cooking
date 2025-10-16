/**
 * Configuration des blocs de craft et de leurs séquences de craft
 */

export type CraftDirection =
    | "up"
    | "down"
    | "left"
    | "right"
    | "spin"
    | "anti-spin";

export interface CraftingItem {
    tileTypeId: number;
    name: string;
    texture: string;
    craftingSequences: CraftDirection[][];
    allowedRecipes?: string[]; // Optionnel: limiter certaines recettes à certains blocs
}

/**
 * Séquences de craft spécifiques pour chaque transformation
 */
export interface TransformationSequence {
    from: string;
    to: string;
    sequence: CraftDirection[];
}

/**
 * Configuration des blocs autorisés pour le craft
 */
export const CRAFTING_ITEMS: { [key: number]: CraftingItem } = {
    // Table de transformation (table-mono avec transformation)
    10: {
        tileTypeId: 10,
        name: "Table de Transformation",
        texture: "table-mono",
        craftingSequences: [
            ["up", "down"],
            ["left", "right"],
            ["up", "right", "down", "left"],
            ["spin"],
            ["anti-spin"],
        ],
    },

    // Four (oven)
    11: {
        tileTypeId: 11,
        name: "Four",
        texture: "oven",
        craftingSequences: [
            ["up", "up", "down"],
            ["left", "left", "right"],
            ["spin", "up"],
            ["down", "anti-spin"],
            ["up", "down", "up", "down"],
        ],
    },

    // Casserole de cuisson
    13: {
        tileTypeId: 13,
        name: "Casserole de Cuisson",
        texture: "casserole_cuisson",
        craftingSequences: [
            ["right", "left", "right"],
            ["up", "spin", "down"],
            ["anti-spin", "left"],
            ["down", "down", "up", "up"],
        ],
    },
};

/**
 * Vérifie si une tile est un bloc de craft autorisé
 */
export function isCraftingItem(tileTypeId: number): boolean {
    return CRAFTING_ITEMS.hasOwnProperty(tileTypeId);
}

/**
 * Récupère la configuration d'un bloc de craft
 */
export function getCraftingItem(tileTypeId: number): CraftingItem | undefined {
    return CRAFTING_ITEMS[tileTypeId];
}

/**
 * Séquences spécifiques pour chaque transformation
 */
export const TRANSFORMATION_SEQUENCES: TransformationSequence[] = [
    // Table de transformation - Chocolat en chunks
    {
        from: "chocolate",
        to: "chocolate-chunks",
        sequence: ["up", "down", "up", "down"],
    },
    
    // Casserole - Beurre en beurre fondu
    {
        from: "butter",
        to: "molten_butter",
        sequence: ["spin"],
    },
    
    // Casserole - Sucre en caramel
    {
        from: "sugar",
        to: "caramel",
        sequence: ["left", "right", "left", "right"],
    },
];

/**
 * Vérifie si une séquence de craft est valide pour un bloc donné
 */
export function isValidCraftSequence(
    tileTypeId: number,
    sequence: CraftDirection[]
): boolean {
    const craftingItem = getCraftingItem(tileTypeId);
    if (!craftingItem) return false;

    // Vérifier d'abord dans les séquences spécifiques de transformation
    const isTransformationSequence = TRANSFORMATION_SEQUENCES.some(
        (transformation) =>
            transformation.sequence.length === sequence.length &&
            transformation.sequence.every((dir, index) => dir === sequence[index])
    );
    
    if (isTransformationSequence) {
        return true;
    }

    // Sinon, vérifier dans les séquences générales du bloc
    return craftingItem.craftingSequences.some(
        (validSequence) =>
            validSequence.length === sequence.length &&
            validSequence.every((dir, index) => dir === sequence[index])
    );
}

/**
 * Récupère la séquence de craft spécifique pour une transformation donnée
 */
export function getTransformationSequence(
    from: string,
    to: string
): CraftDirection[] | null {
    const transformation = TRANSFORMATION_SEQUENCES.find(
        (t) => t.from === from && t.to === to
    );
    return transformation ? [...transformation.sequence] : null;
}

/**
 * Récupère une séquence de craft aléatoire pour un bloc donné
 */
export function getRandomCraftSequence(
    tileTypeId: number
): CraftDirection[] | null {
    const craftingItem = getCraftingItem(tileTypeId);
    if (!craftingItem || craftingItem.craftingSequences.length === 0) {
        return null;
    }

    const randomIndex = Math.floor(
        Math.random() * craftingItem.craftingSequences.length
    );
    return [...craftingItem.craftingSequences[randomIndex]]; // Copie pour éviter la mutation
}

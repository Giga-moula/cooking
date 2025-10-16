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
 * Vérifie si une séquence de craft est valide pour un bloc donné
 */
export function isValidCraftSequence(
    tileTypeId: number,
    sequence: CraftDirection[]
): boolean {
    const craftingItem = getCraftingItem(tileTypeId);
    if (!craftingItem) return false;

    return craftingItem.craftingSequences.some(
        (validSequence) =>
            validSequence.length === sequence.length &&
            validSequence.every((dir, index) => dir === sequence[index])
    );
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

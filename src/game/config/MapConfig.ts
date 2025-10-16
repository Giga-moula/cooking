/**
 * Configuration des types de tiles pour les cartes
 */

export interface TileTypeConfig {
    texture: string;
    isSolid: boolean;
    isCounter: boolean;
    isIngredient?: string; // Nom de l'ingrédient si c'est une tile d'ingrédient
    isDeliveryZone?: boolean; // True si c'est une zone de livraison
    isOven?: boolean; // True si c'est un four
    isTransformationTable?: boolean; // True si c'est une table de transformation
    isCasserole?: boolean; // True si c'est une casserole de cuisson
    rotation?: number; // Rotation en radians (optionnel)
}

export interface SpawnPoint {
    x: number;
    y: number;
}

export interface MapConfig {
    name: string;
    description: string;
    mapData: number[][];
    tileTypes: { [key: number]: TileTypeConfig };
    spawnPoints: {
        player1: SpawnPoint;
        player2: SpawnPoint;
    };
}

/**
 * Configuration par défaut des types de tiles
 */
export const DEFAULT_TILE_TYPES: { [key: number]: TileTypeConfig } = {
    0: { texture: "", isSolid: false, isCounter: false }, // Vide
    1: { texture: "planks", isSolid: false, isCounter: false }, // Sol
    4: { texture: "iso-wall", isSolid: true, isCounter: false }, // Mur
    5: { texture: "table-mono", isSolid: true, isCounter: true }, // Table normale (sera remplacée par la bonne texture)
    6: { texture: "choco_box", isSolid: true, isCounter: false, isIngredient: "chocolate", rotation: Math.PI }, // Boîte chocolat
    7: { texture: "butter_box", isSolid: true, isCounter: false, isIngredient: "butter", rotation: Math.PI }, // Boîte beurre
    8: { texture: "flour_box", isSolid: true, isCounter: false, isIngredient: "flour", rotation: Math.PI }, // Boîte farine
    9: { texture: "iso-delivery-zone", isSolid: false, isCounter: false, isDeliveryZone: true }, // Zone de livraison
    10: { texture: "table-mono", isSolid: true, isCounter: true, isTransformationTable: true }, // Table de transformation
    11: { texture: "oven", isSolid: true, isCounter: false, isOven: true }, // Four
    12: { texture: "sugar-box", isSolid: true, isCounter: false, isIngredient: "sugar", rotation: Math.PI }, // Boîte sucre
    13: { texture: "casserole_cuisson", isSolid: true, isCounter: false, isCasserole: true }, // Casserole de cuisson
};

/**
 * Configuration de la carte par défaut
 */
export const DEFAULT_MAP_CONFIG: MapConfig = {
    name: "Cuisine de Grand-mère",
    description: "La cuisine principale avec tous les ingrédients et équipements",
    mapData: [
        [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
        [4, 6, 1, 1, 1, 5, 1, 1, 1, 7, 4],
        [4, 5, 1, 1, 1, 5, 1, 1, 1, 5, 4],
        [4, 5, 1, 1, 1, 5, 1, 1, 1, 10, 4],
        [4, 5, 1, 1, 1, 5, 1, 1, 1, 8, 4],
        [4, 11, 1, 1, 1, 5, 1, 1, 1, 10, 4],
        [4, 11, 1, 1, 1, 9, 1, 1, 1, 5, 4],
        [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    ],
    tileTypes: DEFAULT_TILE_TYPES,
    spawnPoints: {
        player1: { x: 2, y: 2 }, // Position en haut à gauche
        player2: { x: 6, y: 4 }  // Position en bas à droite
    }
};

/**
 * Configuration d'une carte alternative (exemple)
 */
export const ALTERNATIVE_MAP_CONFIG: MapConfig = {
    name: "Cuisine Alternative",
    description: "Une disposition différente de la cuisine",
    mapData: [
        [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
        [4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4],
        [4, 1, 6, 1, 1, 5, 1, 1, 7, 1, 4],
        [4, 1, 1, 1, 1, 5, 1, 1, 1, 1, 4],
        [4, 1, 1, 1, 1, 5, 1, 1, 1, 1, 4],
        [4, 1, 1, 1, 1, 5, 1, 1, 1, 1, 4],
        [4, 1, 8, 1, 1, 9, 1, 1, 10, 1, 4],
        [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    ],
    tileTypes: DEFAULT_TILE_TYPES,
    spawnPoints: {
        player1: { x: 1, y: 1 }, // Position en haut à gauche
        player2: { x: 9, y: 6 }  // Position en bas à droite
    }
};

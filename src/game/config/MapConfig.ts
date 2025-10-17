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
    isTrash?: boolean; // True si c'est une poubelle
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
    deliveryZone?: SpawnPoint; // Zone de livraison (optionnelle)
    mapWidth?: number; // Largeur de la map (optionnelle)
    mapHeight?: number; // Hauteur de la map (optionnelle)
}

/**
 * Configuration par défaut des types de tiles
 */
export const DEFAULT_TILE_TYPES: { [key: number]: TileTypeConfig } = {
    0: { texture: "", isSolid: false, isCounter: false }, // Vide
    1: { texture: "planks", isSolid: false, isCounter: false }, // Sol
    4: { texture: "iso-wall", isSolid: true, isCounter: false }, // Mur
    5: { texture: "table-mono", isSolid: true, isCounter: true }, // Table normale (sera remplacée par la bonne texture)
    6: {
        texture: "choco_box",
        isSolid: true,
        isCounter: false,
        isIngredient: "chocolate",
        rotation: Math.PI,
    }, // Boîte chocolat
    7: {
        texture: "butter_box",
        isSolid: true,
        isCounter: false,
        isIngredient: "butter",
        rotation: Math.PI,
    }, // Boîte beurre
    8: {
        texture: "flour_box",
        isSolid: true,
        isCounter: false,
        isIngredient: "flour",
        rotation: Math.PI,
    }, // Boîte farine
    9: {
        texture: "caisse",
        isSolid: true,
        isCounter: false,
        isDeliveryZone: true,
    }, // Zone de livraison (caisse)
    10: {
        texture: "table-mono",
        isSolid: true,
        isCounter: true,
        isTransformationTable: true,
    }, // Table de transformation
    11: { texture: "oven", isSolid: true, isCounter: false, isOven: true }, // Four
    12: {
        texture: "sugar-box",
        isSolid: true,
        isCounter: false,
        isIngredient: "sugar",
        rotation: Math.PI,
    }, // Boîte sucre
    13: {
        texture: "casserole_cuisson",
        isSolid: true,
        isCounter: false,
        isCasserole: true,
    }, // Casserole de cuisson
    14: { texture: "thrash", isSolid: true, isCounter: false, isTrash: true }, // Poubelle
};


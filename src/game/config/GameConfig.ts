/**
 * Configuration centralisée du jeu
 */
export class GameConfig {
    // Configuration de la carte
    static readonly MAP_WIDTH = 10;
    static readonly MAP_HEIGHT = 10;
    static readonly MAP_OFFSET_X = 272;
    static readonly MAP_OFFSET_Y = 144;

    // Configuration des joueurs
    static readonly PLAYER_SPEED = 150;
    static readonly PLAYER_START_POSITIONS = {
        PLAYER_1: { x: 2, y: 2 },
        PLAYER_2: { x: 4, y: 4 }
    };

    // Configuration des objets
    static readonly OBJECT_SCALE = 1.2;
    static readonly OBJECT_DEPTH_OFFSET = 100;

    // Configuration des effets
    static readonly PARTICLE_LIFESPAN = 800;
    static readonly MESSAGE_DURATION = 2000;
    static readonly MESSAGE_OFFSET_Y = -50;

    // Configuration des textures
    static readonly TEXTURE_KEYS = {
        WALL: "iso-wall",
        DELIVERY_ZONE: "iso-delivery-zone",
        TRANSFORMATION_TABLE: "iso-transformation-table",
        OVEN: "oven",
        BUTTER: "butter",
        FLOUR: "flour",
        CHOCOLATE: "chocolate",
        MOLTEN_BUTTER: "molten_butter",
        DOUGH: "dough",
        COOKIE_MIX: "cookie-mix",
        COOKIE: "cookie",
        CHOCOLATE_CHUNKS: "chocolate-chunks",
        STAR: "star",
        FAVICON: "favicon"
    } as const;

    // Configuration des recettes
    static readonly RECIPES = {
        MOLTEN_BUTTER_FLOUR_DOUGH: {
            id: "molten_butter_flour_dough",
            ingredient1: "molten_butter",
            ingredient2: "flour",
            result: "dough",
            name: "Pâte avec beurre fondu"
        },
        DOUGH_CHOCOLATE_CHUNKS_COOKIE_MIX: {
            id: "dough_chocolate_chunks_cookie_mix",
            ingredient1: "dough",
            ingredient2: "chocolate-chunks",
            result: "cookie-mix",
            name: "Cookie Mix avec chunks"
        }
    } as const;

    // Configuration des transformations spéciales
    static readonly SPECIAL_TRANSFORMATIONS = {
        CHOCOLATE_TO_CHUNKS: {
            from: "chocolate",
            to: "chocolate-chunks"
        }
    } as const;

    // Configuration des cuissons au four
    static readonly OVEN_COOKING = {
        BUTTER_TO_MOLTEN: {
            from: "butter",
            to: "molten_butter",
            message: "🧈 Beurre fondu !"
        },
        COOKIE_MIX_TO_COOKIE: {
            from: "cookie-mix",
            to: "cookie",
            message: "🍪 Cookie cuit !"
        }
    } as const;

    // Configuration des messages
    static readonly MESSAGES = {
        INVENTORY_FULL: "❌ Inventaire plein",
        TABLE_OCCUPIED: "❌ Table occupée. Utilisez la table bleue (R/P) pour combiner !",
        USE_TRANSFORM_KEY: "💡 Utilisez R/P pour combiner sur la table bleue !",
        RECIPE_SUCCESS: "✨ Recette réussie !",
        TRANSFORMATION_SUCCESS: "✨ Transformation réussie !"
    } as const;

    // Configuration des couleurs
    static readonly COLORS = {
        PLAYER_1: "blue",
        PLAYER_2: "red",
        BACKGROUND: 0x87ceeb,
        PARTICLE_TINT: 0xff4500
    } as const;
}

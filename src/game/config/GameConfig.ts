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
    static readonly CRAFT_PLAN_SCALE = 1.5; // Échelle du craft_plan
    static readonly CRAFT_PLAN_ALPHA = 1; // Transparence du craft_plan
    static readonly CRAFT_PLAN_OFFSET_Y = -5; // Décalage vertical du craft_plan
    
    // Configuration des rotations du craft_plan
    static readonly CRAFT_PLAN_ROTATIONS = {
        NORMAL: 0,                    // 0°
        LEFT: -Math.PI / 2,          // -90°
        RIGHT: Math.PI / 2,          // 90°
        UPSIDE_DOWN: Math.PI,        // 180°
    } as const;

    // Configuration des textures
    static readonly TEXTURE_KEYS = {
        WALL: "iso-wall",
        DELIVERY_ZONE: "iso-delivery-zone",
        TRANSFORMATION_TABLE: "table-mono", // Maintenant utilise les vraies tables
        OVEN: "oven",
        CRAFT_PLAN: "craft_plan",
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

    // Configuration du timer
    static readonly TIMER = {
        GAME_DURATION: 300, // 5 minutes en secondes
        DELIVERY_BONUS: 15, // Bonus de temps par livraison (en secondes)
        DISPLAY_X: 512,
        DISPLAY_Y: 20
    } as const;

    // Configuration Phaser
    static readonly PHASER_CONFIG = {
        WIDTH: 1024,
        HEIGHT: 768,
        BACKGROUND_COLOR: "#028af8",
        PARENT: "game-container",
        PHYSICS_GRAVITY: { x: 0, y: 0 },
        PHYSICS_DEBUG: false
    } as const;
}

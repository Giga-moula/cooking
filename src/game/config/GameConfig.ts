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
        PLAYER_2: { x: 6, y: 4 },
    };

    // Configuration des objets
    static readonly OBJECT_SCALE = 1.2;
    static readonly OBJECT_DEPTH_OFFSET = 100;
    static readonly CARRIED_ITEM_SCALE = 0.8;
    static readonly CARRIED_ITEM_OFFSET_DISTANCE = 20;

    // Configuration de l'inventaire
    static readonly INVENTORY = {
        MAX_ITEMS: 1, // Capacité maximale de l'inventaire
        CARRIED_OFFSET_DISTANCE: 20,
        CARRIED_SCALE: 0.8,
        // Ajustements de position selon la direction
        OFFSET_HORIZONTAL_Y: 8,
        OFFSET_UP_Y: 15,
        OFFSET_DOWN_Y: -5,
    } as const;

    // Configuration des effets
    static readonly PARTICLE_LIFESPAN = 800;
    static readonly MESSAGE_DURATION = 2000;
    static readonly MESSAGE_OFFSET_Y = -50;

    // Configuration des boîtes de recettes
    static readonly RECIPE_BOX = {
        WIDTH: 120,
        SPACING: 10,
    } as const;
    static readonly CRAFT_PLAN_SCALE = 1.5; // Échelle du craft_plan
    static readonly CRAFT_PLAN_ALPHA = 1; // Transparence du craft_plan
    static readonly CRAFT_PLAN_OFFSET_Y = -5; // Décalage vertical du craft_plan

    // Configuration des rotations du craft_plan
    static readonly CRAFT_PLAN_ROTATIONS = {
        NORMAL: 0, // 0°
        LEFT: -Math.PI / 2, // -90°
        RIGHT: Math.PI / 2, // 90°
        UPSIDE_DOWN: Math.PI, // 180°
    } as const;

    // Configuration des textures
    static readonly TEXTURE_KEYS = {
        WALL: "iso-wall",
        DELIVERY_ZONE: "caisse",
        TRANSFORMATION_TABLE: "table-mono", // Maintenant utilise les vraies tables
        OVEN: "oven",
        CRAFT_PLAN: "craft_plan",
        BUTTER: "butter",
        FLOUR: "flour",
        CHOCOLATE: "chocolate",
        SUGAR: "sugar",
        SUGAR_BOX: "sugar-box",
        CASSEROLE: "casserole_cuisson",
        MOLTEN_BUTTER: "molten_butter",
        DOUGH: "dough",
        COOKIE_MIX_CHOCO: "cookie-mix-choco",
        COOKIE_CHOCO: "cookie-choco",
        CHOCOLATE_CHUNKS: "chocolate-chunks",
        STAR: "star",
        FAVICON: "favicon",
    } as const;

    // Configuration des recettes - Maintenant gérée dans src/game/data/recipes.ts

    // Configuration des transformations spéciales - Maintenant gérée dans src/game/data/ingredients.ts
    // Configuration des cuissons au four - Gérée directement dans OvenManager.ts
    // Configuration des messages - Messages hardcodés dans les managers

    // Configuration des couleurs
    static readonly COLORS = {
        PLAYER_1: "blue",
        PLAYER_2: "red",
        BACKGROUND: 0x87ceeb,
        PARTICLE_TINT: 0xff4500,
    } as const;

    // Configuration du timer
    static readonly TIMER = {
        GAME_DURATION: 200, // 5 minutes en secondes
        DELIVERY_BONUS: 15, // Bonus de temps par livraison (en secondes)
        DISPLAY_X: 512,
        DISPLAY_Y: 20,
    } as const;

    // Configuration Phaser
    static readonly PHASER_CONFIG = {
        WIDTH: 1024,
        HEIGHT: 768,
        BACKGROUND_COLOR: "#028af8",
        PARENT: "game-container",
        PHYSICS_GRAVITY: { x: 0, y: 0 },
        PHYSICS_DEBUG: false,
    } as const;
}


/**
 * Constantes globales du jeu pour éviter les "magic numbers"
 */

// Constantes de physique et mouvement
export const PHYSICS_CONSTANTS = {
    DIAGONAL_MOVEMENT_FACTOR: 0.7071067811865476, // Math.SQRT2 / 2
    HITBOX_HEIGHT_RATIO: 0.3,
    HITBOX_OFFSET_RATIO: 0.7,
} as const;

// Constantes de profondeur (depth/z-index)
export const DEPTH_CONSTANTS = {
    ITEM_ON_COUNTER_OFFSET: 100,
    PLAYER_DEPTH_MULTIPLIER: 10,
    PLAYER_DEPTH_OFFSET: 5,
    CARRIED_ITEM_OFFSET_BEHIND: -1,
    CARRIED_ITEM_OFFSET_FRONT: 1,
    UI_LAYER: 10000,
} as const;

// Constantes d'échelle visuelle
export const SCALE_CONSTANTS = {
    ITEM_ON_COUNTER: 1.2,
    ITEM_IN_OVEN: 1.2,
    ITEM_IN_CASSEROLE: 1.2,
} as const;

// Constantes de temps (en millisecondes)
export const TIME_CONSTANTS = {
    PARTICLE_LIFESPAN_FIRE: 800,
    PARTICLE_LIFESPAN_STEAM: 1000,
    PARTICLE_LIFESPAN_TRASH: 500,
    COOKING_MESSAGE_DURATION: 1500,
    COMBINATION_MESSAGE_DURATION: 2000,
} as const;

// Constantes de particules
export const PARTICLE_CONSTANTS = {
    FIRE: {
        SPEED: { min: -50, max: 50 },
        ANGLE: { min: 270, max: 90 },
        SCALE: { start: 0.3, end: 0 },
        QUANTITY: 10,
        TINT: 0xff4500, // Orange-rouge
        BLEND_MODE: 'ADD' as const,
    },
    STEAM: {
        SPEED: { min: -30, max: 30 },
        ANGLE: { min: 270, max: 270 },
        SCALE: { start: 0.2, end: 0 },
        QUANTITY: 8,
        TINT: 0x87ceeb, // Bleu ciel
        BLEND_MODE: 'ADD' as const,
    },
    TRASH: {
        SPEED: { min: -80, max: 80 },
        ANGLE: { min: 0, max: 360 },
        SCALE: { start: 0.4, end: 0 },
        QUANTITY: 8,
        TINT: 0x8B4513, // Marron
        BLEND_MODE: 'NORMAL' as const,
    },
} as const;

// Constantes de génération de carte
export const MAP_GENERATION_CONSTANTS = {
    MAX_GENERATION_ATTEMPTS: 10,
    MIN_ZONE_SIZE: 3,
    MAX_ZONE_SIZE: 5,
    COMMUNICATION_COUNTERS: 2,
    MAX_TABLES_PER_ZONE: 2,
    SPAWN_PROTECTION_RADIUS: 2,
} as const;

// Constantes de cuisson
export const COOKING_CONSTANTS = {
    MAX_FAILURES_BEFORE_BURN: 3,
} as const;

// IDs de tiles (pour référence)
export const TILE_IDS = {
    FLOOR: 1,
    WALL: 4,
    TABLE: 5,
    CHOCO_BOX: 6,
    BUTTER_BOX: 7,
    FLOUR_BOX: 8,
    DELIVERY_ZONE: 9,
    TRANSFORMATION_TABLE: 10,
    OVEN: 11,
    SUGAR_BOX: 12,
    CASSEROLE: 13,
    TRASH: 14,
} as const;

// Offsets pour le positionnement des joueurs
export const PLAYER_OFFSET = {
    Y_ADJUSTMENT: -12, // Compensation pour le changement d'origine
} as const;


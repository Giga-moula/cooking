/**
 * Configuration des voix des personnages
 */

export interface VoiceConfig {
    soundKey: string;
    probability: number; // Pourcentage de chance (0-100)
    ingredient?: string; // Ingrédient associé (optionnel)
    playerNumber?: number; // Numéro du joueur (optionnel)
}

/**
 * Configuration des voix par défaut
 */
export const DEFAULT_VOICE_CONFIGS: Map<string, VoiceConfig> = new Map([
    // Voix de Danielle (Joueur 1)
    [
        "danielle-beurre",
        {
            soundKey: "danielle-beurre",
            probability: 50, // 50% de chance
            ingredient: "butter",
            playerNumber: 1,
        },
    ],
    [
        "danielle-huile-casserole",
        {
            soundKey: "danielle-huile",
            probability: 50, // 50% de chance
            ingredient: "casserole", // Se déclenche lors de l'utilisation de la casserole
            playerNumber: 1,
        },
    ],
    [
        "danielle-enfourne-four",
        {
            soundKey: "danielle-enfourne",
            probability: 50, // 50% de chance
            ingredient: "oven", // Se déclenche lors de l'utilisation du four
            playerNumber: 1,
        },
    ],
    // Voix aléatoires toutes les 45 secondes
    [
        "danielle-godiche-random",
        {
            soundKey: "danielle-godiche",
            probability: 100, // Toujours joué quand sélectionné
            ingredient: "random", // Voix aléatoire
            playerNumber: 1,
        },
    ],
    [
        "danielle-povcruche-random",
        {
            soundKey: "danielle-povcruche",
            probability: 100, // Toujours joué quand sélectionné
            ingredient: "random", // Voix aléatoire
            playerNumber: 1,
        },
    ],
    [
        "mireille-tgmireille-random",
        {
            soundKey: "mireille-tgmireille",
            probability: 100, // Toujours joué quand sélectionné
            ingredient: "random", // Voix aléatoire
            playerNumber: 1,
        },
    ],

    // Voix de Mireille (Joueur 2)
    [
        "mireille-beurre",
        {
            soundKey: "mireille-beurre",
            probability: 50, // 50% de chance
            ingredient: "butter",
            playerNumber: 2,
        },
    ],
    [
        "mireille-huile-casserole",
        {
            soundKey: "mireille-huile",
            probability: 50, // 50% de chance
            ingredient: "casserole", // Se déclenche lors de l'utilisation de la casserole
            playerNumber: 2,
        },
    ],
    [
        "mireille-enfourne-four",
        {
            soundKey: "mireille-enfourne",
            probability: 50, // 50% de chance
            ingredient: "oven", // Se déclenche lors de l'utilisation du four
            playerNumber: 2,
        },
    ],
    [
        "mireille-tgmireille-random",
        {
            soundKey: "mireille-tgmireille",
            probability: 100, // Toujours joué quand sélectionné
            ingredient: "random", // Voix aléatoire
            playerNumber: 2,
        },
    ],
    [
        "mireille-povcruche-random",
        {
            soundKey: "mireille-povcruche",
            probability: 100, // Toujours joué quand sélectionné
            ingredient: "random", // Voix aléatoire
            playerNumber: 2,
        },
    ],
    [
        "mireille-godiche-random",
        {
            soundKey: "mireille-godiche",
            probability: 100, // Toujours joué quand sélectionné
            ingredient: "random", // Voix aléatoire
            playerNumber: 2,
        },
    ],

    // Exemples d'autres voix à ajouter :
    // ["danielle-farine", {
    //     soundKey: "danielle-farine",
    //     probability: 30,
    //     ingredient: "flour",
    //     playerNumber: 1
    // }],
    // ["danielle-chocolat", {
    //     soundKey: "danielle-chocolat",
    //     probability: 25,
    //     ingredient: "chocolate",
    //     playerNumber: 1
    // }],
    // ["danielle-sucre", {
    //     soundKey: "danielle-sucre",
    //     probability: 40,
    //     ingredient: "sugar",
    //     playerNumber: 1
    // }],
]);


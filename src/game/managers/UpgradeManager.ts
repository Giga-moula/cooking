/**
 * Types d'upgrades disponibles
 */
export enum UpgradeType {
    SPEED_BOOST = "speed_boost",
    RECIPE_UNLOCK = "recipe_unlock",
    MAX_ORDERS = "max_orders",
    EXTRA_TIME = "extra_time",
    OVEN_SPEED = "oven_speed",
    SCORE_MULTIPLIER = "score_multiplier",
}

/**
 * Définition d'un upgrade
 */
export interface Upgrade {
    id: string;
    name: string;
    description: string;
    type: UpgradeType;
    cost: number;
    icon: string;
    maxLevel: number;
    currentLevel: number;
    effect: (level: number) => any;
}

/**
 * Gestionnaire des upgrades
 */
export class UpgradeManager {
    private upgrades: Map<string, Upgrade> = new Map();
    private purchasedUpgrades: Set<string> = new Set();

    constructor() {
        this.initializeUpgrades();
    }

    /**
     * Initialise tous les upgrades disponibles
     */
    private initializeUpgrades(): void {
        // VITESSE DE DÉPLACEMENT
        this.registerUpgrade({
            id: "speed_1",
            name: "Chaussures de Course",
            description: "+20% vitesse de déplacement",
            type: UpgradeType.SPEED_BOOST,
            cost: 150,
            icon: "👟",
            maxLevel: 3,
            currentLevel: 0,
            effect: (level: number) => ({ speedMultiplier: 1 + level * 0.2 }),
        });

        this.registerUpgrade({
            id: "speed_2",
            name: "Rollers Pro",
            description: "+50% vitesse de déplacement",
            type: UpgradeType.SPEED_BOOST,
            cost: 400,
            icon: "🛼",
            maxLevel: 1,
            currentLevel: 0,
            effect: (level: number) => ({ speedMultiplier: 1.5 }),
        });

        // TEMPS SUPPLÉMENTAIRE
        this.registerUpgrade({
            id: "time_1",
            name: "Horloge Magique",
            description: "+30 secondes au timer global",
            type: UpgradeType.EXTRA_TIME,
            cost: 200,
            icon: "⏰",
            maxLevel: 3,
            currentLevel: 0,
            effect: (level: number) => ({ extraTime: level * 30 }),
        });

        this.registerUpgrade({
            id: "time_2",
            name: "Sablier Infini",
            description: "+15 secondes par commande livrée",
            type: UpgradeType.EXTRA_TIME,
            cost: 300,
            icon: "⏳",
            maxLevel: 1,
            currentLevel: 0,
            effect: (level: number) => ({ bonusTimePerDelivery: 15 }),
        });

        // FOUR PLUS RAPIDE
        this.registerUpgrade({
            id: "oven_1",
            name: "Four Turbo",
            description: "Cuisson 30% plus rapide",
            type: UpgradeType.OVEN_SPEED,
            cost: 250,
            icon: "🔥",
            maxLevel: 2,
            currentLevel: 0,
            effect: (level: number) => ({ ovenSpeedMultiplier: 1 - level * 0.3 }),
        });

        // MULTIPLICATEUR DE SCORE
        this.registerUpgrade({
            id: "score_1",
            name: "Étoile d'Or",
            description: "+25% de points par livraison",
            type: UpgradeType.SCORE_MULTIPLIER,
            cost: 180,
            icon: "⭐",
            maxLevel: 3,
            currentLevel: 0,
            effect: (level: number) => ({ scoreMultiplier: 1 + level * 0.25 }),
        });

        // RECETTES SPÉCIALES
        this.registerUpgrade({
            id: "recipe_rainbow",
            name: "Cookie Arc-en-ciel",
            description: "Débloque une recette spéciale haute valeur",
            type: UpgradeType.RECIPE_UNLOCK,
            cost: 500,
            icon: "🌈",
            maxLevel: 1,
            currentLevel: 0,
            effect: (level: number) => ({ unlockedRecipe: "cookie-rainbow" }),
        });

        // COMMANDES SUPPLÉMENTAIRES
        this.registerUpgrade({
            id: "orders_1",
            name: "Tableau Étendu",
            description: "+1 commande simultanée max (5 total)",
            type: UpgradeType.MAX_ORDERS,
            cost: 350,
            icon: "📋",
            maxLevel: 1,
            currentLevel: 0,
            effect: (level: number) => ({ maxOrders: 5 }),
        });

        this.registerUpgrade({
            id: "orders_2",
            name: "Mur de Commandes",
            description: "+2 commandes simultanées max (6 total)",
            type: UpgradeType.MAX_ORDERS,
            cost: 600,
            icon: "📊",
            maxLevel: 1,
            currentLevel: 0,
            effect: (level: number) => ({ maxOrders: 6 }),
        });
    }

    /**
     * Enregistre un upgrade
     */
    private registerUpgrade(upgrade: Upgrade): void {
        this.upgrades.set(upgrade.id, upgrade);
    }

    /**
     * Achète un upgrade
     */
    public purchaseUpgrade(upgradeId: string): boolean {
        const upgrade = this.upgrades.get(upgradeId);
        if (!upgrade) return false;

        if (upgrade.currentLevel >= upgrade.maxLevel) {
            return false; // Déjà au niveau max
        }

        upgrade.currentLevel++;
        this.purchasedUpgrades.add(upgradeId);
        return true;
    }

    /**
     * Vérifie si un upgrade peut être acheté
     */
    public canPurchase(upgradeId: string): boolean {
        const upgrade = this.upgrades.get(upgradeId);
        if (!upgrade) return false;
        return upgrade.currentLevel < upgrade.maxLevel;
    }

    /**
     * Obtient tous les upgrades
     */
    public getAllUpgrades(): Upgrade[] {
        return Array.from(this.upgrades.values());
    }

    /**
     * Obtient un upgrade par ID
     */
    public getUpgrade(upgradeId: string): Upgrade | undefined {
        return this.upgrades.get(upgradeId);
    }

    /**
     * Obtient les upgrades par type
     */
    public getUpgradesByType(type: UpgradeType): Upgrade[] {
        return Array.from(this.upgrades.values()).filter(
            (u) => u.type === type
        );
    }

    /**
     * Obtient tous les effets actifs
     */
    public getActiveEffects(): any {
        const effects: any = {
            speedMultiplier: 1,
            scoreMultiplier: 1,
            ovenSpeedMultiplier: 1,
            extraTime: 0,
            bonusTimePerDelivery: 0,
            maxOrders: 4,
            unlockedRecipes: [],
        };

        this.purchasedUpgrades.forEach((upgradeId) => {
            const upgrade = this.upgrades.get(upgradeId);
            if (upgrade && upgrade.currentLevel > 0) {
                const effect = upgrade.effect(upgrade.currentLevel);
                
                // Fusionner les effets
                Object.keys(effect).forEach((key) => {
                    if (key === "unlockedRecipe") {
                        effects.unlockedRecipes.push(effect[key]);
                    } else if (
                        key.includes("Multiplier") &&
                        effects[key] !== undefined
                    ) {
                        effects[key] *= effect[key];
                    } else if (effects[key] !== undefined) {
                        if (typeof effects[key] === "number") {
                            effects[key] = Math.max(effects[key], effect[key]);
                        } else {
                            effects[key] = effect[key];
                        }
                    }
                });
            }
        });

        return effects;
    }

    /**
     * Réinitialise tous les upgrades
     */
    public reset(): void {
        this.purchasedUpgrades.clear();
        this.upgrades.forEach((upgrade) => {
            upgrade.currentLevel = 0;
        });
    }

    /**
     * Obtient le nombre total d'upgrades achetés
     */
    public getTotalPurchased(): number {
        return this.purchasedUpgrades.size;
    }
}


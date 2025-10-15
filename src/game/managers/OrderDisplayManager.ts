import Phaser from "phaser";
import { IngredientInteractionManager } from "./IngredientInteractionManager";

// Constantes de configuration
const CONFIG = {
    // Dimensions des boîtes de recettes
    BOX_WIDTH: 120,
    BOX_HEIGHT: 140,
    BOX_SPACING: 10,
    BOX_POSITION: { x: 20, y: 20 },

    // Dimensions de la barre de progression
    BAR_WIDTH: 116,
    BAR_HEIGHT: 8,
    BAR_PADDING: 2,

    // Zones dans la boîte
    DISH_AREA: { x: 5, y: 15, width: 110, height: 60 },
    INGREDIENT_AREA: { x: 5, y: 80, width: 110, height: 55 },

    // Positions des icônes
    DISH_ICON: { x: 60, y: 45, scale: 1.5, defaultTexture: "cookie" },
    INGREDIENT_ICONS: {
        startX: 35,
        spacing: 50,
        y: 110,
        scale: 1.2,
        maxCount: 3,
        defaultTexture: "chocolate",
    },

    // Couleurs
    COLORS: {
        BACKGROUND: 0xf0f0f0,
        BORDER: 0x333333,
        DISH_AREA: 0xffffff,
        INGREDIENT_AREA: 0xe3f2fd,
        BORDER_LIGHT: 0xcccccc,
        GREEN: 0x4caf50,
        YELLOW: 0xffeb3b,
        ORANGE: 0xff9800,
        RED: 0xf44336,
        SUCCESS: "#4CAF50",
        ERROR: "#F44336",
    },

    // Animation
    ANIMATION_FPS: 16, // 60 FPS
    PULSE_DURATION: 500,
    MESSAGE_DURATION: 1500,
    SHAKE_DURATION: 100,
    SHAKE_REPEAT: 3,

    // Délais
    NEW_ORDER_DELAY: 2000,
    PARTICLE_LIFESPAN: 800,

    // Seuils de progression
    PROGRESS_THRESHOLDS: {
        YELLOW: 0.75,
        ORANGE: 0.5,
        RED: 0.25,
    },
} as const;

// Interface pour les boîtes de recettes
interface RecipeBox {
    container: Phaser.GameObjects.Container;
    colorBar: Phaser.GameObjects.Graphics;
    dishIcon: Phaser.GameObjects.Image;
    ingredientIcons: Phaser.GameObjects.Image[];
    orderId: string | null;
    timerEvent?: Phaser.Time.TimerEvent;
    timeRemaining: number;
    maxTime: number;
    currentBarWidth: number;
    targetBarWidth: number;
    startTime: number;
    isPulsating: boolean;
}

/**
 * Gestionnaire de l'affichage des commandes (recettes)
 */
export class OrderDisplayManager {
    private scene: Phaser.Scene;
    private recipeBoxes: RecipeBox[] = [];
    private activeOrders: string[] = [];
    private maxOrders: number = 4;
    private ingredientManager: IngredientInteractionManager;
    private orderDuration: number = 60; // Durée en secondes pour chaque commande

    constructor(
        scene: Phaser.Scene,
        ingredientManager: IngredientInteractionManager
    ) {
        this.scene = scene;
        this.ingredientManager = ingredientManager;
    }

    /**
     * Initialise l'affichage des recettes en haut à gauche
     */
    initializeRecipeDisplay(): void {
        // Créer un conteneur pour toutes les boîtes de recettes
        const recipeContainer = this.scene.add.container(
            CONFIG.BOX_POSITION.x,
            CONFIG.BOX_POSITION.y
        );
        recipeContainer.setScrollFactor(0);
        recipeContainer.setDepth(2000);

        // Créer les boîtes de recettes
        for (let i = 0; i < this.maxOrders; i++) {
            this.createRecipeBox(recipeContainer, i);
        }
    }

    /**
     * Crée une boîte de recette individuelle
     */
    private createRecipeBox(
        parent: Phaser.GameObjects.Container,
        index: number
    ): void {
        const x = index * (CONFIG.BOX_WIDTH + CONFIG.BOX_SPACING);
        const y = 0;

        const boxContainer = this.scene.add.container(x, y);
        parent.add(boxContainer);

        // Créer les éléments graphiques
        const background = this.createBoxBackground();
        const colorBar = this.createColorBar();
        const dishArea = this.createDishArea();
        const ingredientArea = this.createIngredientArea();
        const dishIcon = this.createDishIcon();
        const ingredientIcons = this.createIngredientIcons();

        // Ajouter tous les éléments au conteneur
        [
            background,
            colorBar,
            dishArea,
            ingredientArea,
            dishIcon,
            ...ingredientIcons,
        ].forEach((element) => boxContainer.add(element));

        const recipeBox: RecipeBox = {
            container: boxContainer,
            colorBar: colorBar,
            dishIcon: dishIcon,
            ingredientIcons: ingredientIcons,
            orderId: null,
            timerEvent: undefined,
            timeRemaining: 0,
            maxTime: 0,
            currentBarWidth: CONFIG.BAR_WIDTH,
            targetBarWidth: CONFIG.BAR_WIDTH,
            startTime: 0,
            isPulsating: false,
        };

        this.recipeBoxes.push(recipeBox);
    }

    /**
     * Crée le fond de la boîte de recette
     */
    private createBoxBackground(): Phaser.GameObjects.Graphics {
        const background = this.scene.add.graphics();
        background.fillStyle(CONFIG.COLORS.BACKGROUND, 1);
        background.fillRoundedRect(
            0,
            0,
            CONFIG.BOX_WIDTH,
            CONFIG.BOX_HEIGHT,
            8
        );
        background.lineStyle(2, CONFIG.COLORS.BORDER, 1);
        background.strokeRoundedRect(
            0,
            0,
            CONFIG.BOX_WIDTH,
            CONFIG.BOX_HEIGHT,
            8
        );
        return background;
    }

    /**
     * Crée la barre de couleur de progression
     */
    private createColorBar(): Phaser.GameObjects.Graphics {
        const colorBar = this.scene.add.graphics();
        colorBar.fillStyle(CONFIG.COLORS.GREEN, 1);
        colorBar.fillRoundedRect(
            CONFIG.BAR_PADDING,
            CONFIG.BAR_PADDING,
            CONFIG.BAR_WIDTH,
            CONFIG.BAR_HEIGHT,
            4
        );
        return colorBar;
    }

    /**
     * Crée la zone d'affichage du plat fini
     */
    private createDishArea(): Phaser.GameObjects.Graphics {
        const dishArea = this.scene.add.graphics();
        dishArea.fillStyle(CONFIG.COLORS.DISH_AREA, 1);
        dishArea.fillRoundedRect(
            CONFIG.DISH_AREA.x,
            CONFIG.DISH_AREA.y,
            CONFIG.DISH_AREA.width,
            CONFIG.DISH_AREA.height,
            4
        );
        dishArea.lineStyle(1, CONFIG.COLORS.BORDER_LIGHT, 1);
        dishArea.strokeRoundedRect(
            CONFIG.DISH_AREA.x,
            CONFIG.DISH_AREA.y,
            CONFIG.DISH_AREA.width,
            CONFIG.DISH_AREA.height,
            4
        );
        return dishArea;
    }

    /**
     * Crée la zone d'affichage des ingrédients
     */
    private createIngredientArea(): Phaser.GameObjects.Graphics {
        const ingredientArea = this.scene.add.graphics();
        ingredientArea.fillStyle(CONFIG.COLORS.INGREDIENT_AREA, 1);
        ingredientArea.fillRoundedRect(
            CONFIG.INGREDIENT_AREA.x,
            CONFIG.INGREDIENT_AREA.y,
            CONFIG.INGREDIENT_AREA.width,
            CONFIG.INGREDIENT_AREA.height,
            4
        );
        ingredientArea.lineStyle(1, CONFIG.COLORS.BORDER_LIGHT, 1);
        ingredientArea.strokeRoundedRect(
            CONFIG.INGREDIENT_AREA.x,
            CONFIG.INGREDIENT_AREA.y,
            CONFIG.INGREDIENT_AREA.width,
            CONFIG.INGREDIENT_AREA.height,
            4
        );
        return ingredientArea;
    }

    /**
     * Crée l'icône du plat fini
     */
    private createDishIcon(): Phaser.GameObjects.Image {
        const dishIcon = this.scene.add.image(
            CONFIG.DISH_ICON.x,
            CONFIG.DISH_ICON.y,
            CONFIG.DISH_ICON.defaultTexture // Texture par défaut configurable
        );
        dishIcon.setScale(CONFIG.DISH_ICON.scale);
        dishIcon.setVisible(false); // Caché par défaut jusqu'à ce qu'une recette soit assignée
        return dishIcon;
    }

    /**
     * Crée les icônes des ingrédients
     */
    private createIngredientIcons(): Phaser.GameObjects.Image[] {
        const ingredientIcons: Phaser.GameObjects.Image[] = [];

        for (let i = 0; i < CONFIG.INGREDIENT_ICONS.maxCount; i++) {
            const icon = this.scene.add.image(
                CONFIG.INGREDIENT_ICONS.startX +
                    i * CONFIG.INGREDIENT_ICONS.spacing,
                CONFIG.INGREDIENT_ICONS.y,
                CONFIG.INGREDIENT_ICONS.defaultTexture // Texture par défaut configurable
            );
            icon.setScale(CONFIG.INGREDIENT_ICONS.scale);
            icon.setVisible(false);
            ingredientIcons.push(icon);
        }

        return ingredientIcons;
    }

    /**
     * Génère de nouvelles commandes
     */
    generateNewOrders(): void {
        const recipeManager = this.ingredientManager.getRecipeManager();
        const dishes = recipeManager.getDishes();

        // Nettoyer les commandes existantes
        this.clearAllOrders();

        // Générer de nouvelles commandes (2-4 commandes)
        const numOrders = Phaser.Math.Between(2, this.maxOrders);
        const availableDishes = [...dishes];

        for (let i = 0; i < numOrders && availableDishes.length > 0; i++) {
            const randomIndex = Phaser.Math.Between(
                0,
                availableDishes.length - 1
            );
            const dish = availableDishes[randomIndex];
            availableDishes.splice(randomIndex, 1);

            this.activeOrders.push(dish.id);
            this.updateRecipeBoxForDish(i, dish);
        }
    }

    /**
     * Nettoie toutes les commandes existantes
     */
    private clearAllOrders(): void {
        this.activeOrders = [];
        this.recipeBoxes.forEach((box) => this.clearOrderBox(box));
    }

    /**
     * Nettoie une boîte de commande spécifique
     */
    private clearOrderBox(box: RecipeBox): void {
        this.stopOrderTimer(box);
        this.stopPulsationEffect(box);
        this.hideOrderContent(box);
    }

    /**
     * Arrête le timer d'une commande
     */
    private stopOrderTimer(box: RecipeBox): void {
        if (box.timerEvent) {
            box.timerEvent.destroy();
            box.timerEvent = undefined;
        }
    }

    /**
     * Arrête l'effet de pulsation
     */
    private stopPulsationEffect(box: RecipeBox): void {
        if (box.isPulsating) {
            this.scene.tweens.killTweensOf(box.colorBar);
            box.colorBar.setAlpha(1);
            box.isPulsating = false;
        }
    }

    /**
     * Cache le contenu d'une commande
     */
    private hideOrderContent(box: RecipeBox): void {
        box.orderId = null;
        box.dishIcon.setVisible(false);
        box.ingredientIcons.forEach((icon) => icon.setVisible(false));
    }

    /**
     * Obtient la couleur associée à un type de plat
     */
    private getDishColor(dishType: string): number {
        const colorMap: Record<string, number> = {
            cookie: CONFIG.COLORS.ORANGE,
            dough: 0x8bc34a, // Vert clair
            favicon: CONFIG.COLORS.GREEN,
        };
        return colorMap[dishType] || CONFIG.COLORS.GREEN;
    }

    /**
     * Met à jour l'apparence de la barre de couleur
     */
    private updateColorBarAppearance(box: RecipeBox, color: number): void {
        box.colorBar.clear();
        box.colorBar.fillStyle(color, 1);
        box.colorBar.fillRoundedRect(
            CONFIG.BAR_PADDING,
            CONFIG.BAR_PADDING,
            box.currentBarWidth, // Utiliser la largeur dynamique au lieu de CONFIG.BAR_WIDTH
            CONFIG.BAR_HEIGHT,
            4
        );
    }

    /**
     * Met à jour les icônes des ingrédients
     */
    private updateIngredientIcons(box: RecipeBox, recipe: any): void {
        const ingredients = [recipe.ingredient1, recipe.ingredient2];
        box.ingredientIcons.forEach((icon, index) => {
            if (index < ingredients.length) {
                icon.setTexture(ingredients[index]);
                icon.setVisible(true);
            } else {
                icon.setVisible(false);
            }
        });
    }

    /**
     * Obtient la couleur de progression selon le pourcentage
     */
    private getProgressColor(progress: number): number {
        const { YELLOW, ORANGE, RED } = CONFIG.PROGRESS_THRESHOLDS;
        const {
            GREEN,
            YELLOW: YELLOW_COLOR,
            ORANGE: ORANGE_COLOR,
            RED: RED_COLOR,
        } = CONFIG.COLORS;

        if (progress > YELLOW) {
            // Transition verte vers jaune (100% à 75%)
            const localProgress = (progress - YELLOW) / (1 - YELLOW);
            return this.interpolateColor(
                GREEN,
                YELLOW_COLOR,
                1 - localProgress
            );
        } else if (progress > ORANGE) {
            // Transition jaune vers orange (75% à 50%)
            const localProgress = (progress - ORANGE) / (YELLOW - ORANGE);
            return this.interpolateColor(
                YELLOW_COLOR,
                ORANGE_COLOR,
                1 - localProgress
            );
        } else if (progress > RED) {
            // Transition orange vers rouge (50% à 25%)
            const localProgress = (progress - RED) / (ORANGE - RED);
            return this.interpolateColor(
                ORANGE_COLOR,
                RED_COLOR,
                1 - localProgress
            );
        } else {
            // Rouge pour les 25% restants
            return RED_COLOR;
        }
    }

    /**
     * Gère l'effet de pulsation selon le pourcentage de progression
     */
    private handlePulsationEffect(box: RecipeBox, progress: number): void {
        const isUrgent = progress <= CONFIG.PROGRESS_THRESHOLDS.RED;

        if (isUrgent && !box.isPulsating) {
            this.startPulsationEffect(box);
        } else if (!isUrgent && box.isPulsating) {
            this.stopPulsationEffect(box);
        }
    }

    /**
     * Démarre l'effet de pulsation
     */
    private startPulsationEffect(box: RecipeBox): void {
        box.isPulsating = true;
        this.scene.tweens.add({
            targets: box.colorBar,
            alpha: 0.5,
            duration: CONFIG.PULSE_DURATION,
            yoyo: true,
            ease: "Cubic.easeInOut",
            repeat: -1, // Répéter indéfiniment
        });
    }

    /**
     * Met à jour une boîte de recette avec les données d'un plat fini
     */
    private updateRecipeBoxForDish(boxIndex: number, dish: any): void {
        if (boxIndex >= this.recipeBoxes.length) return;

        const recipeManager = this.ingredientManager.getRecipeManager();
        const allRecipes = recipeManager.getAllRecipes();
        const recipe = allRecipes.find((r) => r.result === dish.id);

        if (!recipe) {
            console.warn(`Aucune recette trouvée pour le plat: ${dish.id}`);
            return;
        }

        this.updateRecipeBox(boxIndex, recipe);
    }

    /**
     * Met à jour une boîte de recette avec les données d'une recette
     */
    private updateRecipeBox(boxIndex: number, recipe: any): void {
        if (boxIndex >= this.recipeBoxes.length) return;

        const box = this.recipeBoxes[boxIndex];
        box.orderId = recipe.result;

        // Couleur de la barre selon le type de plat
        const color = this.getDishColor(recipe.result);
        this.updateColorBarAppearance(box, color);

        // Icône du plat fini
        box.dishIcon.setTexture(recipe.result);
        box.dishIcon.setVisible(true);

        // Icônes des ingrédients
        this.updateIngredientIcons(box, recipe);

        // Démarrer le timer pour cette commande
        this.startOrderTimer(boxIndex);
    }

    /**
     * Vérifie si un plat réalisé correspond à une commande
     */
    checkOrderCompletion(dishId: string): boolean {
        const orderIndex = this.activeOrders.indexOf(dishId);
        if (orderIndex !== -1) {
            this.completeOrder(orderIndex);
            return true;
        }
        return false;
    }

    /**
     * Marque une commande comme complétée
     */
    private completeOrder(orderIndex: number): void {
        if (orderIndex >= this.activeOrders.length) return;

        // Supprimer la commande de la liste
        this.activeOrders.splice(orderIndex, 1);

        // Effacer la boîte de recette
        const box = this.recipeBoxes[orderIndex];

        // Arrêter le timer de cette commande
        if (box.timerEvent) {
            box.timerEvent.destroy();
            box.timerEvent = undefined;
        }

        // Arrêter l'effet de pulsation
        if (box.isPulsating) {
            this.scene.tweens.killTweensOf(box.colorBar);
            box.colorBar.setAlpha(1);
            box.isPulsating = false;
        }

        box.orderId = null;
        box.dishIcon.setVisible(false);
        box.ingredientIcons.forEach((icon) => icon.setVisible(false));

        // Effet visuel de succès
        this.showOrderCompleteEffect(orderIndex);

        // Générer une nouvelle commande après un délai
        this.scene.time.delayedCall(CONFIG.NEW_ORDER_DELAY, () => {
            this.generateNewOrders();
        });
    }

    /**
     * Affiche un effet visuel quand une commande est complétée
     */
    private showOrderCompleteEffect(orderIndex: number): void {
        const box = this.recipeBoxes[orderIndex];
        const position = this.getBoxCenterPosition(box);

        this.createParticleEffect(position.x, position.y);
        this.createSuccessMessage(position.x, position.y - 20);
    }

    /**
     * Obtient la position centrale d'une boîte de commande
     */
    private getBoxCenterPosition(box: RecipeBox): { x: number; y: number } {
        return {
            x: box.container.x + CONFIG.DISH_ICON.x,
            y: box.container.y + CONFIG.DISH_ICON.y,
        };
    }

    /**
     * Crée un effet de particules
     */
    private createParticleEffect(x: number, y: number): void {
        try {
            const particles = this.scene.add.particles(x, y, "star", {
                speed: { min: -50, max: 50 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.3, end: 0 },
                lifespan: CONFIG.PARTICLE_LIFESPAN,
                quantity: 10,
                blendMode: "ADD",
            });

            this.scene.time.delayedCall(CONFIG.PARTICLE_LIFESPAN, () => {
                particles.destroy();
            });
        } catch (e) {
            console.log("Effet de particules non disponible");
        }
    }

    /**
     * Crée un message de succès
     */
    private createSuccessMessage(x: number, y: number): void {
        const message = this.scene.add.text(x, y, "✓ Commande terminée !", {
            fontFamily: "Arial",
            fontSize: "16px",
            color: CONFIG.COLORS.SUCCESS,
            stroke: "#ffffff",
            strokeThickness: 2,
        });

        message.setOrigin(0.5);
        message.setScrollFactor(0);
        message.setDepth(3000);

        this.scene.tweens.add({
            targets: message,
            y: y - 20,
            alpha: 0,
            duration: CONFIG.MESSAGE_DURATION,
            ease: "Cubic.easeOut",
            onComplete: () => message.destroy(),
        });
    }

    /**
     * Initialise le timer pour une commande
     */
    private startOrderTimer(boxIndex: number): void {
        const box = this.recipeBoxes[boxIndex];
        if (!box || !box.orderId) return;

        // Arrêter le timer existant s'il y en a un
        if (box.timerEvent) {
            box.timerEvent.destroy();
        }

        // Initialiser les valeurs du timer
        box.maxTime = this.orderDuration;
        box.timeRemaining = this.orderDuration;
        box.currentBarWidth = CONFIG.BAR_WIDTH;
        box.targetBarWidth = CONFIG.BAR_WIDTH;

        // Enregistrer le temps de début
        box.startTime = this.scene.time.now;

        // Créer un timer qui se déclenche toutes les 16ms (60 FPS) pour une animation ultra-fluide
        box.timerEvent = this.scene.time.addEvent({
            delay: CONFIG.ANIMATION_FPS,
            callback: () => this.updateOrderTimer(boxIndex),
            callbackScope: this,
            loop: true,
        });
    }

    /**
     * Met à jour le timer d'une commande
     */
    private updateOrderTimer(boxIndex: number): void {
        const box = this.recipeBoxes[boxIndex];
        if (!box || !box.orderId) return;

        // Calculer le temps écoulé depuis le début
        const elapsedTime = (this.scene.time.now - box.startTime) / 1000; // en secondes
        box.timeRemaining = Math.max(0, box.maxTime - elapsedTime);

        // Mettre à jour la barre de couleur de manière fluide
        this.updateColorBarSmooth(boxIndex);

        // Vérifier si le temps est écoulé
        if (box.timeRemaining <= 0) {
            this.expireOrder(boxIndex);
        }
    }

    /**
     * Interpole entre deux couleurs selon un pourcentage
     */
    private interpolateColor(
        color1: number,
        color2: number,
        factor: number
    ): number {
        const r1 = (color1 >> 16) & 0xff;
        const g1 = (color1 >> 8) & 0xff;
        const b1 = color1 & 0xff;

        const r2 = (color2 >> 16) & 0xff;
        const g2 = (color2 >> 8) & 0xff;
        const b2 = color2 & 0xff;

        const r = Math.round(r1 + (r2 - r1) * factor);
        const g = Math.round(g1 + (g2 - g1) * factor);
        const b = Math.round(b1 + (b2 - b1) * factor);

        return (r << 16) | (g << 8) | b;
    }

    /**
     * Met à jour la barre de couleur de manière ultra-fluide
     */
    private updateColorBarSmooth(boxIndex: number): void {
        const box = this.recipeBoxes[boxIndex];
        if (!box || !box.orderId) return;

        const progress = box.timeRemaining / box.maxTime;
        const targetWidth = CONFIG.BAR_WIDTH * progress;

        // Mettre à jour directement la largeur actuelle (pas d'animation tween)
        box.currentBarWidth = targetWidth;

        // Obtenir la couleur selon le pourcentage de progression
        const targetColor = this.getProgressColor(progress);

        // Redessiner la barre immédiatement (pas d'animation)
        this.updateColorBarAppearance(box, targetColor);

        // Gérer l'effet de pulsation
        this.handlePulsationEffect(box, progress);
    }

    /**
     * Met à jour la barre de couleur selon le temps restant (ancienne méthode - gardée pour compatibilité)
     */
    private updateColorBar(boxIndex: number): void {
        // Rediriger vers la nouvelle méthode fluide
        this.updateColorBarSmooth(boxIndex);
    }

    /**
     * Expire une commande (temps écoulé)
     */
    private expireOrder(boxIndex: number): void {
        const box = this.recipeBoxes[boxIndex];
        if (!box || !box.orderId) return;

        // Arrêter le timer
        if (box.timerEvent) {
            box.timerEvent.destroy();
            box.timerEvent = undefined;
        }

        // Arrêter l'effet de pulsation
        if (box.isPulsating) {
            this.scene.tweens.killTweensOf(box.colorBar);
            box.colorBar.setAlpha(1);
            box.isPulsating = false;
        }

        // Supprimer la commande de la liste active
        const orderIndex = this.activeOrders.indexOf(box.orderId);
        if (orderIndex !== -1) {
            this.activeOrders.splice(orderIndex, 1);
        }

        // Effacer la boîte de recette
        box.orderId = null;
        box.dishIcon.setVisible(false);
        box.ingredientIcons.forEach((icon) => icon.setVisible(false));

        // Effet visuel d'expiration
        this.showOrderExpiredEffect(boxIndex);

        // Générer une nouvelle commande après un délai
        this.scene.time.delayedCall(CONFIG.NEW_ORDER_DELAY, () => {
            this.generateNewOrders();
        });
    }

    /**
     * Affiche un effet visuel quand une commande expire
     */
    private showOrderExpiredEffect(boxIndex: number): void {
        const box = this.recipeBoxes[boxIndex];
        const position = this.getBoxCenterPosition(box);

        this.createErrorMessage(position.x, position.y - 20);
        this.createShakeEffect(box.container);
    }

    /**
     * Crée un message d'erreur
     */
    private createErrorMessage(x: number, y: number): void {
        const message = this.scene.add.text(x, y, "❌ Commande expirée !", {
            fontFamily: "Arial",
            fontSize: "16px",
            color: CONFIG.COLORS.ERROR,
            stroke: "#ffffff",
            strokeThickness: 2,
        });

        message.setOrigin(0.5);
        message.setScrollFactor(0);
        message.setDepth(3000);

        this.scene.tweens.add({
            targets: message,
            y: y - 20,
            alpha: 0,
            duration: CONFIG.MESSAGE_DURATION,
            ease: "Cubic.easeOut",
            onComplete: () => message.destroy(),
        });
    }

    /**
     * Crée un effet de secousse
     */
    private createShakeEffect(target: Phaser.GameObjects.Container): void {
        this.scene.tweens.add({
            targets: target,
            x: target.x - 5,
            duration: CONFIG.SHAKE_DURATION,
            yoyo: true,
            repeat: CONFIG.SHAKE_REPEAT,
            ease: "Cubic.easeInOut",
        });
    }

    /**
     * Arrête tous les timers des commandes
     */
    public stopAllTimers(): void {
        this.recipeBoxes.forEach((box) => {
            if (box.timerEvent) {
                box.timerEvent.destroy();
                box.timerEvent = undefined;
            }
        });
    }

    /**
     * Définit la durée des commandes
     */
    public setOrderDuration(duration: number): void {
        this.orderDuration = duration;
    }
}


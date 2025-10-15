import Phaser from "phaser";
import { IngredientInteractionManager } from "./IngredientInteractionManager";

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
        const recipeContainer = this.scene.add.container(20, 20);
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
        const boxWidth = 120;
        const boxHeight = 140;
        const spacing = 10;
        const x = index * (boxWidth + spacing);
        const y = 0;

        const boxContainer = this.scene.add.container(x, y);
        parent.add(boxContainer);

        // Fond de la boîte
        const background = this.scene.add.graphics();
        background.fillStyle(0xf0f0f0, 1);
        background.fillRoundedRect(0, 0, boxWidth, boxHeight, 8);
        background.lineStyle(2, 0x333333, 1);
        background.strokeRoundedRect(0, 0, boxWidth, boxHeight, 8);
        boxContainer.add(background);

        // Barre de couleur en haut
        const colorBar = this.scene.add.graphics();
        colorBar.fillStyle(0x4caf50, 1);
        colorBar.fillRoundedRect(2, 2, boxWidth - 4, 8, 4);
        boxContainer.add(colorBar);

        // Zone du plat fini
        const dishArea = this.scene.add.graphics();
        dishArea.fillStyle(0xffffff, 1);
        dishArea.fillRoundedRect(5, 15, boxWidth - 10, 60, 4);
        dishArea.lineStyle(1, 0xcccccc, 1);
        dishArea.strokeRoundedRect(5, 15, boxWidth - 10, 60, 4);
        boxContainer.add(dishArea);

        // Zone des ingrédients
        const ingredientArea = this.scene.add.graphics();
        ingredientArea.fillStyle(0xe3f2fd, 1);
        ingredientArea.fillRoundedRect(5, 80, boxWidth - 10, 55, 4);
        ingredientArea.lineStyle(1, 0xcccccc, 1);
        ingredientArea.strokeRoundedRect(5, 80, boxWidth - 10, 55, 4);
        boxContainer.add(ingredientArea);

        // Icône du plat fini
        const dishIcon = this.scene.add.image(boxWidth / 2, 45, "cookie");
        dishIcon.setScale(1.5);
        boxContainer.add(dishIcon);

        // Icônes des ingrédients
        const ingredientIcons: Phaser.GameObjects.Image[] = [];
        for (let i = 0; i < 3; i++) {
            const icon = this.scene.add.image(35 + i * 50, 110, "chocolate");
            icon.setScale(1.2);
            icon.setVisible(false);
            boxContainer.add(icon);
            ingredientIcons.push(icon);
        }

        const recipeBox: RecipeBox = {
            container: boxContainer,
            colorBar: colorBar,
            dishIcon: dishIcon,
            ingredientIcons: ingredientIcons,
            orderId: null,
            timerEvent: undefined,
            timeRemaining: 0,
            maxTime: 0,
            currentBarWidth: 116,
            targetBarWidth: 116,
        };

        this.recipeBoxes.push(recipeBox);
    }

    /**
     * Génère de nouvelles commandes
     */
    generateNewOrders(): void {
        const recipeManager = this.ingredientManager.getRecipeManager();
        const dishes = recipeManager.getDishes();

        // Nettoyer les commandes existantes
        this.activeOrders = [];
        this.recipeBoxes.forEach((box) => {
            // Arrêter le timer existant
            if (box.timerEvent) {
                box.timerEvent.destroy();
                box.timerEvent = undefined;
            }

            box.orderId = null;
            box.dishIcon.setVisible(false);
            box.ingredientIcons.forEach((icon) => icon.setVisible(false));
        });

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
        let color = 0x4caf50;
        switch (recipe.result) {
            case "cookie":
                color = 0xff9800;
                break;
            case "dough":
                color = 0x8bc34a;
                break;
            default:
                color = 0x4caf50;
        }
        box.colorBar.clear();
        box.colorBar.fillStyle(color, 1);
        box.colorBar.fillRoundedRect(2, 2, 116, 8, 4);

        // Icône du plat fini
        box.dishIcon.setTexture(recipe.result);
        box.dishIcon.setVisible(true);

        // Icônes des ingrédients
        const ingredients = [recipe.ingredient1, recipe.ingredient2];
        box.ingredientIcons.forEach((icon, index) => {
            if (index < ingredients.length) {
                icon.setTexture(ingredients[index]);
                icon.setVisible(true);
            } else {
                icon.setVisible(false);
            }
        });

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

        box.orderId = null;
        box.dishIcon.setVisible(false);
        box.ingredientIcons.forEach((icon) => icon.setVisible(false));

        // Effet visuel de succès
        this.showOrderCompleteEffect(orderIndex);

        // Générer une nouvelle commande après un délai
        this.scene.time.delayedCall(2000, () => {
            this.generateNewOrders();
        });
    }

    /**
     * Affiche un effet visuel quand une commande est complétée
     */
    private showOrderCompleteEffect(orderIndex: number): void {
        const box = this.recipeBoxes[orderIndex];
        const x = box.container.x + 60;
        const y = box.container.y + 70;

        // Effet de particules
        try {
            const particles = this.scene.add.particles(x, y, "star", {
                speed: { min: -50, max: 50 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.3, end: 0 },
                lifespan: 800,
                quantity: 10,
                blendMode: "ADD",
            });

            this.scene.time.delayedCall(800, () => {
                particles.destroy();
            });
        } catch (e) {
            console.log("Effet de particules non disponible");
        }

        // Message de succès
        const message = this.scene.add.text(
            x,
            y - 20,
            "✓ Commande terminée !",
            {
                fontFamily: "Arial",
                fontSize: "16px",
                color: "#4CAF50",
                stroke: "#ffffff",
                strokeThickness: 2,
            }
        );
        message.setOrigin(0.5);
        message.setScrollFactor(0);
        message.setDepth(3000);

        this.scene.tweens.add({
            targets: message,
            y: y - 40,
            alpha: 0,
            duration: 1500,
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
        box.currentBarWidth = 116;
        box.targetBarWidth = 116;

        // Créer un nouvel événement de timer
        box.timerEvent = this.scene.time.addEvent({
            delay: 1000, // 1 seconde
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

        box.timeRemaining--;

        // Mettre à jour la barre de couleur
        this.updateColorBar(boxIndex);

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
     * Met à jour la barre de couleur selon le temps restant
     */
    private updateColorBar(boxIndex: number): void {
        const box = this.recipeBoxes[boxIndex];
        if (!box || !box.orderId) return;

        const progress = box.timeRemaining / box.maxTime;
        const barWidth = 116; // Largeur maximale de la barre
        const targetWidth = barWidth * progress;

        // Mettre à jour la largeur cible
        box.targetBarWidth = targetWidth;

        // Couleurs de référence
        const green = 0x4caf50;
        const yellow = 0xffeb3b;
        const orange = 0xff9800;
        const red = 0xf44336;

        // Interpolation fluide des couleurs selon le pourcentage
        let targetColor: number;
        if (progress > 0.75) {
            // Transition verte vers jaune (100% à 75%)
            const localProgress = (progress - 0.75) / 0.25;
            targetColor = this.interpolateColor(
                green,
                yellow,
                1 - localProgress
            );
        } else if (progress > 0.5) {
            // Transition jaune vers orange (75% à 50%)
            const localProgress = (progress - 0.5) / 0.25;
            targetColor = this.interpolateColor(
                yellow,
                orange,
                1 - localProgress
            );
        } else if (progress > 0.25) {
            // Transition orange vers rouge (50% à 25%)
            const localProgress = (progress - 0.25) / 0.25;
            targetColor = this.interpolateColor(orange, red, 1 - localProgress);
        } else {
            // Rouge pour les 25% restants
            targetColor = red;
        }

        // Animation fluide de la largeur de la barre
        this.scene.tweens.add({
            targets: box,
            currentBarWidth: targetWidth,
            duration: 1000, // 1 seconde pour une transition fluide
            ease: "Cubic.easeOut",
            onUpdate: () => {
                // Redessiner la barre avec la largeur interpolée
                box.colorBar.clear();
                box.colorBar.fillStyle(targetColor, 1);
                box.colorBar.fillRoundedRect(2, 2, box.currentBarWidth, 8, 4);
            },
        });

        // Effet de pulsation quand il reste peu de temps
        if (progress <= 0.25) {
            // Arrêter les animations existantes pour éviter les conflits
            this.scene.tweens.killTweensOf(box.colorBar);

            this.scene.tweens.add({
                targets: box.colorBar,
                alpha: 0.5,
                duration: 500,
                yoyo: true,
                ease: "Cubic.easeInOut",
                repeat: -1, // Répéter indéfiniment
            });
        } else {
            // Arrêter l'effet de pulsation si on n'est plus en urgence
            this.scene.tweens.killTweensOf(box.colorBar);
            box.colorBar.setAlpha(1);
        }
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
        this.scene.time.delayedCall(2000, () => {
            this.generateNewOrders();
        });
    }

    /**
     * Affiche un effet visuel quand une commande expire
     */
    private showOrderExpiredEffect(boxIndex: number): void {
        const box = this.recipeBoxes[boxIndex];
        const x = box.container.x + 60;
        const y = box.container.y + 70;

        // Message d'expiration
        const message = this.scene.add.text(
            x,
            y - 20,
            "❌ Commande expirée !",
            {
                fontFamily: "Arial",
                fontSize: "16px",
                color: "#F44336",
                stroke: "#ffffff",
                strokeThickness: 2,
            }
        );
        message.setOrigin(0.5);
        message.setScrollFactor(0);
        message.setDepth(3000);

        this.scene.tweens.add({
            targets: message,
            y: y - 40,
            alpha: 0,
            duration: 1500,
            ease: "Cubic.easeOut",
            onComplete: () => message.destroy(),
        });

        // Effet de secousse pour la boîte
        this.scene.tweens.add({
            targets: box.container,
            x: box.container.x - 5,
            duration: 100,
            yoyo: true,
            repeat: 3,
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


import Phaser from "phaser";

export interface RecipeBoxData {
    container: Phaser.GameObjects.Container;
    colorBar: Phaser.GameObjects.Graphics;
    dishIcon: Phaser.GameObjects.Image;
    ingredientIcons: Phaser.GameObjects.Image[];
    orderId: string | null;
    recipeNumber?: Phaser.GameObjects.Text;
    timeRemaining: number;
    maxTime: number;
    currentBarWidth: number;
    startTime: number;
    isPulsating: boolean;
}

/**
 * Gestionnaire d'une boîte de recette individuelle
 */
export class RecipeBox {
    private scene: Phaser.Scene;
    private data: RecipeBoxData;
    private timerEvent?: Phaser.Time.TimerEvent;

    constructor(
        scene: Phaser.Scene,
        index: number,
        parentContainer: Phaser.GameObjects.Container
    ) {
        this.scene = scene;
        this.data = this.createBox(index, parentContainer);
    }

    /**
     * Crée tous les éléments visuels de la boîte
     */
    private createBox(
        index: number,
        parentContainer: Phaser.GameObjects.Container
    ): RecipeBoxData {
        const boxWidth = 120;
        const boxHeight = 140;
        const spacing = 10;
        const x = index * (boxWidth + spacing);
        const y = 0;

        const boxContainer = this.scene.add.container(x, y);
        parentContainer.add(boxContainer);

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
        const dishIcon = this.scene.add.image(boxWidth / 2, 45, "cookie-choco");
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

        // Numéro de recette
        const recipeNumber = this.scene.add.text(10, 10, `${index + 1}`, {
            fontFamily: "Arial",
            fontSize: "16px",
            color: "#2c3e50",
            stroke: "#ffffff",
            strokeThickness: 2,
        });
        recipeNumber.setScrollFactor(0);
        recipeNumber.setDepth(2001);
        boxContainer.add(recipeNumber);

        return {
            container: boxContainer,
            colorBar: colorBar,
            dishIcon: dishIcon,
            ingredientIcons: ingredientIcons,
            orderId: null,
            recipeNumber: recipeNumber,
            timeRemaining: 0,
            maxTime: 0,
            currentBarWidth: 116,
            startTime: 0,
            isPulsating: false,
        };
    }

    /**
     * Met à jour la boîte avec une recette
     */
    updateWithRecipe(recipe: any): void {
        console.log("RecipeBox: updateWithRecipe appelée avec:", recipe);
        this.data.orderId = recipe.result;

        // Couleur de la barre selon le type de plat
        const color = this.getRecipeColor(recipe.result);
        this.data.colorBar.clear();
        this.data.colorBar.fillStyle(color, 1);
        this.data.colorBar.fillRoundedRect(2, 2, 116, 8, 4);

        // Icône du plat fini
        this.data.dishIcon.setTexture(recipe.result);
        this.data.dishIcon.setVisible(true);

        // Icônes des ingrédients
        const ingredients = recipe.displayIngredients || [
            recipe.ingredient1,
            recipe.ingredient2,
        ];
        console.log("RecipeBox: ingrédients à afficher:", ingredients);
        this.data.ingredientIcons.forEach((icon, index) => {
            if (index < ingredients.length) {
                console.log(
                    `RecipeBox: affichage ingrédient ${index}: ${ingredients[index]}`
                );
                icon.setTexture(ingredients[index]);
                icon.setVisible(true);
            } else {
                icon.setVisible(false);
            }
        });

        // Afficher le numéro de recette
        if (this.data.recipeNumber) {
            this.data.recipeNumber.setVisible(true);
        }
    }

    /**
     * Obtient la couleur selon le type de recette
     */
    private getRecipeColor(result: string): number {
        switch (result) {
            case "cookie-mix-choco":
                return 0x8d6e63; // Marron pour chocolat
            case "cookie-mix-cara":
                return 0xff9800; // Orange pour caramel
            case "cookie-mix-choco-cara":
                return 0xff5722; // Rouge-orange pour combo
            case "cookie-choco":
                return 0x8d6e63; // Marron pour chocolat (cuit)
            case "cookie-cara":
                return 0xff9800; // Orange pour caramel (cuit)
            case "cookie-choco-cara":
                return 0xff5722; // Rouge-orange pour combo (cuit)
            case "cookie-dead":
                return 0x424242; // Gris pour brûlé
            default:
                return 0x4caf50; // Vert par défaut
        }
    }

    /**
     * Démarre le timer pour cette recette
     */
    startTimer(orderDuration: number): void {
        console.log(`RecipeBox: démarrage timer pour ${orderDuration}s`);
        // Arrêter le timer existant s'il y en a un
        if (this.timerEvent) {
            this.timerEvent.destroy();
        }

        // Initialiser les valeurs du timer
        this.data.maxTime = orderDuration;
        this.data.timeRemaining = orderDuration;
        this.data.currentBarWidth = 116;
        this.data.startTime = this.scene.time.now;

        // Créer un timer qui se déclenche toutes les 16ms (60 FPS)
        this.timerEvent = this.scene.time.addEvent({
            delay: 16,
            callback: () => this.updateTimer(),
            callbackScope: this,
            loop: true,
        });
        console.log("RecipeBox: timer créé et démarré");
    }

    /**
     * Met à jour le timer
     */
    private updateTimer(): void {
        if (!this.data.orderId) return;

        // Calculer le temps écoulé
        const elapsedTime = (this.scene.time.now - this.data.startTime) / 1000;
        this.data.timeRemaining = Math.max(0, this.data.maxTime - elapsedTime);

        // Mettre à jour la barre de couleur
        this.updateColorBar();

        // Vérifier si le temps est écoulé
        if (this.data.timeRemaining <= 0) {
            this.expire();
        }
    }

    /**
     * Met à jour la barre de couleur
     */
    private updateColorBar(): void {
        const progress = this.data.timeRemaining / this.data.maxTime;
        const targetWidth = 116 * progress;
        this.data.currentBarWidth = targetWidth;

        const targetColor = this.getProgressColor(progress);
        this.data.colorBar.clear();
        this.data.colorBar.fillStyle(targetColor, 1);
        this.data.colorBar.fillRoundedRect(
            2,
            2,
            this.data.currentBarWidth,
            8,
            4
        );

        // Gérer l'effet de pulsation
        this.handlePulsation(progress);
    }

    /**
     * Obtient la couleur de progression
     */
    private getProgressColor(progress: number): number {
        const green = 0x4caf50;
        const yellow = 0xffeb3b;
        const orange = 0xff9800;
        const red = 0xf44336;

        if (progress > 0.75) {
            const localProgress = (progress - 0.75) / 0.25;
            return this.interpolateColor(green, yellow, 1 - localProgress);
        } else if (progress > 0.5) {
            const localProgress = (progress - 0.5) / 0.25;
            return this.interpolateColor(yellow, orange, 1 - localProgress);
        } else if (progress > 0.25) {
            const localProgress = (progress - 0.25) / 0.25;
            return this.interpolateColor(orange, red, 1 - localProgress);
        } else {
            return red;
        }
    }

    /**
     * Interpole entre deux couleurs
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
     * Gère l'effet de pulsation
     */
    private handlePulsation(progress: number): void {
        const isUrgent = progress <= 0.25;

        if (isUrgent && !this.data.isPulsating) {
            this.startPulsation();
        } else if (!isUrgent && this.data.isPulsating) {
            this.stopPulsation();
        }
    }

    /**
     * Démarre l'effet de pulsation
     */
    private startPulsation(): void {
        this.data.isPulsating = true;
        this.scene.tweens.add({
            targets: this.data.colorBar,
            alpha: 0.5,
            duration: 500,
            yoyo: true,
            ease: "Cubic.easeInOut",
            repeat: -1,
        });
    }

    /**
     * Arrête l'effet de pulsation
     */
    private stopPulsation(): void {
        if (this.data.isPulsating) {
            this.scene.tweens.killTweensOf(this.data.colorBar);
            this.data.colorBar.setAlpha(1);
            this.data.isPulsating = false;
        }
    }

    /**
     * Expire la recette
     */
    private expire(): void {
        this.stopTimer();
        this.clear();
        this.onExpired?.();
    }

    /**
     * Nettoie la boîte
     */
    clear(): void {
        this.data.orderId = null;
        this.data.dishIcon.setVisible(false);
        this.data.ingredientIcons.forEach((icon) => icon.setVisible(false));
        if (this.data.recipeNumber) {
            this.data.recipeNumber.setVisible(false);
        }
    }

    /**
     * Arrête le timer
     */
    stopTimer(): void {
        if (this.timerEvent) {
            this.timerEvent.destroy();
            this.timerEvent = undefined;
        }
        this.stopPulsation();
    }

    /**
     * Détruit la boîte
     */
    destroy(): void {
        this.stopTimer();
        this.data.container.destroy();
    }

    /**
     * Anime la boîte vers une nouvelle position
     */
    animateToPosition(newX: number, newIndex: number): void {
        this.scene.tweens.add({
            targets: this.data.container,
            x: newX,
            duration: 400,
            ease: "Cubic.easeOut",
        });

        // Mettre à jour le numéro de recette
        if (this.data.recipeNumber) {
            this.data.recipeNumber.setText(`${newIndex + 1}`);
        }
    }

    /**
     * Anime la disparition de la boîte
     */
    animateDisappearance(onComplete: () => void): void {
        this.scene.tweens.add({
            targets: this.data.container,
            alpha: 0,
            scaleX: 0.8,
            scaleY: 0.8,
            duration: 300,
            ease: "Cubic.easeOut",
            onComplete,
        });
    }

    /**
     * Effet de secousse
     */
    shake(): void {
        this.scene.tweens.add({
            targets: this.data.container,
            x: this.data.container.x - 5,
            duration: 100,
            yoyo: true,
            repeat: 3,
            ease: "Cubic.easeInOut",
        });
    }

    /**
     * Getters
     */
    get orderId(): string | null {
        return this.data.orderId;
    }

    get container(): Phaser.GameObjects.Container {
        return this.data.container;
    }

    get isActive(): boolean {
        return this.data.orderId !== null;
    }

    /**
     * Callback pour l'expiration
     */
    onExpired?: () => void;
}


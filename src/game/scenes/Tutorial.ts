// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { EventBus } from "../EventBus";
import { GameConfig } from "../config/GameConfig";
/* END-USER-IMPORTS */

export default class Tutorial extends Phaser.Scene {
    private currentScreen: number = 0;
    private totalScreens: number = 0;
    private tutorialData: TutorialScreen[] = [];
    private screenContainer?: Phaser.GameObjects.Container;
    private nextButton?: Phaser.GameObjects.Container;
    private progressBar?: Phaser.GameObjects.Graphics;
    private music?: Phaser.Sound.BaseSound;

    constructor() {
        super("Tutorial");

        /* START-USER-CTR-CODE */
        // Write your code here.
        /* END-USER-CTR-CODE */
    }

    editorCreate(): void {
        this.events.emit("scene-awake");
    }

    /* START-USER-CODE */

    create() {
        this.editorCreate();

        // Fond de couleur
        this.cameras.main.setBackgroundColor(GameConfig.COLORS.BACKGROUND);

        // 🎵 Continuer la musique si elle n'est pas déjà en cours
        if (
            !this.sound.get("grandma-song") ||
            !this.sound.get("grandma-song")?.isPlaying
        ) {
            this.music = this.sound.add("grandma-song", {
                loop: true,
                volume: 0.3, // Volume plus bas pour le tutoriel
            });
            this.music.play();
        }

        // Initialiser les données du tutoriel
        this.initializeTutorialData();

        // Créer l'interface du tutoriel
        this.createTutorialInterface();

        // Afficher le premier écran
        this.showScreen(0);

        EventBus.emit("current-scene-ready", this);
    }

    /**
     * Initialise toutes les données des écrans du tutoriel
     */
    initializeTutorialData() {
        this.tutorialData = [
            {
                title: "Bienvenue dans le Tutoriel !",
                content:
                    "Apprenez à maîtriser l'art de la pâtisserie avec grand-mère !\n\nDans ce tutoriel, vous découvrirez :\n• Les ingrédients de base\n• Les techniques de préparation\n• La fabrication d'un cookie parfait",
                image: "full-game",
                showRecipe: null,
            },
            {
                title: "Barres de Vie et de Temps",
                content:
                    "Surveillez attentivement ces indicateurs :\n\n• ⏰ Barre de Temps - Chaque recette a un temps limite\n• ❤️ Barre de Vie - Vous perdez une vie si une commande expire\n• 🎯 Objectif - Terminez les commandes avant qu'elles n'expirent",
                image: "recipe-heart",
                showRecipe: null,
            },
            {
                title: "La Table de Préparation",
                content:
                    "C'est ici que la magie opère !\n\n• Glissez les ingrédients sur la table\n• Combinez-les pour créer de nouveaux éléments\n• Restez appuyé sur R2 et faites les combinaisons de touches pour les combiner",
                image: "craft-table",
                showRecipe: null,
            },
            {
                title: "La Casserole",
                content:
                    "Certains ingrédients ont besoin d'être cuits :\n\n• Sucre → Caramel (délicieux !)\n• Beurre → Beurre fondu (pour la pâte)\n\nPlacez l'ingrédient dans la casserole et attendez !",
                image: "pan",
                showRecipe: null,
            },
            {
                title: "Le Four",
                content:
                    "La dernière étape pour vos cookies !\n\n• Placez votre pâte dans le four\n• Attendez la cuisson\n• Récupérez votre cookie doré",
                image: "oven",
                showRecipe: null,
            },
            {
                title: "Tutoriel Pratique : Cookie de Base",
                content:
                    "Maintenant, créons ensemble un cookie !\n\nSuivez les étapes qui vont apparaître à l'écran...",
                image: "crafting-dough",
                showRecipe: "cookie-basic",
            },
        ];

        this.totalScreens = this.tutorialData.length;
    }

    /**
     * Crée l'interface utilisateur du tutoriel
     */
    createTutorialInterface() {
        // Conteneur principal pour tout l'écran
        this.screenContainer = this.add.container(512, 384);
        this.screenContainer.setDepth(10);

        // Créer les boutons de navigation
        this.createNavigationButtons();

        // Créer la barre de progression
        this.createProgressBar();
    }

    /**
     * Crée les boutons de navigation
     */
    createNavigationButtons() {
        // Bouton Suivant seulement
        this.nextButton = this.createNavButton(512, 650, "SUIVANT", () => {
            if (this.currentScreen < this.totalScreens - 1) {
                this.showScreen(this.currentScreen + 1);
            } else {
                this.startGame();
            }
        });
    }

    /**
     * Crée un bouton de navigation stylisé
     */
    createNavButton(
        x: number,
        y: number,
        text: string,
        callback: () => void
    ): Phaser.GameObjects.Container {
        const buttonContainer = this.add.container(x, y);
        buttonContainer.setDepth(20);

        // Fond du bouton
        const buttonBg = this.add.graphics();
        buttonBg.fillGradientStyle(0xffd700, 0xff8c00, 0xffd700, 0xff8c00, 1);
        buttonBg.fillRoundedRect(-80, -25, 160, 50, 25);
        buttonBg.lineStyle(4, 0x8b4513, 1);
        buttonBg.strokeRoundedRect(-80, -25, 160, 50, 25);

        buttonContainer.add(buttonBg);

        // Texte du bouton
        const buttonText = this.add.text(0, 0, text, {
            fontFamily: "Arial Black",
            fontSize: "20px",
            color: "#FFFFFF",
            stroke: "#8B4513",
            strokeThickness: 4,
        });
        buttonText.setOrigin(0.5, 0.5);
        buttonContainer.add(buttonText);

        // Rendre interactif
        buttonContainer.setSize(160, 50);
        buttonContainer.setInteractive({ useHandCursor: true });

        buttonContainer.on("pointerdown", () => {
            this.tweens.add({
                targets: buttonContainer,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 100,
                yoyo: true,
                repeat: 1,
                onComplete: callback,
            });
        });

        // Effet hover
        buttonContainer.on("pointerover", () => {
            this.tweens.add({
                targets: buttonContainer,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 200,
            });
        });

        buttonContainer.on("pointerout", () => {
            this.tweens.add({
                targets: buttonContainer,
                scaleX: 1,
                scaleY: 1,
                duration: 200,
            });
        });

        return buttonContainer;
    }

    /**
     * Crée la barre de progression
     */
    createProgressBar() {
        const progressContainer = this.add.container(512, 50);
        progressContainer.setDepth(20);

        // Fond de la barre
        const bgBar = this.add.graphics();
        bgBar.fillStyle(0x4a4a4a, 1);
        bgBar.fillRoundedRect(-200, -10, 400, 20, 10);
        bgBar.lineStyle(3, 0x8b4513, 1);
        bgBar.strokeRoundedRect(-200, -10, 400, 20, 10);
        progressContainer.add(bgBar);

        // Barre de progression
        this.progressBar = this.add.graphics();
        progressContainer.add(this.progressBar);

        // Texte de progression
        const progressText = this.add.text(0, 25, "1 / 6", {
            fontFamily: "Arial Black",
            fontSize: "18px",
            color: "#ffd700",
            stroke: "#8B4513",
            strokeThickness: 3,
        });
        progressText.setOrigin(0.5, 0.5);
        progressContainer.add(progressText);
    }

    /**
     * Affiche un écran spécifique du tutoriel
     */
    showScreen(screenIndex: number) {
        this.currentScreen = screenIndex;
        const screenData = this.tutorialData[screenIndex];

        // Nettoyer l'écran précédent - supprimer tous les éléments de fond et de recette
        const childrenToDestroy = [...this.children.list];
        childrenToDestroy.forEach((child) => {
            // Ne pas supprimer les boutons de navigation (depth 10, 20, 100)
            if (
                ((child as any).depth === 0 ||
                    (child as any).depth === 1 ||
                    (child as any).depth === 15) &&
                (child as any).depth !== 10 &&
                (child as any).depth !== 20 &&
                (child as any).depth !== 100
            ) {
                child.destroy();
            }
        });
        this.screenContainer?.removeAll(true);

        // Pour le slide 2 (barres), afficher l'image à gauche au milieu
        if (screenIndex === 1) {
            const background = this.add.image(200, 384, screenData.image);
            background.setDisplaySize(400, 300); // Plus petite
            background.setDepth(0);
        } else if (screenIndex === 2) {
            // Pour le slide 3 (table de préparation), afficher craft-table au-dessus et les deux autres côte à côte
            const craftTable = this.add.image(300, 250, "craft-table");
            craftTable.setDisplaySize(200, 150);
            craftTable.setDepth(0);

            const craftingChoco = this.add.image(150, 450, "crafting-choco");
            craftingChoco.setDisplaySize(180, 135);
            craftingChoco.setDepth(0);

            const craftingDough = this.add.image(450, 450, "crafting-dough");
            craftingDough.setDisplaySize(180, 135);
            craftingDough.setDepth(0);
        } else if (screenIndex === 3) {
            const pan = this.add.image(300, 250, "pan");
            pan.setDisplaySize(200, 150);
            pan.setDepth(0);

            const craftingButter = this.add.image(150, 450, "crafting-butter");
            craftingButter.setDisplaySize(180, 135);
            craftingButter.setDepth(0);

            const craftingSugar = this.add.image(450, 450, "crafting-sugar");
            craftingSugar.setDisplaySize(180, 135);
            craftingSugar.setDepth(0);
        } else if (screenIndex === 4) {
            const oven = this.add.image(300, 250, "oven");
            oven.setDisplaySize(200, 150);
            oven.setDepth(0);

            const craftingMix = this.add.image(300, 450, "crafting-mix");
            craftingMix.setDisplaySize(180, 135);
            craftingMix.setDepth(0);
        } else if (screenIndex === 5) {
            // Pour la dernière slide (tutoriel pratique), utiliser kitchen en background
            const background = this.add.image(512, 384, "kitchen");
            background.setDisplaySize(1024, 768);
            background.setDepth(0); // Au fond

            // Ajouter un overlay très léger pour améliorer la lisibilité du texte
            const overlay = this.add.graphics();
            overlay.fillStyle(0x000000, 0.1);
            overlay.fillRect(0, 0, 1024, 768);
            overlay.setDepth(1); // Au-dessus du fond
        } else {
            // Pour les autres slides, garder l'image en fond complet
            const background = this.add.image(512, 384, screenData.image);
            background.setDisplaySize(1024, 768);
            background.setDepth(0); // Au fond

            // Ajouter un overlay très léger pour améliorer la lisibilité du texte
            const overlay = this.add.graphics();
            overlay.fillStyle(0x000000, 0.1);
            overlay.fillRect(0, 0, 1024, 768);
            overlay.setDepth(1); // Au-dessus du fond
        }

        // Créer le panneau de contenu
        if (screenIndex === 5) {
            // Pour la dernière slide, centrer le texte au milieu de l'écran
            this.createCenteredContentPanel(screenData);
        } else {
            this.createContentPanel(screenData);
        }

        // Afficher la recette si nécessaire (sauf pour la dernière slide)
        if (screenData.showRecipe && screenIndex !== 5) {
            this.displayRecipe(screenData.showRecipe);
        }

        // Mettre à jour les boutons
        this.updateNavigationButtons();

        // Mettre à jour la barre de progression
        this.updateProgressBar();
    }

    /**
     * Crée le panneau de contenu centré pour la dernière slide
     */
    createCenteredContentPanel(screenData: TutorialScreen) {
        // Positionner le conteneur au centre de l'écran
        this.screenContainer?.setPosition(512, 384);

        // Créer d'abord le texte pour calculer sa hauteur
        const title = this.add.text(0, 0, screenData.title, {
            fontFamily: "Arial Black",
            fontSize: "36px",
            color: "#ffd700",
            stroke: "#8B4513",
            strokeThickness: 6,
            align: "center",
        });
        title.setOrigin(0.5, 0.5);

        const content = this.add.text(0, 0, screenData.content, {
            fontFamily: "Arial",
            fontSize: "22px",
            color: "#ffffff",
            stroke: "#8B4513",
            strokeThickness: 2,
            align: "center",
            wordWrap: { width: 800 },
        });
        content.setOrigin(0.5, 0.5);

        // Calculer la hauteur totale nécessaire
        const titleHeight = title.height;
        const contentHeight = content.height;
        const padding = 60; // Plus d'espacement pour le centre
        const margin = 20; // Écart entre le texte et le bord
        const totalHeight = titleHeight + contentHeight + padding + margin * 2;

        // Positionner le titre et le contenu
        title.setPosition(0, -contentHeight / 2 - padding / 2);
        content.setPosition(0, titleHeight / 2 + padding / 2);

        // Calculer la largeur nécessaire après le wordWrap
        const titleWidth = title.width;
        const contentWidth = content.width;
        const maxTextWidth = Math.max(titleWidth, contentWidth);
        const panelWidth = Math.min(900, maxTextWidth + 100); // 100px de marge totale (50px de chaque côté)

        // Créer le fond du panneau avec la hauteur et largeur calculées
        const panelBg = this.add.graphics();
        panelBg.fillGradientStyle(0x2a2a2a, 0x1a1a1a, 0x2a2a2a, 0x1a1a1a, 0.85);
        panelBg.fillRoundedRect(
            -panelWidth / 2,
            -totalHeight / 2,
            panelWidth,
            totalHeight,
            20
        );
        panelBg.lineStyle(4, 0xffd700, 1);
        panelBg.strokeRoundedRect(
            -panelWidth / 2,
            -totalHeight / 2,
            panelWidth,
            totalHeight,
            20
        );
        panelBg.setDepth(2); // Au-dessus de l'overlay
        this.screenContainer?.add(panelBg);

        // Ajouter les textes au conteneur
        title.setDepth(3); // Au-dessus du panneau
        content.setDepth(3); // Au-dessus du panneau
        this.screenContainer?.add(title);
        this.screenContainer?.add(content);
    }

    /**
     * Crée le panneau de contenu principal
     */
    createContentPanel(screenData: TutorialScreen) {
        // Positionner le conteneur encore plus à droite
        this.screenContainer?.setPosition(800, 384);

        // Créer d'abord le texte pour calculer sa hauteur
        const title = this.add.text(0, 0, screenData.title, {
            fontFamily: "Arial Black",
            fontSize: "28px",
            color: "#ffd700",
            stroke: "#8B4513",
            strokeThickness: 4,
            align: "center",
        });
        title.setOrigin(0.5, 0.5);

        const content = this.add.text(0, 0, screenData.content, {
            fontFamily: "Arial",
            fontSize: "18px",
            color: "#ffffff",
            stroke: "#8B4513",
            strokeThickness: 2,
            align: "center",
            wordWrap: { width: 400 },
        });
        content.setOrigin(0.5, 0.5);

        // Calculer la hauteur totale nécessaire
        const titleHeight = title.height;
        const contentHeight = content.height;
        const padding = 40; // Espacement autour du texte
        const margin = 15; // Écart entre le texte et le bord
        const totalHeight = titleHeight + contentHeight + padding + margin * 2;

        // Positionner le titre et le contenu
        title.setPosition(0, -contentHeight / 2 - padding / 2);
        content.setPosition(0, titleHeight / 2 + padding / 2);

        // Calculer la largeur nécessaire après le wordWrap
        const titleWidth = title.width;
        const contentWidth = content.width;
        const maxTextWidth = Math.max(titleWidth, contentWidth);
        const panelWidth = Math.min(450, maxTextWidth + 80); // 80px de marge totale (40px de chaque côté)

        // Créer le fond du panneau avec la hauteur et largeur calculées
        const panelBg = this.add.graphics();
        panelBg.fillGradientStyle(0x2a2a2a, 0x1a1a1a, 0x2a2a2a, 0x1a1a1a, 0.85);
        panelBg.fillRoundedRect(
            -panelWidth / 2,
            -totalHeight / 2,
            panelWidth,
            totalHeight,
            20
        );
        panelBg.lineStyle(4, 0xffd700, 1);
        panelBg.strokeRoundedRect(
            -panelWidth / 2,
            -totalHeight / 2,
            panelWidth,
            totalHeight,
            20
        );
        panelBg.setDepth(2); // Au-dessus de l'overlay
        this.screenContainer?.add(panelBg);

        // Ajouter les textes au conteneur
        title.setDepth(3); // Au-dessus du panneau
        content.setDepth(3); // Au-dessus du panneau
        this.screenContainer?.add(title);
        this.screenContainer?.add(content);
    }

    /**
     * Affiche la recette du cookie de base
     */
    displayRecipe(recipeType: string) {
        if (recipeType === "cookie-basic") {
            this.createCookieRecipeSteps();
        }
    }

    /**
     * Crée les étapes de la recette du cookie de base
     */
    createCookieRecipeSteps() {
        const stepsContainer = this.add.container(300, 300);
        stepsContainer.setDepth(15);

        const steps = [
            {
                step: 1,
                text: "1. Beurre dans casserole",
                ingredient: "butter",
                x: -200,
                y: -50,
            },
            {
                step: 2,
                text: "2. Attendez qu'il fonde",
                ingredient: "molten_butter",
                x: -70,
                y: -50,
            },
            {
                step: 3,
                text: "3. Mélangez + farine",
                ingredient: "dough",
                x: 70,
                y: -50,
            },
            {
                step: 4,
                text: "4. Dans le four",
                ingredient: "cookie-choco",
                x: 200,
                y: -50,
            },
        ];

        steps.forEach((step) => {
            // Texte de l'étape
            const stepText = this.add.text(step.x, step.y + 60, step.text, {
                fontFamily: "Arial",
                fontSize: "14px",
                color: "#ffffff",
                stroke: "#8B4513",
                strokeThickness: 2,
                align: "center",
                wordWrap: { width: 120 },
            });
            stepText.setOrigin(0.5, 0.5);
            stepsContainer.add(stepText);

            // Image de l'ingrédient
            const ingredientImg = this.add.image(
                step.x,
                step.y,
                step.ingredient
            );
            ingredientImg.setScale(1.5);
            stepsContainer.add(ingredientImg);

            // Flèche vers la droite (sauf pour la dernière étape)
            if (step.step < steps.length) {
                const arrow = this.add.text(step.x + 75, step.y, "→", {
                    fontFamily: "Arial Black",
                    fontSize: "32px",
                    color: "#ffd700",
                });
                arrow.setOrigin(0.5, 0.5);
                stepsContainer.add(arrow);
            }
        });

        this.screenContainer?.add(stepsContainer);
    }

    /**
     * Met à jour les boutons de navigation
     */
    updateNavigationButtons() {
        if (this.nextButton) {
            const nextText = this.nextButton.getAt(
                1
            ) as Phaser.GameObjects.Text;
            if (this.currentScreen === this.totalScreens - 1) {
                nextText.setText("COMMENCER");
            } else {
                nextText.setText("SUIVANT");
            }
        }
    }

    /**
     * Met à jour la barre de progression
     */
    updateProgressBar() {
        if (this.progressBar) {
            this.progressBar.clear();
            const progress = (this.currentScreen + 1) / this.totalScreens;
            const width = 380 * progress;

            this.progressBar.fillGradientStyle(
                0xffd700,
                0xff8c00,
                0xffd700,
                0xff8c00,
                1
            );
            this.progressBar.fillRoundedRect(-190, -8, width, 16, 8);
        }

        // Mettre à jour le texte de progression
        const progressContainer = this.children.list.find(
            (child) =>
                (child as any).list &&
                (child as any).list.some(
                    (item: any) => item.text && item.text.includes("/")
                )
        ) as Phaser.GameObjects.Container;

        if (progressContainer) {
            const progressText = progressContainer.list.find(
                (item: any) => item.text && item.text.includes("/")
            ) as Phaser.GameObjects.Text;

            if (progressText) {
                progressText.setText(
                    `${this.currentScreen + 1} / ${this.totalScreens}`
                );
            }
        }
    }

    /**
     * Lance le jeu principal
     */
    startGame() {
        this.scene.start("Game");
    }

    /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
export { Tutorial };

// Interface pour les données d'écran du tutoriel
interface TutorialScreen {
    title: string;
    content: string;
    image: string;
    showRecipe: string | null;
}


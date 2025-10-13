// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { EventBus } from "../EventBus";
/* END-USER-IMPORTS */

export default class MainMenu extends Phaser.Scene {
    constructor() {
        super("MainMenu");

        /* START-USER-CTR-CODE */
        // Write your code here.
        /* END-USER-CTR-CODE */
    }

    editorCreate(): void {
        // background - couvre tout l'écran
        const background = this.add.image(512, 384, "kitchen");
        background.setDisplaySize(1024, 768);
        background.setDepth(0); // Background au fond

        // Créer le titre stylisé comme le bouton
        this.createStyledTitle();

        this.events.emit("scene-awake");
    }

    /* START-USER-CODE */
    fallingCookies!: Phaser.GameObjects.Group;
    titleContainer!: Phaser.GameObjects.Container;

    // Write your code here
    create() {
        this.editorCreate();

        // Créer un groupe pour les cookies tombants
        this.fallingCookies = this.add.group();

        // Créer les cookies initiaux
        this.createFallingCookies(8);

        // Timer pour créer de nouveaux cookies régulièrement
        this.time.addEvent({
            delay: 300, // Nouveau cookie toutes les 0.5 secondes
            callback: this.createFallingCookies,
            callbackScope: this,
            args: [1],
            loop: true,
        });

        // Créer les boutons stylisés
        this.createPlayButton();
        this.createLeaderboardButton();
        this.createLeaderboardPreview();

        // Pas d'animation pour le moment comme demandé

        EventBus.emit("current-scene-ready", this);
    }

    createFallingCookies(count: number) {
        for (let i = 0; i < count; i++) {
            // Position aléatoire en haut de l'écran
            const x = Phaser.Math.Between(0, 1024);
            const y = Phaser.Math.Between(-100, -50);

            const cookie = this.add.image(x, y, "cookie");

            // Taille aléatoire pour varier l'effet
            const scale = Phaser.Math.FloatBetween(1.8, 3.0);
            cookie.setScale(scale);

            // Mettre les cookies derrière tous les autres éléments (sauf background)
            cookie.setDepth(1);

            // Rotation aléatoire
            cookie.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));

            // Ajouter au groupe
            this.fallingCookies.add(cookie);

            // Animer la chute avec rotation
            this.tweens.add({
                targets: cookie,
                y: 850, // Sortir de l'écran en bas
                rotation: cookie.rotation + Phaser.Math.FloatBetween(-3, 3),
                duration: Phaser.Math.Between(4000, 7000),
                ease: "Linear",
                onComplete: () => {
                    cookie.destroy(); // Détruire le cookie quand il sort de l'écran
                },
            });
        }
    }

    createPlayButton() {
        // Créer un conteneur pour le bouton
        const buttonContainer = this.add.container(512, 400);
        buttonContainer.setDepth(10); // Boutons au premier plan

        // Fond du bouton - forme de pilule avec dégradé
        const buttonBg = this.add.graphics();

        // Dessiner la forme de pilule (plus large)
        buttonBg.fillGradientStyle(0xffd700, 0xff8c00, 0xffd700, 0xff8c00, 1);
        buttonBg.fillRoundedRect(-140, -30, 280, 60, 30);

        // Bordure marron foncé
        buttonBg.lineStyle(6, 0x8b4513, 1);
        buttonBg.strokeRoundedRect(-140, -30, 280, 60, 30);

        buttonContainer.add(buttonBg);

        // Texte PLAY
        const playText = this.add.text(0, 0, "PLAY", {
            fontFamily: "Arial Black",
            fontSize: "36px",
            color: "#FFFFFF",
            stroke: "#8B4513",
            strokeThickness: 6,
        });
        playText.setOrigin(0.5, 0.5);
        buttonContainer.add(playText);

        // Rendre le bouton interactif
        buttonContainer.setSize(280, 60);
        buttonContainer.setInteractive({ useHandCursor: true });

        buttonContainer.on("pointerout", () => {
            buttonContainer.setScale(1);
        });

        // Action au clic avec effet
        buttonContainer.on("pointerdown", () => {
            // Animation de clic
            this.tweens.add({
                targets: buttonContainer,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 100,
                yoyo: true,
                repeat: 1,
                onComplete: () => {
                    this.changeScene();
                },
            });
        });

        // Animation de pulsation continue subtile
        this.tweens.add({
            targets: buttonContainer,
            scaleX: 1.02,
            scaleY: 1.02,
            duration: 2000,
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: -1,
        });
    }

    createStyledTitle() {
        // Créer un conteneur pour le titre
        this.titleContainer = this.add.container(512, 150);
        this.titleContainer.setDepth(10); // Titre au premier plan

        // Texte "BURNING" - blanc avec contour marron (plus grand)
        const burningText = this.add.text(0, -20, "BURNING", {
            fontFamily: "Arial Black",
            fontSize: "86px",
            color: "#ffffff",
            stroke: "#8b4513",
            strokeThickness: 12,
        });
        burningText.setOrigin(0.5, 0.5);

        // Ombre douce pour "BURNING"
        const burningShadow = this.add.text(3, -17, "BURNING", {
            fontFamily: "Arial Black",
            fontSize: "86px",
            color: "#e0e0e0",
        });
        burningShadow.setOrigin(0.5, 0.5);
        burningShadow.setAlpha(0.8);

        // Texte "MAMA" - dégradé jaune avec contour marron (plus petit)
        const mamaText = this.add.text(0, 30, "GRANDMAMA", {
            fontFamily: "Arial Black",
            fontSize: "78px",
            color: "#ffff00",
            stroke: "#8b4513",
            strokeThickness: 12,
        });
        mamaText.setOrigin(0.5, 0.5);

        // Ombre douce pour "MAMA"
        const mamaShadow = this.add.text(3, 33, "GRANDMAMA", {
            fontFamily: "Arial Black",
            fontSize: "78px",
            color: "#e0e0e0",
        });
        mamaShadow.setOrigin(0.5, 0.5);
        mamaShadow.setAlpha(0.8);

        // Texte "2" - jaune avec contour marron
        const twoText = this.add.text(0, 85, "2", {
            fontFamily: "Arial Black",
            fontSize: "102px",
            color: "#ffff00",
            stroke: "#8b4513",
            strokeThickness: 10,
        });
        twoText.setOrigin(0.5, 0.5);

        // Ombre douce pour "2"
        const twoShadow = this.add.text(3, 88, "2", {
            fontFamily: "Arial Black",
            fontSize: "102px",
            color: "#e0e0e0",
        });
        twoShadow.setOrigin(0.5, 0.5);
        twoShadow.setAlpha(0.8);

        // Ajouter les éléments au conteneur dans l'ordre (ombres en arrière-plan)
        this.titleContainer.add(burningShadow);
        this.titleContainer.add(mamaShadow);
        this.titleContainer.add(twoShadow);
        this.titleContainer.add(burningText);
        this.titleContainer.add(mamaText);
        this.titleContainer.add(twoText);
    }

    createLeaderboardButton() {
        // Créer un conteneur pour le bouton Leaderboard
        const buttonContainer = this.add.container(512, 490);
        buttonContainer.setDepth(10); // Boutons au premier plan

        // Fond du bouton - forme de pilule avec dégradé
        const buttonBg = this.add.graphics();

        // Dessiner la forme de pilule (plus large)
        buttonBg.fillGradientStyle(0xffd700, 0xff8c00, 0xffd700, 0xff8c00, 1);
        buttonBg.fillRoundedRect(-160, -30, 320, 60, 30);

        // Bordure marron foncé
        buttonBg.lineStyle(6, 0x8b4513, 1);
        buttonBg.strokeRoundedRect(-160, -30, 320, 60, 30);

        buttonContainer.add(buttonBg);

        // Texte LEADERBOARD
        const leaderboardText = this.add.text(0, 0, "LEADERBOARD", {
            fontFamily: "Arial Black",
            fontSize: "32px",
            color: "#FFFFFF",
            stroke: "#8b4513",
            strokeThickness: 6,
        });
        leaderboardText.setOrigin(0.5, 0.5);
        buttonContainer.add(leaderboardText);

        // Rendre le bouton interactif
        buttonContainer.setSize(320, 60);
        buttonContainer.setInteractive({ useHandCursor: true });

        buttonContainer.on("pointerout", () => {
            buttonContainer.setScale(1);
        });

        // Action au clic avec effet (ne fait rien pour le moment)
        buttonContainer.on("pointerdown", () => {
            // Animation de clic
            this.tweens.add({
                targets: buttonContainer,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 100,
                yoyo: true,
                repeat: 1,
                onComplete: () => {
                    // Ne fait rien pour le moment
                    console.log(
                        "Leaderboard clicked - à implémenter plus tard"
                    );
                },
            });
        });

        // Animation de pulsation continue subtile
        this.tweens.add({
            targets: buttonContainer,
            scaleX: 1.02,
            scaleY: 1.02,
            duration: 2000,
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: -1,
        });
    }

    createLeaderboardPreview() {
        // Créer un conteneur pour l'aperçu du leaderboard
        const previewContainer = this.add.container(150, 445);
        previewContainer.setDepth(10); // Leaderboard au premier plan

        // Fond de l'aperçu - forme de pilule
        const previewBg = this.add.graphics();
        previewBg.fillGradientStyle(0x4a4a4a, 0x2a2a2a, 0x4a4a4a, 0x2a2a2a, 1);
        previewBg.fillRoundedRect(-100, -120, 200, 240, 20);

        // Bordure dorée
        previewBg.lineStyle(4, 0xffd700, 1);
        previewBg.strokeRoundedRect(-100, -120, 200, 240, 20);

        previewContainer.add(previewBg);

        // Titre "TOP 3"
        const titleText = this.add.text(0, -90, "TOP 3", {
            fontFamily: "Arial Black",
            fontSize: "24px",
            color: "#ffd700",
            stroke: "#8b4513",
            strokeThickness: 4,
        });
        titleText.setOrigin(0.5, 0.5);
        previewContainer.add(titleText);

        // 1er place
        const firstPlace = this.add.text(0, -40, "1. CHEF_MAMA", {
            fontFamily: "Arial Black",
            fontSize: "16px",
            color: "#ffd700",
            stroke: "#8b4513",
            strokeThickness: 3,
        });
        firstPlace.setOrigin(0.5, 0.5);
        previewContainer.add(firstPlace);

        const firstScore = this.add.text(0, -20, "12,450 pts", {
            fontFamily: "Arial",
            fontSize: "14px",
            color: "#ffffff",
        });
        firstScore.setOrigin(0.5, 0.5);
        previewContainer.add(firstScore);

        // 2ème place
        const secondPlace = this.add.text(0, 10, "2. BURNING_COOK", {
            fontFamily: "Arial Black",
            fontSize: "16px",
            color: "#c0c0c0",
            stroke: "#8b4513",
            strokeThickness: 3,
        });
        secondPlace.setOrigin(0.5, 0.5);
        previewContainer.add(secondPlace);

        const secondScore = this.add.text(0, 30, "11,890 pts", {
            fontFamily: "Arial",
            fontSize: "14px",
            color: "#ffffff",
        });
        secondScore.setOrigin(0.5, 0.5);
        previewContainer.add(secondScore);

        // 3ème place
        const thirdPlace = this.add.text(0, 60, "3. HOT_KITCHEN", {
            fontFamily: "Arial Black",
            fontSize: "16px",
            color: "#cd7f32",
            stroke: "#8b4513",
            strokeThickness: 3,
        });
        thirdPlace.setOrigin(0.5, 0.5);
        previewContainer.add(thirdPlace);

        const thirdScore = this.add.text(0, 80, "10,720 pts", {
            fontFamily: "Arial",
            fontSize: "14px",
            color: "#ffffff",
        });
        thirdScore.setOrigin(0.5, 0.5);
        previewContainer.add(thirdScore);

        // Animation de pulsation subtile
        this.tweens.add({
            targets: previewContainer,
            scaleX: 1.02,
            scaleY: 1.02,
            duration: 3000,
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: -1,
        });
    }

    changeScene() {
        this.scene.start("Game");
    }
    /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
export { MainMenu };


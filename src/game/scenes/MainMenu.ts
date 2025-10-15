// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { EventBus } from "../EventBus";
import { LeaderboardService, ScoreEntry } from "../services/LeaderboardService";
/* END-USER-IMPORTS */

export default class MainMenu extends Phaser.Scene {
    private topScores: ScoreEntry[] = [];

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
    music?: Phaser.Sound.BaseSound;

    // Write your code here
    create() {
        this.editorCreate();

        // 🎵 Démarrer la musique de grand-mère
        if (!this.sound.get("grandma-song")) {
            this.music = this.sound.add("grandma-song", {
                loop: true,
                volume: 0.5, // Volume à 50%
            });
            this.music.play();
        }

        // Charger les données du leaderboard pour le top 3
        this.loadTop3Scores();

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
        this.createMusicButton();

        // Pas d'animation pour le moment comme demandé

        EventBus.emit("current-scene-ready", this);
    }

    createFallingCookies(count: number) {
        for (let i = 0; i < count; i++) {
            // Position aléatoire en haut de l'écran
            const x = Phaser.Math.Between(0, 1024);
            const y = Phaser.Math.Between(-100, -50);

            const cookie = this.add.image(x, y, "cookie-choco");

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
        const buttonContainer = this.add.container(512, 440);
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
        buttonContainer.setSize(320, 60);
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

        // Ligne 1: "HARDCORE BURNING" - blanc avec contour marron
        const line1Text = this.add.text(0, -70, "THE HARDCORE", {
            fontFamily: "Arial Black",
            fontSize: "80px",
            color: "#ffffff",
            stroke: "#8b4513",
            strokeThickness: 10,
        });
        line1Text.setOrigin(0.5, 0.5);

        // Ombre douce pour ligne 1
        const line1Shadow = this.add.text(3, -67, "THE HARDCORE", {
            fontFamily: "Arial Black",
            fontSize: "80px",
            color: "#e0e0e0",
        });
        line1Shadow.setOrigin(0.5, 0.5);
        line1Shadow.setAlpha(0.8);

        // Ligne 2: "BURNING GRANDMAMA" - divisé en deux parties
        // Partie 1: "BURNING GRAND" (statique) - décalé vers la gauche
        const line2Part1Text = this.add.text(-100, -10, "BURNING GRAND", {
            fontFamily: "Arial Black",
            fontSize: "70px",
            color: "#ffff00",
            stroke: "#8b4513",
            strokeThickness: 10,
        });
        line2Part1Text.setOrigin(0.5, 0.5);

        const line2Part1Shadow = this.add.text(-97, -7, "BURNING GRAND", {
            fontFamily: "Arial Black",
            fontSize: "70px",
            color: "#e0e0e0",
        });
        line2Part1Shadow.setOrigin(0.5, 0.5);
        line2Part1Shadow.setAlpha(0.8);

        // Calculer la position de "MAMA" pour qu'il soit juste après "GRAND"
        const line2Part1Width = line2Part1Text.width;
        const mamaXPosition = -100 + line2Part1Width / 2 + 5; // Petit espace de 5px

        // Partie 2: "MAMA" (qui tremble)
        const line2Part2Text = this.add.text(mamaXPosition, -10, "MAMA", {
            fontFamily: "Arial Black",
            fontSize: "70px",
            color: "#ffff00",
            stroke: "#8b4513",
            strokeThickness: 10,
        });
        line2Part2Text.setOrigin(0, 0.5);

        const line2Part2Shadow = this.add.text(mamaXPosition + 3, -7, "MAMA", {
            fontFamily: "Arial Black",
            fontSize: "70px",
            color: "#e0e0e0",
        });
        line2Part2Shadow.setOrigin(0, 0.5);
        line2Part2Shadow.setAlpha(0.8);

        // Ligne 3: "3D TURBO" - jaune foncé avec contour marron
        const line3Text = this.add.text(0, 37, "DELUXE 3D TURBO", {
            fontFamily: "BBH Sans Bartle",
            fontSize: "50px",
            color: "#ffa500",
            stroke: "#8b4513",
            strokeThickness: 10,
        });
        line3Text.setOrigin(0.5, 0.5);

        // Ombre douce pour ligne 3
        const line3Shadow = this.add.text(3, 37, "DELUXE 3D TURBO", {
            fontFamily: "BBH Sans Bartle",
            fontSize: "50px",
            color: "#e0e0e0",
        });
        line3Shadow.setOrigin(0.5, 0.5);
        line3Shadow.setAlpha(0.8);

        // Ligne 4: "4" seul et plus gros - rouge bordeaux avec contour marron
        const line4Text = this.add.text(0, 95, "EDITION 4", {
            fontFamily: "Arial Black",
            fontSize: "72px",
            color: "#ffff00",
            stroke: "#8b4513",
            strokeThickness: 12,
        });
        line4Text.setOrigin(0.5, 0.5);

        // Ombre douce pour ligne 4
        const line4Shadow = this.add.text(3, 98, "EDITION 4", {
            fontFamily: "Arial Black",
            fontSize: "72px",
            color: "#e0e0e0",
        });
        line4Shadow.setOrigin(0.5, 0.5);
        line4Shadow.setAlpha(0.8);

        // Ajouter les éléments au conteneur dans l'ordre (ombres en arrière-plan)
        this.titleContainer.add(line1Shadow);
        this.titleContainer.add(line2Part1Shadow);
        this.titleContainer.add(line2Part2Shadow);
        this.titleContainer.add(line3Shadow);
        this.titleContainer.add(line4Shadow);
        this.titleContainer.add(line1Text);
        this.titleContainer.add(line2Part1Text);
        this.titleContainer.add(line2Part2Text);
        this.titleContainer.add(line3Text);
        this.titleContainer.add(line4Text);

        // Animation de levier sur "THE HARDCORE" (rotation gauche-droite)
        this.tweens.add({
            targets: [line1Text, line1Shadow],
            rotation: 0.05, // Rotation de ~3 degrés
            duration: 1500,
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: -1,
        });

        // Animation de tremblement sur "MAMA"
        this.tweens.add({
            targets: [line2Part2Text, line2Part2Shadow],
            x: "+=4",
            y: "+=3",
            duration: 50,
            ease: "Linear",
            yoyo: true,
            repeat: -1,
        });

        // Animation de zoom/dézoom sur "DELUXE 3D TURBO"
        this.tweens.add({
            targets: [line3Text, line3Shadow],
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 1200,
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: -1,
        });

        // Animation de zoom/dézoom sur "EDITION 4" (en décalé)
        this.tweens.add({
            targets: [line4Text, line4Shadow],
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 1200,
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: -1,
            delay: 1200, // Décalage d'un cycle complet
        });
    }

    createLeaderboardButton() {
        // Créer un conteneur pour le bouton Leaderboard
        const buttonContainer = this.add.container(512, 530);
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

        // Action au clic avec effet - lance la scène Leaderboard
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
                    // Lancer la scène Leaderboard
                    this.scene.start("Leaderboard");
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

    /**
     * Charge les 3 meilleurs scores depuis l'API
     */
    async loadTop3Scores() {
        try {
            const result = await LeaderboardService.getTopScores(3);
            this.topScores =
                result.success && result.scores ? result.scores : [];
        } catch (error) {
            console.error("Erreur chargement leaderboard:", error);
            this.topScores = [];
        }
        this.createLeaderboardPreview();
    }

    createLeaderboardPreview() {
        const previewContainer = this.add.container(150, 485);
        previewContainer.setDepth(10);

        // Fond
        const previewBg = this.add.graphics();
        previewBg.fillGradientStyle(0x4a4a4a, 0x2a2a2a, 0x4a4a4a, 0x2a2a2a, 1);
        previewBg.fillRoundedRect(-130, -155, 260, 310, 20);
        previewBg.lineStyle(4, 0xffd700, 1);
        previewBg.strokeRoundedRect(-130, -155, 260, 310, 20);
        previewContainer.add(previewBg);

        // Titre
        const titleText = this.add.text(0, -115, "TOP 3", {
            fontFamily: "Arial Black",
            fontSize: "32px",
            color: "#ffd700",
            stroke: "#8b4513",
            strokeThickness: 4,
        });
        titleText.setOrigin(0.5, 0.5);
        previewContainer.add(titleText);

        this.displayTop3Scores(previewContainer);

        // Animation
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

    displayTop3Scores(container: Phaser.GameObjects.Container) {
        const positions = [
            { y: -50, color: "#ffd700" },
            { y: 18, color: "#c0c0c0" },
            { y: 86, color: "#cd7f32" },
        ];

        // Afficher seulement les vraies données, pas de données par défaut
        if (this.topScores.length === 0) {
            const noScoresText = this.add.text(
                0,
                0,
                "Aucun score pour le moment\nSoyez le premier !",
                {
                    fontFamily: "Arial",
                    fontSize: "18px",
                    color: "#ffffff",
                    stroke: "#8b4513",
                    strokeThickness: 2,
                    align: "center",
                }
            );
            noScoresText.setOrigin(0.5, 0.5);
            container.add(noScoresText);
            return;
        }

        for (let i = 0; i < Math.min(3, this.topScores.length); i++) {
            const pos = positions[i];
            const scoreData = this.topScores[i];
            const playerName = scoreData.playerName;

            const playerText = this.add.text(
                0,
                pos.y,
                `${i + 1}. ${playerName}`,
                {
                    fontFamily: "Arial Black",
                    fontSize: "20px",
                    color: pos.color,
                    stroke: "#8b4513",
                    strokeThickness: 3,
                }
            );
            playerText.setOrigin(0.5, 0.5);
            container.add(playerText);

            const scoreText = this.add.text(
                0,
                pos.y + 28,
                `${this.formatScore(scoreData.score)} pts`,
                {
                    fontFamily: "Arial",
                    fontSize: "18px",
                    color: "#ffffff",
                }
            );
            scoreText.setOrigin(0.5, 0.5);
            container.add(scoreText);
        }
    }

    formatScore(score: number | string): string {
        return typeof score === "string"
            ? score
            : score.toLocaleString("fr-FR");
    }

    createMusicButton() {
        // Créer un bouton pour contrôler la musique
        const buttonContainer = this.add.container(950, 50);
        buttonContainer.setDepth(100);

        // Fond circulaire
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0xffd700, 1);
        buttonBg.fillCircle(0, 0, 30);
        buttonBg.lineStyle(4, 0x8b4513, 1);
        buttonBg.strokeCircle(0, 0, 30);

        buttonContainer.add(buttonBg);

        // Icône musique (note musicale emoji)
        const musicIcon = this.add.text(0, 0, "🎵", {
            fontSize: "32px",
        });
        musicIcon.setOrigin(0.5, 0.5);
        buttonContainer.add(musicIcon);

        // Rendre le bouton interactif
        buttonContainer.setSize(60, 60);
        buttonContainer.setInteractive({ useHandCursor: true });

        let isMuted = false;

        buttonContainer.on("pointerdown", () => {
            isMuted = !isMuted;

            if (isMuted) {
                this.sound.setMute(true);
                musicIcon.setText("🔇");
            } else {
                this.sound.setMute(false);
                musicIcon.setText("🎵");
            }

            // Animation de clic
            this.tweens.add({
                targets: buttonContainer,
                scaleX: 0.9,
                scaleY: 0.9,
                duration: 100,
                yoyo: true,
            });
        });

        // Hover effect
        buttonContainer.on("pointerover", () => {
            this.tweens.add({
                targets: buttonContainer,
                scaleX: 1.1,
                scaleY: 1.1,
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
    }

    changeScene() {
        this.scene.start("Game"); // Lance la scène Game principale
    }
    /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
export { MainMenu };


import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { LeaderboardService, ScoreEntry } from "../services/LeaderboardService";

export default class Leaderboard extends Phaser.Scene {
    private leaderboardData: ScoreEntry[] = [];
    private leaderboardTexts: Phaser.GameObjects.Text[] = [];
    private loadingText?: Phaser.GameObjects.Text;
    private errorText?: Phaser.GameObjects.Text;

    constructor() {
        super("Leaderboard");
    }

    create() {
        // Fond de couleur
        this.cameras.main.setBackgroundColor(0x2a2a4a);

        // Image de fond
        const background = this.add.image(512, 384, "kitchen");
        background.setDisplaySize(1024, 768);
        background.setAlpha(0.3);

        // Titre principal
        this.createTitle();

        // Message de chargement
        this.loadingText = this.add.text(512, 400, "Chargement...", {
            fontFamily: "Arial Black",
            fontSize: "32px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4,
        });
        this.loadingText.setOrigin(0.5, 0.5);

        // Charger les données du leaderboard
        this.loadLeaderboard();

        // Bouton retour
        this.createBackButton();

        EventBus.emit("current-scene-ready", this);
    }

    createTitle() {
        // Titre "LEADERBOARD"
        const titleText = this.add.text(512, 80, "🏆 LEADERBOARD 🏆", {
            fontFamily: "Arial Black",
            fontSize: "64px",
            color: "#ffd700",
            stroke: "#8b4513",
            strokeThickness: 8,
        });
        titleText.setOrigin(0.5, 0.5);

        // Animation de pulsation
        this.tweens.add({
            targets: titleText,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 1500,
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: -1,
        });
    }

    async loadLeaderboard() {
        try {
            // Récupérer les données de l'API
            const result = await LeaderboardService.getTopScores(10);

            // Masquer le message de chargement
            if (this.loadingText) {
                this.loadingText.destroy();
            }

            if (result.success && result.scores) {
                this.leaderboardData = result.scores;
                // Afficher les données
                this.displayLeaderboard();
            } else {
                throw new Error(result.error || "Erreur inconnue");
            }
        } catch (error) {
            console.error("Erreur lors du chargement du leaderboard:", error);

            // Masquer le message de chargement
            if (this.loadingText) {
                this.loadingText.destroy();
            }

            // Afficher un message d'erreur
            this.errorText = this.add.text(
                512,
                400,
                "Impossible de charger le leaderboard\n\nVérifiez que le serveur est démarré",
                {
                    fontFamily: "Arial",
                    fontSize: "24px",
                    color: "#ff6b6b",
                    stroke: "#000000",
                    strokeThickness: 3,
                    align: "center",
                }
            );
            this.errorText.setOrigin(0.5, 0.5);
        }
    }

    displayLeaderboard() {
        if (this.leaderboardData.length === 0) {
            const emptyText = this.add.text(
                512,
                400,
                "Aucun score pour le moment\nSoyez le premier ! 🎯",
                {
                    fontFamily: "Arial",
                    fontSize: "32px",
                    color: "#ffffff",
                    stroke: "#000000",
                    strokeThickness: 4,
                    align: "center",
                }
            );
            emptyText.setOrigin(0.5, 0.5);
            return;
        }

        const startY = 180;
        const lineHeight = 55;

        this.leaderboardData.forEach((entry, index) => {
            const y = startY + index * lineHeight;

            // Conteneur pour chaque entrée
            const entryContainer = this.add.container(512, y);

            // Fond de l'entrée
            const bg = this.add.graphics();

            // Couleur spéciale pour le top 3
            let bgColor1 = 0x4a4a4a;
            let bgColor2 = 0x2a2a2a;
            let borderColor = 0x666666;

            if (index === 0) {
                // Or
                bgColor1 = 0xffd700;
                bgColor2 = 0xffaa00;
                borderColor = 0xffdd00;
            } else if (index === 1) {
                // Argent
                bgColor1 = 0xc0c0c0;
                bgColor2 = 0xa0a0a0;
                borderColor = 0xe0e0e0;
            } else if (index === 2) {
                // Bronze
                bgColor1 = 0xcd7f32;
                bgColor2 = 0xb8722c;
                borderColor = 0xe69c5c;
            }

            bg.fillGradientStyle(bgColor1, bgColor2, bgColor1, bgColor2, 1);
            bg.fillRoundedRect(-400, -22, 800, 44, 10);

            bg.lineStyle(3, borderColor, 1);
            bg.strokeRoundedRect(-400, -22, 800, 44, 10);

            entryContainer.add(bg);

            // Médailles pour le top 3
            let medal = "";
            if (index === 0) medal = "🥇";
            else if (index === 1) medal = "🥈";
            else if (index === 2) medal = "🥉";
            else medal = `${index + 1}.`;

            // Rang
            const rankText = this.add.text(-380, 0, medal, {
                fontFamily: "Arial Black",
                fontSize: "28px",
                color: index < 3 ? "#000000" : "#ffffff",
                stroke: index < 3 ? "#ffffff" : "#000000",
                strokeThickness: index < 3 ? 2 : 3,
            });
            rankText.setOrigin(0, 0.5);
            entryContainer.add(rankText);

            // Nom du joueur
            const nameText = this.add.text(-320, 0, entry.playerName, {
                fontFamily: "Arial Black",
                fontSize: "24px",
                color: index < 3 ? "#000000" : "#ffffff",
                stroke: index < 3 ? "#ffffff" : "#000000",
                strokeThickness: index < 3 ? 2 : 3,
            });
            nameText.setOrigin(0, 0.5);
            entryContainer.add(nameText);

            // Score
            const scoreText = this.add.text(
                380,
                0,
                `${entry.score.toLocaleString()} pts`,
                {
                    fontFamily: "Arial Black",
                    fontSize: "24px",
                    color: index < 3 ? "#000000" : "#ffffff",
                    stroke: index < 3 ? "#ffffff" : "#000000",
                    strokeThickness: index < 3 ? 2 : 3,
                }
            );
            scoreText.setOrigin(1, 0.5);
            entryContainer.add(scoreText);

            // Animation d'entrée
            entryContainer.setAlpha(0);
            entryContainer.setX(512 - 100);

            this.tweens.add({
                targets: entryContainer,
                x: 512,
                alpha: 1,
                duration: 500,
                delay: index * 100,
                ease: "Back.easeOut",
            });

            // Animation de hover pour les entrées du podium
            if (index < 3) {
                this.tweens.add({
                    targets: entryContainer,
                    scaleX: 1.02,
                    scaleY: 1.02,
                    duration: 1500,
                    ease: "Sine.easeInOut",
                    yoyo: true,
                    repeat: -1,
                    delay: index * 500,
                });
            }
        });
    }

    createBackButton() {
        // Créer un conteneur pour le bouton Retour
        const buttonContainer = this.add.container(512, 700);
        buttonContainer.setDepth(100);

        // Fond du bouton
        const buttonBg = this.add.graphics();
        buttonBg.fillGradientStyle(0x666666, 0x444444, 0x666666, 0x444444, 1);
        buttonBg.fillRoundedRect(-120, -30, 240, 60, 30);

        buttonBg.lineStyle(4, 0x888888, 1);
        buttonBg.strokeRoundedRect(-120, -30, 240, 60, 30);

        buttonContainer.add(buttonBg);

        // Texte du bouton
        const buttonText = this.add.text(0, 0, "← RETOUR", {
            fontFamily: "Arial Black",
            fontSize: "28px",
            color: "#FFFFFF",
            stroke: "#000000",
            strokeThickness: 4,
        });
        buttonText.setOrigin(0.5, 0.5);
        buttonContainer.add(buttonText);

        // Rendre le bouton interactif
        buttonContainer.setSize(240, 60);
        buttonContainer.setInteractive({ useHandCursor: true });

        buttonContainer.on("pointerover", () => {
            this.tweens.add({
                targets: buttonContainer,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 200,
                ease: "Back.easeOut",
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

        buttonContainer.on("pointerdown", () => {
            this.tweens.add({
                targets: buttonContainer,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    this.scene.start("MainMenu");
                },
            });
        });
    }

    shutdown() {
        // Nettoyer les textes
        this.leaderboardTexts.forEach((text) => text.destroy());
        this.leaderboardTexts = [];
    }
}


// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { EventBus } from "../EventBus";
import { LeaderboardService } from "../services/LeaderboardService";
/* END-USER-IMPORTS */

export default class GameOver extends Phaser.Scene {
    private score: number = 0;
    private deliveries: number = 0;
    private scoreSaved: boolean = false;
    private playerRank?: number;
    private reason: "time" | "expired" = "time";

    constructor() {
        super("GameOver");

        /* START-USER-CTR-CODE */
        // Write your code here.
        /* END-USER-CTR-CODE */
    }

    editorCreate(): void {
        // background - différent selon le type de fin de partie
        let backgroundKey = "beautiful-kitchen"; // Par défaut pour le temps écoulé
        if (this.reason === "expired") {
            backgroundKey = "game-over-kitchen"; // Pour un vrai game over
        }

        const background = this.add.image(512, 384, backgroundKey);
        background.setDisplaySize(1024, 768);
        background.alpha = 0.8;

        // textgameover - seulement si c'est un vrai game over
        if (this.reason === "expired") {
            const textgameover = this.add.text(512, 384, "", {});
            textgameover.setOrigin(0.5, 0.5);
            textgameover.text = "Game Over";
            textgameover.setStyle({
                align: "center",
                color: "#ffffff",
                fontFamily: "Arial Black",
                fontSize: "64px",
                stroke: "#000000",
                strokeThickness: 8,
            });
        }

        this.events.emit("scene-awake");
    }

    /* START-USER-CODE */

    // Write your code here

    init(data: {
        score: number;
        deliveries: number;
        reason?: "time" | "expired";
    }) {
        // Récupérer les données passées depuis la scène Game
        this.score = data.score || 0;
        this.deliveries = data.deliveries || 0;
        this.reason = data.reason || "time";
    }

    create() {
        this.editorCreate();

        this.cameras.main.setBackgroundColor(0x000000);

        // Effet de fondu d'entrée
        this.cameras.main.fadeIn(1000, 0, 0, 0);

        // Titre selon la raison de la défaite
        let titleMessage = "⏱️ Temps écoulé !";
        let titleColor = "#ffffff";

        if (this.reason === "expired") {
            titleMessage = "COMMANDE EXPIRÉE !";
            titleColor = "#FF4444"; // Rouge pour la défaite
        }

        const titleText = this.add.text(512, 150, titleMessage, {
            fontFamily: "Arial Black",
            fontSize: "48px",
            color: titleColor,
            stroke: "#000000",
            strokeThickness: 6,
            align: "center",
        });
        titleText.setOrigin(0.5);

        // Afficher le score final
        const scoreText = this.add.text(
            512,
            250,
            `Score final : ${this.score}`,
            {
                fontFamily: "Arial",
                fontSize: "36px",
                color: "#FFD700", // Or
                stroke: "#000000",
                strokeThickness: 4,
                align: "center",
            }
        );
        scoreText.setOrigin(0.5);

        // Afficher le nombre de livraisons
        const deliveriesText = this.add.text(
            512,
            320,
            `Livraisons réussies : ${this.deliveries}`,
            {
                fontFamily: "Arial",
                fontSize: "28px",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 3,
                align: "center",
            }
        );
        deliveriesText.setOrigin(0.5);

        // Afficher le formulaire de saisie du nom avec un délai
        this.time.delayedCall(1600, () => {
            this.showNameInputForm();
        });

        EventBus.emit("current-scene-ready", this);
    }

    /**
     * Affiche le formulaire de saisie du nom du joueur
     */
    showNameInputForm() {
        // Désactiver le clavier Phaser pour permettre la saisie dans l'input HTML
        if (this.input.keyboard) {
            this.input.keyboard.enabled = false;
        }

        // Créer un conteneur HTML pour l'input
        const formContainer = document.createElement("div");
        formContainer.id = "name-input-container";
        formContainer.style.position = "absolute";
        formContainer.style.top = "420px";
        formContainer.style.left = "50%";
        formContainer.style.transform = "translateX(-50%)";
        formContainer.style.textAlign = "center";
        formContainer.style.zIndex = "1000";

        // Label
        const label = document.createElement("div");
        label.textContent = "Entrez votre nom :";
        label.style.color = "#ffffff";
        label.style.fontFamily = "Arial";
        label.style.fontSize = "20px";
        label.style.marginBottom = "10px";
        label.style.textShadow = "2px 2px 4px #000000";
        formContainer.appendChild(label);

        // Input
        const input = document.createElement("input");
        input.type = "text";
        input.maxLength = 20;
        input.placeholder = "Votre nom";
        input.style.padding = "10px";
        input.style.fontSize = "18px";
        input.style.border = "2px solid #FFD700";
        input.style.borderRadius = "5px";
        input.style.marginRight = "10px";
        input.style.width = "200px";
        
        // Empêcher Phaser de capturer les événements du clavier sur cet input
        input.addEventListener("keydown", (e) => {
            e.stopPropagation();
        });
        input.addEventListener("keyup", (e) => {
            e.stopPropagation();
        });
        input.addEventListener("keypress", (e) => {
            e.stopPropagation();
        });
        
        formContainer.appendChild(input);

        // Bouton Sauvegarder
        const saveButton = document.createElement("button");
        saveButton.textContent = "💾 Sauvegarder";
        saveButton.style.padding = "10px 20px";
        saveButton.style.fontSize = "18px";
        saveButton.style.backgroundColor = "#4CAF50";
        saveButton.style.color = "white";
        saveButton.style.border = "none";
        saveButton.style.borderRadius = "5px";
        saveButton.style.cursor = "pointer";
        saveButton.style.marginRight = "10px";
        formContainer.appendChild(saveButton);

        // Bouton Passer
        const skipButton = document.createElement("button");
        skipButton.textContent = "Passer";
        skipButton.style.padding = "10px 20px";
        skipButton.style.fontSize = "18px";
        skipButton.style.backgroundColor = "#666666";
        skipButton.style.color = "white";
        skipButton.style.border = "none";
        skipButton.style.borderRadius = "5px";
        skipButton.style.cursor = "pointer";
        formContainer.appendChild(skipButton);

        // Message de statut
        const statusMessage = document.createElement("div");
        statusMessage.style.color = "#ffffff";
        statusMessage.style.fontFamily = "Arial";
        statusMessage.style.fontSize = "16px";
        statusMessage.style.marginTop = "10px";
        statusMessage.style.textShadow = "2px 2px 4px #000000";
        formContainer.appendChild(statusMessage);

        document.body.appendChild(formContainer);

        // Focus sur l'input
        input.focus();

        // Gérer la sauvegarde
        const handleSave = async () => {
            const playerName = input.value.trim();

            if (!playerName) {
                statusMessage.textContent = "⚠️ Veuillez entrer un nom";
                statusMessage.style.color = "#FF0000";
                return;
            }

            // Désactiver les boutons pendant la sauvegarde
            saveButton.disabled = true;
            skipButton.disabled = true;
            input.disabled = true;
            statusMessage.textContent = "💾 Sauvegarde en cours...";
            statusMessage.style.color = "#FFD700";

            // Sauvegarder le score
            const result = await LeaderboardService.saveScore(
                playerName,
                this.score,
                this.deliveries
            );

            if (result.success && result.rank) {
                this.scoreSaved = true;
                this.playerRank = result.rank;
                statusMessage.textContent = `✅ Score sauvegardé ! Vous êtes ${
                    result.rank
                }${this.getOrdinalSuffix(result.rank)} !`;
                statusMessage.style.color = "#00FF00";

                // Attendre 2 secondes puis passer au menu
                setTimeout(() => {
                    this.cleanupForm();
                    this.showReturnToMenuButton();
                }, 2000);
            } else {
                statusMessage.textContent = "❌ Erreur lors de la sauvegarde";
                statusMessage.style.color = "#FF0000";
                saveButton.disabled = false;
                skipButton.disabled = false;
                input.disabled = false;
            }
        };

        // Événements
        saveButton.addEventListener("click", handleSave);
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                handleSave();
            }
        });
        skipButton.addEventListener("click", () => {
            this.cleanupForm();
            this.showReturnToMenuButton();
        });
    }

    /**
     * Retourne le suffixe ordinal (er, ème)
     */
    getOrdinalSuffix(rank: number): string {
        if (rank === 1) return "er";
        return "ème";
    }

    /**
     * Nettoie le formulaire HTML
     */
    cleanupForm() {
        const formContainer = document.getElementById("name-input-container");
        if (formContainer) {
            formContainer.remove();
        }
        
        // Réactiver le clavier Phaser après la fermeture du formulaire
        if (this.input.keyboard) {
            this.input.keyboard.enabled = true;
        }
    }

    /**
     * Affiche le bouton pour retourner au menu
     */
    showReturnToMenuButton() {
        // Afficher le rang si le score a été sauvegardé
        if (this.scoreSaved && this.playerRank) {
            const rankText = this.add.text(
                512,
                520,
                `🏆 Vous êtes ${this.playerRank}${this.getOrdinalSuffix(
                    this.playerRank
                )} au classement !`,
                {
                    fontFamily: "Arial",
                    fontSize: "24px",
                    color: "#FFD700",
                    stroke: "#000000",
                    strokeThickness: 3,
                    align: "center",
                }
            );
            rankText.setOrigin(0.5);
        }

        // Instructions pour retourner au menu
        const instructionsText = this.add.text(
            512,
            600,
            "Appuyez sur ESPACE ou cliquez pour retourner au menu",
            {
                fontFamily: "Arial",
                fontSize: "20px",
                color: "#cccccc",
                stroke: "#000000",
                strokeThickness: 2,
                align: "center",
            }
        );
        instructionsText.setOrigin(0.5);

        // Animation de pulsation pour les instructions
        this.tweens.add({
            targets: instructionsText,
            alpha: 0.3,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });

        // Touche espace pour retourner au menu
        this.input.keyboard?.on("keydown-SPACE", () => {
            this.changeScene();
        });

        // Clic pour retourner au menu
        this.input.on("pointerdown", () => {
            this.changeScene();
        });
    }

    changeScene() {
        this.cleanupForm();
        this.scene.start("MainMenu");
    }

    /**
     * Nettoyage quand on quitte la scène
     */
    shutdown() {
        this.cleanupForm();
    }

    /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here


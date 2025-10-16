/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { GameConfig } from "../config/GameConfig";
import { EventBus } from "../EventBus";
import { AllRecipesDisplayManager } from "../managers/AllRecipesDisplayManager";
import { CasseroleManager } from "../managers/CasseroleManager";
import { CommunicationManager } from "../managers/CommunicationManager";
import { CounterInteractionManager } from "../managers/CounterInteractionManager";
import { CurrencyManager } from "../managers/CurrencyManager";
import { DeliveryManager } from "../managers/DeliveryManager";
import { InteractionSystem } from "../managers/InteractionSystem";
import { LivesManager } from "../managers/LivesManager";
import { OrderDisplayManager } from "../managers/OrderDisplayManager";
import { OvenManager } from "../managers/OvenManager";
import { PlayerManager } from "../managers/PlayerManager";
import { RecipeManager } from "../managers/RecipeManager";
import { ScoreManager } from "../managers/ScoreManager";
import { TimerManager } from "../managers/TimerManager";
import { TrashManager } from "../managers/TrashManager";
import { TutorialMapManager } from "../managers/TutorialMapManager";
import { UpgradeManager } from "../managers/UpgradeManager";
import { WaveManager } from "../managers/WaveManager";

export default class TutorialGame extends Phaser.Scene {
    private mapOffsetX: number = GameConfig.MAP_OFFSET_X;
    private mapOffsetY: number = GameConfig.MAP_OFFSET_Y;

    // Managers
    private player1: PlayerManager;
    private player2: PlayerManager;
    private playerList: PlayerManager[];

    private mapManager?: TutorialMapManager;
    private communicationManager?: CommunicationManager;

    private counterManager?: CounterInteractionManager;
    private orderDisplayManager?: OrderDisplayManager;

    private deliveryManager?: DeliveryManager;
    private scoreManager?: ScoreManager;

    private recipeManager?: RecipeManager;

    private interactionSystem?: InteractionSystem;

    private timerManager?: TimerManager;

    private ovenManager?: OvenManager;
    private casseroleManager?: CasseroleManager;
    private trashManager?: TrashManager;

    private waveManager?: WaveManager;
    private currencyManager?: CurrencyManager;
    private upgradeManager?: UpgradeManager;
    private livesManager?: LivesManager;
    private allRecipesDisplayManager?: AllRecipesDisplayManager;

    // Handler pour l'event listener (pour pouvoir le retirer)
    private spaceKeyHandler?: () => void;

    constructor() {
        super("TutorialGame");

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
            const music = this.sound.add("grandma-song", {
                loop: true,
                volume: 0.5,
            });
            music.play();
        }

        this.player1 = new PlayerManager(
            this,
            this.mapOffsetX,
            this.mapOffsetY,
            1
        );

        this.player2 = new PlayerManager(
            this,
            this.mapOffsetX,
            this.mapOffsetY,
            2
        );

        this.playerList = [this.player1, this.player2];

        // Initialiser le MapManager spécial pour le tutoriel
        this.mapManager = new TutorialMapManager(
            this,
            this.mapOffsetX,
            this.mapOffsetY
        );

        this.communicationManager = new CommunicationManager(
            this,
            this.mapManager,
            this.mapOffsetX,
            this.mapOffsetY
        );

        this.counterManager = new CounterInteractionManager(
            this,
            this.mapOffsetX,
            this.mapOffsetY
        );

        this.deliveryManager = new DeliveryManager(
            this,
            this.mapOffsetX,
            this.mapOffsetY
        );

        // Connecter le DeliveryManager au MapManager
        this.deliveryManager.setMapManager(this.mapManager);

        this.scoreManager = new ScoreManager(this);
        this.recipeManager = new RecipeManager();

        this.ovenManager = new OvenManager(
            this,
            this.mapOffsetX,
            this.mapOffsetY,
            this.recipeManager
        );

        this.casseroleManager = new CasseroleManager(
            this,
            this.mapOffsetX,
            this.mapOffsetY,
            this.recipeManager
        );

        this.trashManager = new TrashManager(
            this,
            this.mapOffsetX,
            this.mapOffsetY
        );

        // Passer le RecipeManager partagé au CounterInteractionManager
        this.counterManager.setRecipeManager(this.recipeManager);

        // Créer les tiles procéduralement
        this.mapManager.createIsometricTiles();

        // Créer la carte spéciale cookie-choco 8x8
        const isoMap = this.mapManager.createMap();

        // Connecter les managers de cuisine au MapManager
        this.mapManager.setCookingManagers(
            this.counterManager,
            this.ovenManager,
            this.casseroleManager,
            this.recipeManager
        );

        // Connecter les joueurs au MapManager pour le système de craft
        this.player1.setMapManager(this.mapManager);
        this.player2.setMapManager(this.mapManager);

        // Initialiser les comptoirs de communication
        this.communicationManager.initializeCommunicationCounters();

        // Créer les joueurs avec les points de spawn de la carte
        const spawnPoints = this.mapManager.getAllSpawnPoints();
        this.player1.createPlayer(spawnPoints.player1.x, spawnPoints.player1.y);
        this.player2.createPlayer(spawnPoints.player2.x, spawnPoints.player2.y);

        // Créer les murs invisibles autour de la carte
        const walls = this.mapManager.createMapBoundaries();

        // Activer les collisions entre les joueurs et les tiles solides
        if (this.playerList && isoMap) {
            const solidTiles = isoMap.getSolidTiles();
            if (solidTiles.length > 0) {
                for (const player of this.playerList) {
                    const playerSprite = player.getPlayer();
                    if (playerSprite) {
                        this.physics.add.collider(playerSprite, solidTiles);
                    }
                }
            }
        }

        // Activer la collision entre les joueurs et les murs
        if (this.playerList && walls) {
            for (const player of this.playerList) {
                const playerSprite = player.getPlayer();
                if (playerSprite) {
                    this.physics.add.collider(playerSprite, walls);
                }
            }
        }

        // Initialiser les systèmes d'affichage
        this.orderDisplayManager = new OrderDisplayManager(
            this,
            this.recipeManager
        );
        this.orderDisplayManager.initializeRecipeDisplay();
        this.scoreManager.initializeScoreDisplay();

        // Initialiser le système de monnaie et d'upgrades
        this.currencyManager = new CurrencyManager(this, 100);
        this.upgradeManager = new UpgradeManager();

        // Initialiser l'affichage de la monnaie
        this.currencyManager.initializeCoinDisplay(850, 20);

        // Initialiser le système de vies
        this.livesManager = new LivesManager(this);
        this.livesManager.initializeLivesDisplay(30, 200);

        // Initialiser l'affichage de toutes les recettes disponibles
        this.allRecipesDisplayManager = new AllRecipesDisplayManager(
            this,
            this.recipeManager
        );
        this.allRecipesDisplayManager.initializeAllRecipesDisplay(30, 250);

        // Pour le tutoriel, on désactive le système de vagues
        // et on configure une seule commande de cookie-choco
        this.setupTutorialMode();

        // Initialiser le timer AVANT InteractionSystem (mais ne pas le démarrer)
        this.timerManager = new TimerManager(this);
        this.timerManager.initializeTimerDisplay(
            GameConfig.TIMER.DISPLAY_X,
            GameConfig.TIMER.DISPLAY_Y
        );

        // Créer le système d'interaction orienté objet (APRÈS tous les managers)
        this.interactionSystem = new InteractionSystem(
            this,
            this.mapManager,
            this.counterManager,
            this.deliveryManager,
            this.recipeManager,
            this.orderDisplayManager,
            this.scoreManager,
            this.timerManager,
            this.ovenManager,
            this.casseroleManager,
            this.trashManager
        );

        // Touche espace pour retourner au menu
        this.spaceKeyHandler = () => {
            this.changeScene();
        };
        this.input.keyboard?.on("keydown-SPACE", this.spaceKeyHandler);

        EventBus.emit("current-scene-ready", this);

        // Démarrer le countdown de 3 secondes avant de commencer le jeu
        this.startCountdown();
    }

    /**
     * Affiche un countdown de 3 secondes avant de démarrer le jeu
     */
    private startCountdown(): void {
        // Créer un texte de countdown au centre de l'écran
        const countdownText = this.add.text(512, 384, "3", {
            fontFamily: "Arial Black",
            fontSize: "120px",
            color: "#FFD700",
            stroke: "#8B4513",
            strokeThickness: 12,
        });
        countdownText.setOrigin(0.5);
        countdownText.setDepth(10000);
        countdownText.setScrollFactor(0);

        let count = 3;

        // Timer pour le countdown
        const countdownTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                count--;
                if (count > 0) {
                    countdownText.setText(count.toString());
                    // Animation de pulsation
                    countdownText.setScale(1.5);
                    this.tweens.add({
                        targets: countdownText,
                        scaleX: 1,
                        scaleY: 1,
                        duration: 500,
                        ease: "Back.easeOut",
                    });
                } else if (count === 0) {
                    // Afficher "GO!" une seule fois
                    countdownText.setText("GO!");
                    countdownText.setScale(2);
                    this.tweens.add({
                        targets: countdownText,
                        scaleX: 0,
                        scaleY: 0,
                        alpha: 0,
                        duration: 800,
                        ease: "Back.easeIn",
                        onComplete: () => {
                            countdownText.destroy();
                        },
                    });

                    // DÉMARRER LE JEU !
                    this.startGame();
                }
            },
            repeat: 3,
        });
    }

    /**
     * Configure le mode tutoriel avec une seule commande
     */
    private setupTutorialMode(): void {
        // Créer une seule commande de cookie-choco
        if (this.orderDisplayManager && this.recipeManager) {
            // Créer la recette pour le cookie-choco
            const cookieChocoRecipe = {
                id: "tutorial_cookie_choco",
                ingredient1: "dough",
                ingredient2: "chocolate-chunks",
                result: "cookie-choco",
                name: "Cookie Chocolat",
                displayIngredients: ["dough", "chocolate-chunks"],
            };

            // Ajouter la commande avec une durée de 2 minutes (120 secondes)
            this.orderDisplayManager.addNewOrder(cookieChocoRecipe, 120);
        }

        // Configurer le callback de succès
        if (this.orderDisplayManager) {
            this.orderDisplayManager.setOrderCompletedCallback(
                (dishId: string) => {
                    if (dishId === "cookie-choco") {
                        // Succès ! Afficher un message et terminer le tutoriel
                        this.showTutorialSuccess();
                    }
                }
            );

            // Pas de callback d'expiration pour le tutoriel
            this.orderDisplayManager.setOrderExpiredCallback(() => {
                // Ne rien faire, on laisse le joueur continuer à apprendre
            });
        }
    }

    /**
     * Affiche le message de succès du tutoriel
     */
    private showTutorialSuccess(): void {
        // Arrêter le timer
        this.timerManager?.stop();

        // Afficher un message de félicitations
        const successText = this.add.text(
            512,
            300,
            "Félicitations !\nVous avez réussi à faire un cookie-choco !",
            {
                fontFamily: "Arial Black",
                fontSize: "32px",
                color: "#FFD700",
                stroke: "#8B4513",
                strokeThickness: 4,
                align: "center",
            }
        );
        successText.setOrigin(0.5);
        successText.setDepth(10000);
        successText.setScrollFactor(0);

        // Afficher un bouton pour continuer vers le jeu principal
        const continueText = this.add.text(
            512,
            400,
            "Appuyez sur ESPACE pour jouer au vrai jeu !",
            {
                fontFamily: "Arial",
                fontSize: "20px",
                color: "#FFFFFF",
                stroke: "#000000",
                strokeThickness: 2,
                align: "center",
            }
        );
        continueText.setOrigin(0.5);
        continueText.setDepth(10000);
        continueText.setScrollFactor(0);

        // Animation de pulsation
        this.tweens.add({
            targets: [successText, continueText],
            alpha: 0.7,
            duration: 1000,
            yoyo: true,
            repeat: -1,
        });

        // Écouter la touche espace pour continuer
        this.input.keyboard?.on("keydown-SPACE", () => {
            // Nettoyer proprement le tutoriel avant de passer au jeu principal
            this.cleanupTutorial();

            // Lancer le jeu principal
            this.scene.start("Game");
        });
    }

    /**
     * Nettoie proprement le tutoriel avant de passer au jeu principal
     */
    private cleanupTutorial(): void {
        // Arrêter tous les timers
        this.timerManager?.stop();
        this.orderDisplayManager?.stopAllTimers();

        // Nettoyer les managers
        if (this.ovenManager) {
            this.ovenManager.cleanup();
        }
        if (this.casseroleManager) {
            this.casseroleManager.cleanup();
        }
        if (this.counterManager) {
            this.counterManager.cleanup();
        }
        if (this.trashManager) {
            this.trashManager.cleanup();
        }
        if (this.livesManager) {
            this.livesManager.cleanup();
        }

        // Vider les inventaires des joueurs
        this.player1?.getInventory().clear();
        this.player2?.getInventory().clear();

        // Retirer tous les event listeners
        if (this.spaceKeyHandler) {
            this.input.keyboard?.off("keydown-SPACE", this.spaceKeyHandler);
            this.spaceKeyHandler = undefined;
        }

        // Retirer l'event listener de succès
        this.input.keyboard?.off("keydown-SPACE");
    }

    /**
     * Démarre réellement le jeu après le countdown
     */
    private startGame(): void {
        // Appliquer les upgrades au démarrage
        this.applyUpgrades();

        // Démarrer le timer du tutoriel (plus long pour apprendre)
        this.timerManager?.start(120000, () => {
            // 2 minutes pour le tutoriel
            // Callback quand le temps est écoulé
            this.endGame("time");
        });
    }

    update(time: number, delta: number) {
        // Mise à jour des joueurs
        this.player1.update();
        this.player2.update();

        // Gestion des interactions pour chaque joueur (optimisé)
        if (this.interactionSystem) {
            // Vérifier les inputs une seule fois
            const p1Interact = this.player1.isInteractionPressed();
            const p2Interact = this.player2.isInteractionPressed();
            const p1Transform = this.player1.isTransformPressed();
            const p2Transform = this.player2.isTransformPressed();

            // Traiter les interactions normales si nécessaire
            if (p1Interact || p2Interact) {
                if (p1Interact) {
                    this.interactionSystem.handlePlayerInteraction(
                        this.player1
                    );
                }
                if (p2Interact) {
                    this.interactionSystem.handlePlayerInteraction(
                        this.player2
                    );
                }
            }

            // Traiter les transformations si nécessaire
            if (p1Transform || p2Transform) {
                if (p1Transform) {
                    this.interactionSystem.handlePlayerTransformation(
                        this.player1
                    );
                }
                if (p2Transform) {
                    this.interactionSystem.handlePlayerTransformation(
                        this.player2
                    );
                }
            }
        }
    }

    /**
     * Change de scène (retour au menu)
     */
    changeScene() {
        this.endGame("time");
    }

    /**
     * Applique tous les effets des upgrades achetés
     */
    private applyUpgrades(): void {
        if (!this.upgradeManager) return;

        const effects = this.upgradeManager.getActiveEffects();

        // Vitesse de déplacement des joueurs
        if (this.player1) {
            this.player1.applySpeedMultiplier(effects.speedMultiplier);
        }
        if (this.player2) {
            this.player2.applySpeedMultiplier(effects.speedMultiplier);
        }

        // Vitesse de cuisson du four
        if (this.ovenManager) {
            this.ovenManager.applyCookingSpeedMultiplier(
                effects.ovenSpeedMultiplier
            );
        }

        // Vitesse de cuisson de la casserole
        if (this.casseroleManager) {
            this.casseroleManager.applyCookingSpeedMultiplier(
                effects.ovenSpeedMultiplier
            );
        }

        // Multiplicateur de score
        if (this.scoreManager) {
            this.scoreManager.applyScoreMultiplier(effects.scoreMultiplier);
        }

        // Bonus de temps par livraison
        if (this.timerManager) {
            this.timerManager.setBonusTimePerDelivery(
                effects.bonusTimePerDelivery
            );
        }

        // Temps supplémentaire au démarrage (appliqué une seule fois au début)
        if (
            effects.extraTime > 0 &&
            this.timerManager &&
            this.timerManager.isTimerRunning()
        ) {
            this.timerManager.addTime(effects.extraTime);
        }

        // Nombre maximum de commandes simultanées
        if (this.orderDisplayManager && effects.maxOrders !== 4) {
            this.orderDisplayManager.setMaxOrders(effects.maxOrders);
        }
    }

    /**
     * Termine la partie et passe à l'écran GameOver
     */
    endGame(reason: "time" | "expired" = "time") {
        // Arrêter le timer s'il est actif
        if (this.timerManager) {
            this.timerManager.stop();
        }

        // Arrêter les timers des commandes
        this.orderDisplayManager?.stopAllTimers();

        // Pour le tutoriel, on ne va pas à GameOver mais on affiche un message
        if (reason === "time") {
            // Afficher un message de temps écoulé
            const timeUpText = this.add.text(
                512,
                300,
                "Temps écoulé !\nAppuyez sur ESPACE pour continuer",
                {
                    fontFamily: "Arial Black",
                    fontSize: "28px",
                    color: "#FF6B6B",
                    stroke: "#8B4513",
                    strokeThickness: 4,
                    align: "center",
                }
            );
            timeUpText.setOrigin(0.5);
            timeUpText.setDepth(10000);
            timeUpText.setScrollFactor(0);

            // Animation de pulsation
            this.tweens.add({
                targets: timeUpText,
                alpha: 0.7,
                duration: 1000,
                yoyo: true,
                repeat: -1,
            });

            // Écouter la touche espace pour continuer
            this.input.keyboard?.on("keydown-SPACE", () => {
                this.cleanupTutorial();
                this.scene.start("Game");
            });
        } else {
            // Si c'est une autre raison, nettoyer et aller au menu
            this.cleanupTutorial();
            this.scene.start("MainMenu");
        }
    }

    /**
     * Nettoyage quand on quitte la scène
     */
    shutdown() {
        // Retirer l'event listener pour éviter les fuites mémoire
        if (this.spaceKeyHandler) {
            this.input.keyboard?.off("keydown-SPACE", this.spaceKeyHandler);
            this.spaceKeyHandler = undefined;
        }

        // RecipeManager n'a pas besoin de cleanup
        if (this.casseroleManager) {
            this.casseroleManager.cleanup();
        }
        if (this.ovenManager) {
            this.ovenManager.cleanup();
        }
        if (this.livesManager) {
            this.livesManager.cleanup();
        }
    }

    /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here


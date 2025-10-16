/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { GameConfig } from "../config/GameConfig";
import { EventBus } from "../EventBus";
import { CounterInteractionManager } from "../managers/CounterInteractionManager";
import { DeliveryManager } from "../managers/DeliveryManager";
import { RecipeManager } from "../managers/RecipeManager";
import { InteractionSystem } from "../managers/InteractionSystem";
import { MapManager } from "../managers/MapManager";
import { DynamicMapManager } from "../managers/DynamicMapManager";
import { CommunicationManager } from "../managers/CommunicationManager";
import { IsometricUtils } from "../utils/IsometricUtils";
import { OrderDisplayManager } from "../managers/OrderDisplayManager";
import { OvenManager } from "../managers/OvenManager";
import { CasseroleManager } from "../managers/CasseroleManager";
import { PlayerManager } from "../managers/PlayerManager";
import { ScoreManager } from "../managers/ScoreManager";
import { TimerManager } from "../managers/TimerManager";
import { WaveManager } from "../managers/WaveManager";
import { CurrencyManager } from "../managers/CurrencyManager";
import { UpgradeManager } from "../managers/UpgradeManager";

export default class Game extends Phaser.Scene {
    private mapOffsetX: number = GameConfig.MAP_OFFSET_X;
    private mapOffsetY: number = GameConfig.MAP_OFFSET_Y;

    // Managers
    private player1: PlayerManager;
    private player2: PlayerManager;
    private playerList: PlayerManager[];

    private mapManager?: DynamicMapManager;
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
    private waveManager?: WaveManager;
    private currencyManager?: CurrencyManager;
    private upgradeManager?: UpgradeManager;
    constructor() {
        super("Game");

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

        // Initialiser les managers
        this.mapManager = new DynamicMapManager(
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

        // Passer le RecipeManager partagé au CounterInteractionManager
        this.counterManager.setRecipeManager(this.recipeManager);

        // Créer les tiles procéduralement
        this.mapManager.createIsometricTiles();

        // Créer la carte en grille
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

        // Les tiles d'ingrédients sont maintenant initialisées automatiquement par la configuration

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

        // Initialiser le système de vagues
        this.waveManager = new WaveManager(
            this,
            this.orderDisplayManager,
            this.scoreManager,
            this.recipeManager
        );
        this.waveManager.initializeWaveDisplay();

        // Connecter le système de vagues avec OrderDisplayManager
        this.orderDisplayManager.setOrderCompletedCallback((dishId: string) => {
            this.waveManager?.completeRecipe(dishId);
        });

        // Connecter le callback d'expiration pour décrémenter le compteur de commandes actives
        this.orderDisplayManager.setOrderExpiredCallback(() => {
            this.waveManager?.expireOrder();
        });

        // Connecter le callback de Game Over par expiration de commande
        this.waveManager.setGameOverCallback(() => {
            this.endGame("expired");
        });

        // Connecter le callback de vague complétée pour ouvrir le shop
        this.waveManager.setWaveCompletedCallback(
            (waveNumber, timeSpent, recipeIds) => {
                this.openShop(waveNumber, timeSpent, recipeIds);
            }
        );

        // Initialiser le timer AVANT InteractionSystem (mais ne pas le démarrer)
        this.timerManager = new TimerManager(this);
        this.timerManager.initializeTimerDisplay(
            GameConfig.TIMER.DISPLAY_X,
            GameConfig.TIMER.DISPLAY_Y
        );

        // NE PAS démarrer immédiatement - attendre le countdown

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
            this.casseroleManager
        );

        // Touche espace pour retourner au menu
        this.input.keyboard?.on("keydown-SPACE", () => {
            this.changeScene();
        });

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
     * Démarre réellement le jeu après le countdown
     */
    private startGame(): void {
        // Appliquer les upgrades au démarrage
        this.applyUpgrades();

        // Pas besoin de régénérer la carte ici - elle a déjà été créée pour la vague 1 dans le constructeur de DynamicMapManager

        // Démarrer la première vague
        this.waveManager?.startWave(1);

        // Démarrer le timer du jeu
        this.timerManager?.start(GameConfig.TIMER.GAME_DURATION, () => {
            // Callback quand le temps est écoulé
            this.endGame();
        });
    }

    /**
     * Repositionne les joueurs selon les points de spawn de la carte actuelle
     */
    repositionPlayers(): void {
        const spawnPoints = this.mapManager?.getAllSpawnPoints();
        if (!spawnPoints) return;

        // Repositionner le joueur 1
        if (this.player1) {
            const player1Sprite = this.player1.getPlayer();
            if (player1Sprite) {
                const screenPos1 = IsometricUtils.gridToScreen(
                    spawnPoints.player1.x,
                    spawnPoints.player1.y
                );
                player1Sprite.setPosition(
                    screenPos1.x +
                        this.mapOffsetX +
                        IsometricUtils.TILE_WIDTH / 2,
                    screenPos1.y +
                        this.mapOffsetY +
                        IsometricUtils.TILE_HEIGHT / 2 -
                        12
                );
                // Mettre à jour la position en grille du joueur
                this.player1.setGridPosition(
                    spawnPoints.player1.x,
                    spawnPoints.player1.y
                );
            }
        }

        // Repositionner le joueur 2
        if (this.player2) {
            const player2Sprite = this.player2.getPlayer();
            if (player2Sprite) {
                const screenPos2 = IsometricUtils.gridToScreen(
                    spawnPoints.player2.x,
                    spawnPoints.player2.y
                );
                player2Sprite.setPosition(
                    screenPos2.x +
                        this.mapOffsetX +
                        IsometricUtils.TILE_WIDTH / 2,
                    screenPos2.y +
                        this.mapOffsetY +
                        IsometricUtils.TILE_HEIGHT / 2 -
                        12
                );
                // Mettre à jour la position en grille du joueur
                this.player2.setGridPosition(
                    spawnPoints.player2.x,
                    spawnPoints.player2.y
                );
            }
        }
    }

    /**
     * Réinitialise les collisions avec la nouvelle carte
     */
    private reinitializeCollisions(): void {
        const isoMap = this.mapManager?.getIsoMap();
        if (!isoMap || !this.playerList) return;

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

    /**
     * Met à jour le niveau de vague et génère une nouvelle carte
     */
    updateWaveLevel(waveLevel: number): void {
        if (this.mapManager) {
            // Nettoyer les fours et casseroles avant de régénérer la carte
            this.ovenManager?.cleanup();
            this.casseroleManager?.cleanup();

            this.mapManager.updateWaveLevel(waveLevel);

            // Recréer la carte avec la nouvelle configuration
            this.mapManager.createMap();

            // Réinitialiser les collisions avec les nouveaux tiles
            this.reinitializeCollisions();

            // Réinitialiser les comptoirs de communication
            this.communicationManager?.initializeCommunicationCounters();

            // Repositionner les joueurs
            this.repositionPlayers();
        }
    }

    /**
     * Met à jour le nombre d'actions disponibles
     */
    updateAvailableActions(actions: number): void {
        if (this.mapManager) {
            // Nettoyer les fours et casseroles avant de régénérer la carte
            this.ovenManager?.cleanup();
            this.casseroleManager?.cleanup();

            this.mapManager.updateAvailableActions(actions);

            // Recréer la carte avec la nouvelle configuration
            this.mapManager.createMap();

            // Reconnecter les managers de cuisine au MapManager après régénération
            this.mapManager.setCookingManagers(
                this.counterManager,
                this.ovenManager,
                this.casseroleManager,
                this.recipeManager
            );

            // Reconnecter les joueurs au MapManager après régénération
            this.player1.setMapManager(this.mapManager);
            this.player2.setMapManager(this.mapManager);

            // Réinitialiser les collisions avec les nouveaux tiles
            this.reinitializeCollisions();

            // Réinitialiser les comptoirs de communication
            this.communicationManager?.initializeCommunicationCounters();

            // Repositionner les joueurs
            this.repositionPlayers();
        }
    }

    /**
     * Gère l'interaction avec les comptoirs de communication
     */
    handleCommunicationInteraction(player: PlayerManager): void {
        if (!this.communicationManager) return;

        const counters = this.communicationManager.getCommunicationCounters();

        for (let i = 0; i < counters.length; i++) {
            if (
                this.communicationManager.isPlayerNearCommunicationCounter(
                    player,
                    i
                )
            ) {
                const availableIngredients =
                    this.communicationManager.getAvailableIngredients(i);

                if (availableIngredients.length > 0) {
                    // Prendre le premier ingrédient disponible
                    const ingredient = availableIngredients[0];
                    if (
                        this.communicationManager.takeIngredient(
                            player,
                            ingredient,
                            i
                        )
                    ) {
                    }
                } else {
                    // Déposer un ingrédient si le comptoir est vide
                    const inventory = player.getInventory();
                    const ingredients = inventory.getAllIngredients();

                    if (ingredients.length > 0) {
                        const ingredient = ingredients[0];
                        if (
                            this.communicationManager.depositIngredient(
                                player,
                                ingredient,
                                i
                            )
                        ) {
                        }
                    }
                }
                break;
            }
        }
    }

    update(time: number, delta: number) {
        // Mise à jour des joueurs
        this.player1.update();
        this.player2.update();

        // Gestion des interactions pour chaque joueur
        if (this.interactionSystem) {
            // Touche d'interaction normale (E/O) : prendre/poser/combiner
            if (this.player1.isInteractionPressed()) {
                this.interactionSystem.handlePlayerInteraction(this.player1);
            }

            if (this.player2.isInteractionPressed()) {
                this.interactionSystem.handlePlayerInteraction(this.player2);
            }

            // Touche de transformation (R/P) : transformer sur table de transformation
            if (this.player1.isTransformPressed()) {
                this.interactionSystem.handlePlayerTransformation(this.player1);
            }

            if (this.player2.isTransformPressed()) {
                this.interactionSystem.handlePlayerTransformation(this.player2);
            }
        }
    }

    /**
     * Change de scène (retour au menu)
     */
    changeScene() {
        this.endGame();
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
     * Ouvre le shop entre les vagues
     */
    private openShop(
        waveNumber: number,
        timeSpent: number,
        recipeIds: string[]
    ): void {
        if (!this.currencyManager || !this.upgradeManager || !this.waveManager)
            return;

        // Calculer les gains de la vague
        const waveConfig = this.waveManager.getCurrentWaveConfig();
        if (!waveConfig) return;

        const earnings = this.currencyManager.calculateWaveEarnings(
            recipeIds.length,
            timeSpent,
            waveConfig.targetRecipes * waveConfig.orderDuration,
            recipeIds,
            waveConfig.difficulty
        );

        // Ajouter les coins gagnés
        this.currencyManager.addCoins(earnings.total);

        // Mettre le jeu en pause
        this.scene.pause();

        // Ouvrir la scène Shop en overlay
        this.scene.launch("Shop", {
            currencyManager: this.currencyManager,
            upgradeManager: this.upgradeManager,
            coinsEarned: earnings.total,
            waveNumber: waveNumber,
            onClose: () => {
                // Reprendre le jeu
                this.scene.resume();

                // Appliquer les upgrades achetés
                this.applyUpgrades();

                // Mettre à jour la carte pour la nouvelle vague
                const nextWaveNumber =
                    this.waveManager?.getNextWaveNumber() || 1;
                this.updateWaveLevel(nextWaveNumber);

                // Démarrer la vague suivante
                this.waveManager?.startNextWave();
            },
        });
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

        // Passer le score à la scène GameOver
        const finalScore = this.scoreManager?.getScore() || 0;
        const totalDeliveries = this.scoreManager?.getTotalDeliveries() || 0;

        this.scene.start("GameOver", {
            score: finalScore,
            deliveries: totalDeliveries,
            reason: reason,
        });
    }

    /**
     * Nettoyage quand on quitte la scène
     */
    shutdown() {
        // RecipeManager n'a pas besoin de cleanup
        if (this.casseroleManager) {
            this.casseroleManager.cleanup();
        }
        if (this.ovenManager) {
            this.ovenManager.cleanup();
        }
    }

    /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here

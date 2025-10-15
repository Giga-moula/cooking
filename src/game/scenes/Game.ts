/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { GameConfig } from "../config/GameConfig";
import { EventBus } from "../EventBus";
import { CounterInteractionManager } from "../managers/CounterInteractionManager";
import { DeliveryManager } from "../managers/DeliveryManager";
import { IngredientInteractionManager } from "../managers/IngredientInteractionManager";
import { InteractionSystem } from "../managers/InteractionSystem";
import { MapManager } from "../managers/MapManager";
import { DynamicMapManager } from "../managers/DynamicMapManager";
import { CommunicationManager } from "../managers/CommunicationManager";
import { IsometricUtils } from "../utils/IsometricUtils";
import { OrderDisplayManager } from "../managers/OrderDisplayManager";
import { OvenManager } from "../managers/OvenManager";
import { PlayerManager } from "../managers/PlayerManager";
import { ScoreManager } from "../managers/ScoreManager";
import { TimerManager } from "../managers/TimerManager";
import { WaveManager } from "../managers/WaveManager";

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

    private ingredientManager?: IngredientInteractionManager;

    private interactionSystem?: InteractionSystem;

    private timerManager?: TimerManager;

    private ovenManager?: OvenManager;
    private waveManager?: WaveManager;
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
        this.ingredientManager = new IngredientInteractionManager();

        this.ovenManager = new OvenManager(
            this,
            this.mapOffsetX,
            this.mapOffsetY,
            this.ingredientManager.getRecipeManager()
        );

        // Passer le RecipeManager partagé au CounterInteractionManager
        this.counterManager.setRecipeManager(
            this.ingredientManager.getRecipeManager()
        );

        // Créer les tiles procéduralement
        this.mapManager.createIsometricTiles();

        // Créer la carte en grille
        const isoMap = this.mapManager.createMap();
        
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
            this.ingredientManager
        );
        this.orderDisplayManager.initializeRecipeDisplay();

        this.deliveryManager.initializeDeliveryZone();
        this.scoreManager.initializeScoreDisplay();

        // Initialiser le système de vagues
        this.waveManager = new WaveManager(
            this,
            this.orderDisplayManager,
            this.scoreManager,
            this.ingredientManager.getRecipeManager()
        );
        this.waveManager.initializeWaveDisplay();

        // Connecter le système de vagues avec OrderDisplayManager
        this.orderDisplayManager.setOrderCompletedCallback(() => {
            this.waveManager?.completeRecipe();
        });

        // Démarrer la première vague
        this.waveManager.startWave(1);

        // Initialiser le timer AVANT InteractionSystem
        this.timerManager = new TimerManager(this);
        this.timerManager.initializeTimerDisplay(
            GameConfig.TIMER.DISPLAY_X,
            GameConfig.TIMER.DISPLAY_Y
        );
        this.timerManager.start(GameConfig.TIMER.GAME_DURATION, () => {
            // Callback quand le temps est écoulé
            this.endGame();
        });

        // Créer le système d'interaction orienté objet (APRÈS tous les managers)
        this.interactionSystem = new InteractionSystem(
            this,
            this.mapManager,
            this.counterManager,
            this.deliveryManager,
            this.ingredientManager,
            this.orderDisplayManager,
            this.scoreManager,
            this.timerManager,
            this.ovenManager
        );

        // Touche espace pour retourner au menu
        this.input.keyboard?.on("keydown-SPACE", () => {
            this.changeScene();
        });

        EventBus.emit("current-scene-ready", this);
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
                const screenPos1 = IsometricUtils.gridToScreen(spawnPoints.player1.x, spawnPoints.player1.y);
                player1Sprite.setPosition(
                    screenPos1.x + this.mapOffsetX + IsometricUtils.TILE_WIDTH / 2,
                    screenPos1.y + this.mapOffsetY + IsometricUtils.TILE_HEIGHT / 2 - 12
                );
                // Mettre à jour la position en grille du joueur
                this.player1.setGridPosition(spawnPoints.player1.x, spawnPoints.player1.y);
            }
        }
        
        // Repositionner le joueur 2
        if (this.player2) {
            const player2Sprite = this.player2.getPlayer();
            if (player2Sprite) {
                const screenPos2 = IsometricUtils.gridToScreen(spawnPoints.player2.x, spawnPoints.player2.y);
                player2Sprite.setPosition(
                    screenPos2.x + this.mapOffsetX + IsometricUtils.TILE_WIDTH / 2,
                    screenPos2.y + this.mapOffsetY + IsometricUtils.TILE_HEIGHT / 2 - 12
                );
                // Mettre à jour la position en grille du joueur
                this.player2.setGridPosition(spawnPoints.player2.x, spawnPoints.player2.y);
            }
        }
    }

    /**
     * Met à jour le niveau de vague et génère une nouvelle carte
     */
    updateWaveLevel(waveLevel: number): void {
        if (this.mapManager) {
            this.mapManager.updateWaveLevel(waveLevel);
            
            // Recréer la carte avec la nouvelle configuration
            this.mapManager.createMap();
            
            // Réinitialiser les comptoirs de communication
            this.communicationManager?.initializeCommunicationCounters();
            
            // Repositionner les joueurs
            this.repositionPlayers();
            
            console.log(`🌊 Vague ${waveLevel} - Nouvelle carte générée`);
        }
    }

    /**
     * Met à jour le nombre d'actions disponibles
     */
    updateAvailableActions(actions: number): void {
        if (this.mapManager) {
            this.mapManager.updateAvailableActions(actions);
            
            // Recréer la carte avec la nouvelle configuration
            this.mapManager.createMap();
            
            // Réinitialiser les comptoirs de communication
            this.communicationManager?.initializeCommunicationCounters();
            
            // Repositionner les joueurs
            this.repositionPlayers();
            
            console.log(`⚡ Actions disponibles: ${actions} - Nouvelle carte générée`);
        }
    }

    /**
     * Gère l'interaction avec les comptoirs de communication
     */
    handleCommunicationInteraction(player: PlayerManager): void {
        if (!this.communicationManager) return;
        
        const counters = this.communicationManager.getCommunicationCounters();
        
        for (let i = 0; i < counters.length; i++) {
            if (this.communicationManager.isPlayerNearCommunicationCounter(player, i)) {
                const availableIngredients = this.communicationManager.getAvailableIngredients(i);
                
                if (availableIngredients.length > 0) {
                    // Prendre le premier ingrédient disponible
                    const ingredient = availableIngredients[0];
                    if (this.communicationManager.takeIngredient(player, ingredient, i)) {
                        console.log(`📥 ${player.getPlayerNumber()} a récupéré ${ingredient} du comptoir de communication`);
                    }
                } else {
                    // Déposer un ingrédient si le comptoir est vide
                    const inventory = player.getInventory();
                    const ingredients = inventory.getAllIngredients();
                    
                    if (ingredients.length > 0) {
                        const ingredient = ingredients[0];
                        if (this.communicationManager.depositIngredient(player, ingredient, i)) {
                            console.log(`📤 ${player.getPlayerNumber()} a déposé ${ingredient} sur le comptoir de communication`);
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
     * Termine la partie et passe à l'écran GameOver
     */
    endGame() {
        // Arrêter le timer s'il est actif
        if (this.timerManager) {
            this.timerManager.stop();
        }

        // Passer le score à la scène GameOver
        const finalScore = this.scoreManager?.getScore() || 0;
        const totalDeliveries = this.scoreManager?.getTotalDeliveries() || 0;

        this.scene.start("GameOver", {
            score: finalScore,
            deliveries: totalDeliveries,
        });
    }

    /**
     * Nettoyage quand on quitte la scène
     */
    shutdown() {
        if (this.ingredientManager) {
            this.ingredientManager.cleanup();
        }
    }

    /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here


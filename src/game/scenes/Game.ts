/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { EventBus } from "../EventBus";
import { CounterInteractionManager } from "../managers/CounterInteractionManager";
import { DeliveryManager } from "../managers/DeliveryManager";
import { IngredientInteractionManager } from "../managers/IngredientInteractionManager";
import { MapManager } from "../managers/MapManager";
import { OrderDisplayManager } from "../managers/OrderDisplayManager";
import { PlayerManager } from "../managers/PlayerManager";
import { ScoreManager } from "../managers/ScoreManager";
import { InteractionSystem } from "../managers/InteractionSystem";

export default class Game extends Phaser.Scene {
    private mapOffsetX: number = 272;
    private mapOffsetY: number = 144;

    // Managers
    private player1: PlayerManager;
    private player2: PlayerManager;
    private playerList: PlayerManager[];

    private mapManager?: MapManager;

    private counterManager?: CounterInteractionManager;
    private orderDisplayManager?: OrderDisplayManager;

    private deliveryManager?: DeliveryManager;
    private scoreManager?: ScoreManager;

    private ingredientManager?: IngredientInteractionManager;

    private interactionSystem?: InteractionSystem;

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
        this.cameras.main.setBackgroundColor(0x87ceeb); // Bleu ciel

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
        this.player1.createPlayer(2, 2);

        this.player2 = new PlayerManager(
            this,
            this.mapOffsetX,
            this.mapOffsetY,
            2
        );
        this.player2.createPlayer(4, 4);

        this.playerList = [this.player1, this.player2];

        // Initialiser les managers
        this.mapManager = new MapManager(
            this,
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

        this.scoreManager = new ScoreManager(this);
        this.ingredientManager = new IngredientInteractionManager();

        // Créer les tiles procéduralement
        this.mapManager.createIsometricTiles();

        // Créer la carte en grille
        const isoMap = this.mapManager.createMap();

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

        // Initialiser les tiles d'ingrédients
        this.mapManager.initializeIngredientTiles();

        // Initialiser le gestionnaire d'ingrédients
        this.ingredientManager.printDebugInfo();

        // Initialiser les systèmes d'affichage
        this.orderDisplayManager = new OrderDisplayManager(
            this,
            this.ingredientManager
        );
        this.orderDisplayManager.initializeRecipeDisplay();
        this.orderDisplayManager.generateNewOrders();

        this.deliveryManager.initializeDeliveryZone();
        this.scoreManager.initializeScoreDisplay();

        // Initialiser les affichages d'inventaire pour chaque joueur
        this.player1.getInventory().initializeInventoryDisplay(10, 220);
        this.player2.getInventory().initializeInventoryDisplay(10, 260);

        // Créer le système d'interaction orienté objet (APRÈS tous les managers)
        this.interactionSystem = new InteractionSystem(
            this,
            this.mapManager,
            this.counterManager,
            this.deliveryManager,
            this.ingredientManager,
            this.orderDisplayManager,
            this.scoreManager
        );

        // Texte d'aide
        const helpText = this.add.text(
            10,
            650,
            "🎮 JOUEUR 1 (Bleu): ZQSD + E | JOUEUR 2 (Rouge): IJKL + O | Espace : Menu\n" +
                "🧈 Beurre + 🌾 Farine = 🥖 Pâte | 🍫 Chocolat + 🥖 Pâte = 🍪 Cookie\n" +
                "💡 Réalisez les commandes (en haut à gauche) et livrez-les dans la zone rouge !\n" +
                "🎯 Coopérez pour gagner plus de points !",
            {
                fontFamily: "Arial",
                fontSize: "14px",
                color: "#ffffff",
                backgroundColor: "#000000",
                padding: { x: 10, y: 10 },
            }
        );
        helpText.setScrollFactor(0);
        helpText.setDepth(1000);

        // Initialiser le debug des joueurs
        for (const player of this.playerList) {
            player.initializeDebugCircle();
            player.initializeDebugText(
                this.cameras.main.width,
                this.cameras.main.height
            );
        }

        // Touche espace pour retourner au menu
        this.input.keyboard?.on("keydown-SPACE", () => {
            this.changeScene();
        });

        EventBus.emit("current-scene-ready", this);
    }

    update(time: number, delta: number) {
        // Mise à jour des joueurs
        this.player1.update();
        this.player2.update();

        // Gestion des interactions pour chaque joueur
        if (this.interactionSystem) {
            if (this.player1.isInteractionPressed()) {
                console.log("🎮 Joueur 1 interagit");
                this.interactionSystem.handlePlayerInteraction(this.player1);
            }

            if (this.player2.isInteractionPressed()) {
                console.log("🎮 Joueur 2 interagit");
                this.interactionSystem.handlePlayerInteraction(this.player2);
            }
        }
    }

    changeScene() {
        this.scene.start("GameOver");
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

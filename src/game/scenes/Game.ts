/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { EventBus } from "../EventBus";
import { CounterInteractionManager } from "../managers/CounterInteractionManager";
import { DeliveryManager } from "../managers/DeliveryManager";
import { IngredientInteractionManager } from "../managers/IngredientInteractionManager";
import { InventoryManager } from "../managers/InventoryManager";
import { MapManager } from "../managers/MapManager";
import { OrderDisplayManager } from "../managers/OrderDisplayManager";
import { PlayerManager } from "../managers/PlayerManager";
import { ScoreManager } from "../managers/ScoreManager";
/* END-USER-IMPORTS */

export default class Game extends Phaser.Scene {
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private mapOffsetX: number = 272;
    private mapOffsetY: number = 144;

    // Managers
    private playerManager?: PlayerManager;
    private mapManager?: MapManager;
    private inventoryManager?: InventoryManager;
    private counterManager?: CounterInteractionManager;
    private orderDisplayManager?: OrderDisplayManager;
    private deliveryManager?: DeliveryManager;
    private scoreManager?: ScoreManager;
    private ingredientManager?: IngredientInteractionManager;

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

        // Initialiser les managers
        this.mapManager = new MapManager(
            this,
            this.mapOffsetX,
            this.mapOffsetY
        );
        this.playerManager = new PlayerManager(
            this,
            this.mapOffsetX,
            this.mapOffsetY
        );
        this.inventoryManager = new InventoryManager(this);
        this.counterManager = new CounterInteractionManager(
            this,
            this.mapOffsetX,
            this.mapOffsetY
        );
        
        // Connecter l'inventory manager au counter manager
        this.counterManager.setInventoryManager(this.inventoryManager);
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

        // Créer le joueur
        const player = this.playerManager.createPlayer();

        // Créer les murs invisibles autour de la carte
        const walls = this.mapManager.createMapBoundaries();

        // Activer les collisions entre le joueur et les tiles solides
        if (player && isoMap) {
            const solidTiles = isoMap.getSolidTiles();
            if (solidTiles.length > 0) {
                this.physics.add.collider(player, solidTiles);
            }
        }

        // Activer la collision entre le joueur et les murs
        if (player && walls) {
            this.physics.add.collider(player, walls);
        }

        // Placer un cookie sur un plan de travail
        this.counterManager.placeItemOnCounter(5, 2, "cookie");

        // Initialiser les tiles d'ingrédients
        this.mapManager.initializeIngredientTiles();


        // Initialiser les systèmes d'affichage
        this.orderDisplayManager = new OrderDisplayManager(
            this,
            this.ingredientManager
        );
        this.orderDisplayManager.initializeRecipeDisplay();
        this.orderDisplayManager.generateNewOrders();

        this.deliveryManager.initializeDeliveryZone();
        this.scoreManager.initializeScoreDisplay();

        // Afficher les contrôles
        this.displayControls();

        // Configurer les contrôles
        this.cursors = this.input.keyboard?.createCursorKeys();


        // Touche espace pour retourner au menu
        this.input.keyboard?.on("keydown-SPACE", () => {
            this.changeScene();
        });

        // Touche E pour interagir avec les plans de travail
        this.input.keyboard?.on("keydown-E", () => {
            this.interactWithCounter();
        });

        // Touche T pour transformer les ingrédients sur les tiles spéciales
        this.input.keyboard?.on("keydown-T", () => {
            this.transformIngredientsOnSpecialTile();
        });

        EventBus.emit("current-scene-ready", this);
    }

    update(time: number, delta: number) {
        if (!this.cursors || !this.playerManager) return;

        const player = this.playerManager.getPlayer();
        if (!player) return;

        // Mettre à jour le mouvement du joueur
        this.playerManager.updateMovement(this.cursors);

        // Mettre à jour la position en grille du joueur
        this.playerManager.updateGridPosition();

        const isoMap = this.mapManager?.getIsoMap();
        const playerGridX = this.playerManager.getPlayerGridX();
        const playerGridY = this.playerManager.getPlayerGridY();
        const lastDirection = this.playerManager.getLastDirection();

        let targetX = playerGridX + lastDirection.x;
        let targetY = playerGridY + lastDirection.y;

        const isPlayerOnCounter =
            isoMap?.isCounter(playerGridX, playerGridY) || false;
        if (isPlayerOnCounter) {
            targetX = playerGridX;
            targetY = playerGridY;
        }

        // Mettre à jour la position de l'objet porté
        if (this.inventoryManager) {
            this.inventoryManager.updateCarriedItemPosition(
                player.x,
                player.y,
                lastDirection
            );
        }

        // Mettre à jour la profondeur seulement si Y a changé
        if (this.playerManager.hasPlayerMoved()) {
            this.playerManager.updatePlayerDepth(
                this.inventoryManager?.getCarriedItem()
            );
        }
    }

    interactWithCounter() {
        if (
            !this.playerManager ||
            !this.mapManager ||
            !this.inventoryManager ||
            !this.counterManager
        )
            return;

        const isoMap = this.mapManager.getIsoMap();
        if (!isoMap) return;

        const playerGridX = this.playerManager.getPlayerGridX();
        const playerGridY = this.playerManager.getPlayerGridY();
        const lastDirection = this.playerManager.getLastDirection();
        const player = this.playerManager.getPlayer();
        if (!player) return;

        // Calculer la tile adjacente dans la direction regardée
        let targetX = playerGridX + lastDirection.x;
        let targetY = playerGridY + lastDirection.y;

        // Si le joueur est sur une tile interactive, interagir avec cette même position
        if (
            isoMap.isCounter(playerGridX, playerGridY) ||
            this.mapManager.isIngredientTile(playerGridX, playerGridY) ||
            this.deliveryManager?.isDeliveryZone(playerGridX, playerGridY)
        ) {
            targetX = playerGridX;
            targetY = playerGridY;

        }

        // Vérifier d'abord si c'est une tile d'ingrédient
        if (this.mapManager.isIngredientTile(targetX, targetY)) {


            if (this.inventoryManager.isEmpty()) {
                const ingredientType = this.mapManager.getIngredientFromTile(
                    targetX,
                    targetY
                );
                if (ingredientType) {
                    this.inventoryManager.addItem(ingredientType);
                    this.inventoryManager.createCarriedItem(
                        ingredientType,
                        player.x,
                        player.y,
                        lastDirection,
                        player.depth
                    );
                }
            } 
        }
        // Sinon, vérifier si c'est une zone de livraison
        else if (this.deliveryManager?.isDeliveryZone(targetX, targetY)) {

            this.processDelivery();
        }
        // Sinon, vérifier si c'est un plan de travail
        else if (isoMap.isCounter(targetX, targetY)) {


            const hasItem = this.counterManager.hasItemOnCounter(
                targetX,
                targetY
            );

            if (hasItem && this.inventoryManager.isEmpty()) {
                // Ramasser l'objet
                const itemType = this.counterManager.removeItemFromCounter(
                    targetX,
                    targetY
                );
                if (itemType) {
                    this.inventoryManager.addItem(itemType);
                    this.inventoryManager.createCarriedItem(
                        itemType,
                        player.x,
                        player.y,
                        lastDirection,
                        player.depth
                    );
                }
            } else if (!hasItem && !this.inventoryManager.isEmpty()) {
                // Permettre de poser l'objet sur toutes les tables (normales et spéciales)
                const itemType = this.inventoryManager.removeItem();
                if (itemType) {
                    this.counterManager.placeItemOnCounter(
                        targetX,
                        targetY,
                        itemType
                    );
                    this.inventoryManager.removeCarriedItem();
                    
                    // Message différent selon le type de tile
                    if (this.mapManager.isSpecialTile(targetX, targetY)) {
                        this.counterManager.showCombinationMessage(
                            "💡 Appuyez sur T pour transformer",
                            targetX,
                            targetY
                        );
                    }
                }
            } else if (hasItem && !this.inventoryManager.isEmpty()) {
                // Si la table a déjà un item, afficher un message
                if (this.mapManager.isSpecialTile(targetX, targetY)) {
                    // Sur les tiles spéciales, rappeler d'utiliser T pour transformer
                    this.counterManager.showCombinationMessage(
                        "💡 Appuyez sur T pour transformer",
                        targetX,
                        targetY
                    );
                } else {
                    // Sur les tables normales, pas de transformation possible
                    this.counterManager.showCombinationMessage(
                        "❌ Tables normales: pas de transformation",
                        targetX,
                        targetY
                    );
                }
            }
        }
    }

    changeScene() {
        this.scene.start("GameOver");
    }

    /**
     * Affiche les contrôles du jeu
     */
    displayControls() {
        const controlsText = this.add.text(10, 10, 
            "Contrôles:\n" +
            "• Flèches: Se déplacer\n" +
            "• E: Tables normales (poser/prendre)\n" +
            "• T: Tiles bleues (transformer)\n" +
            "• ESPACE: Menu", 
            {
                fontFamily: "Arial",
                fontSize: "16px",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 2,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                padding: { x: 10, y: 10 }
            }
        );
        controlsText.setDepth(1000);
    }

    /**
     * Transforme les ingrédients sur une tile spéciale
     */
    transformIngredientsOnSpecialTile() {
        if (!this.playerManager || !this.mapManager || !this.counterManager || !this.inventoryManager) {
            console.log("Managers manquants");
            return;
        }

        const playerGridX = this.playerManager.getPlayerGridX();
        const playerGridY = this.playerManager.getPlayerGridY();
        const lastDirection = this.playerManager.getLastDirection();

        console.log(`Joueur en position: (${playerGridX}, ${playerGridY}), direction: (${lastDirection.x}, ${lastDirection.y})`);

        // Calculer la position adjacente selon la direction
        const adjacentX = playerGridX + lastDirection.x;
        const adjacentY = playerGridY + lastDirection.y;

        console.log(`Position adjacente calculée: (${adjacentX}, ${adjacentY})`);
        console.log(`Est une tile spéciale: ${this.mapManager.isSpecialTile(adjacentX, adjacentY)}`);
        
        // Vérifier aussi si le joueur est directement sur une tile spéciale
        console.log(`Joueur sur tile spéciale: ${this.mapManager.isSpecialTile(playerGridX, playerGridY)}`);

        // Vérifier si la position adjacente est une tile spéciale
        if (this.mapManager.isSpecialTile(adjacentX, adjacentY)) {
            console.log(`Tile spéciale trouvée en (${adjacentX}, ${adjacentY})`);
            
            // Vérifier s'il y a un objet sur cette tile
            if (this.counterManager.hasItemOnCounter(adjacentX, adjacentY)) {
                console.log("Objet trouvé sur la tile spéciale, tentative de transformation");
                // Effectuer la transformation
                const success = this.counterManager.performSpecialTransformation(adjacentX, adjacentY);
                if (success) {
                    console.log("Transformation réussie !");
                } else {
                    console.log("Aucune transformation possible");
                }
            } else if (!this.inventoryManager.isEmpty()) {
                console.log("Inventaire non vide, tentative de placement");
                // Poser un ingrédient sur la tile spéciale
                const player = this.playerManager.getPlayer();
                if (player) {
                    const itemType = this.inventoryManager.removeItem();
                    if (itemType) {
                        console.log(`Tentative de placer ${itemType} sur la tile spéciale`);
                        const placed = this.counterManager.placeItemOnCounter(
                            adjacentX,
                            adjacentY,
                            itemType
                        );
                        if (placed) {
                            this.inventoryManager.removeCarriedItem();
                            this.counterManager.showCombinationMessage(
                                `📦 ${itemType} posé`,
                                adjacentX,
                                adjacentY
                            );
                            console.log("Ingrédient placé avec succès");
                        } else {
                            console.log("Échec du placement de l'ingrédient");
                            // Remettre l'ingrédient dans l'inventaire
                            this.inventoryManager.addItem(itemType);
                        }
                    }
                }
            } else {
                console.log("Aucun ingrédient dans l'inventaire");
            }
        } else {
            console.log("Pas de tile spéciale à côté du joueur");
        }
    }

    /**
     * Traite la livraison d'un plat
     */
    processDelivery() {
        if (
            !this.playerManager ||
            !this.deliveryManager ||
            !this.inventoryManager ||
            !this.orderDisplayManager ||
            !this.scoreManager ||
            !this.ingredientManager
        )
            return;

        const playerGridX = this.playerManager.getPlayerGridX();
        const playerGridY = this.playerManager.getPlayerGridY();
        const lastDirection = this.playerManager.getLastDirection();

        // Vérifier si le joueur est dans la zone OU regarde vers la zone
        const isInZone = this.deliveryManager.isInDeliveryZone(
            playerGridX,
            playerGridY
        );
        const isLookingAtZone = this.deliveryManager.isLookingAtDeliveryZone(
            playerGridX,
            playerGridY,
            lastDirection
        );

        if (
            (!isInZone && !isLookingAtZone) ||
            this.inventoryManager.isEmpty()
        ) {
            return;
        }

        const carriedItem = this.inventoryManager.peekItem();
        if (!carriedItem) return;

        // Vérifier si c'est un plat fini
        if (this.ingredientManager.getRecipeManager().isDish(carriedItem)) {
            // Vérifier si ce plat correspond à une commande
            if (this.orderDisplayManager.checkOrderCompletion(carriedItem)) {
                // Supprimer l'objet de l'inventaire
                this.inventoryManager.removeItem();
                this.inventoryManager.removeCarriedItem();

                // Ajouter des points au score
                const points =
                    this.scoreManager.calculateRecipePoints(carriedItem);
                this.scoreManager.addScore(points, `Livraison ${carriedItem}`);

                this.deliveryManager.showDeliverySuccessEffect();
            } else {
                this.deliveryManager.showDeliveryErrorEffect();
            }
        }
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


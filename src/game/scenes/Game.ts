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
import { InventoryManager } from "../managers/InventoryManager";

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

    private inventoryManager: InventoryManager = new InventoryManager(this);

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

        // Texte d'aide
        const helpText = this.add.text(
            10,
            650,
            "Flèches : Déplacer | E : Ramasser/Déposer/Combiner/Livrer | Espace : Menu\n" +
                "🧈 Beurre + 🌾 Farine = 🥖 Pâte | 🍫 Chocolat + 🥖 Pâte = 🍪 Cookie\n" +
                "💡 Réalisez les commandes (en haut à gauche) et livrez-les dans la zone rouge !\n" +
                "🎯 Gagnez des points à chaque livraison réussie !",
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
        this.player1.update();
        this.player2.update();
        this.interactWithCounter();
    }

    interactWithCounter() {
        if (
            !this.playerList ||
            !this.mapManager ||
            !this.inventoryManager ||
            !this.counterManager
        )
            return;

        const isoMap = this.mapManager.getIsoMap();
        if (!isoMap) return;

        const playerGridX = this.player1.getPlayerGridX();
        const playerGridY = this.player1.getPlayerGridY();
        const lastDirection = this.player1.getLastDirection();
        const player = this.player1.getPlayer();
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
            console.log(
                `Joueur sur tile interactive, interaction sur la même position (${targetX}, ${targetY})`
            );
        }

        console.log(
            `Position joueur grille: (${playerGridX}, ${playerGridY}), Direction: (${lastDirection.x}, ${lastDirection.y}), Cible: (${targetX}, ${targetY})`
        );

        // Vérifier d'abord si c'est une tile d'ingrédient
        if (this.mapManager.isIngredientTile(targetX, targetY)) {
            console.log(
                `Interaction avec tile d'ingrédient à la position (${targetX}, ${targetY})`
            );

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
                    console.log(`Récupéré: ${ingredientType}`);
                }
            } else {
                console.log(
                    "Inventaire plein (limite: 1 objet), ne peut pas récupérer d'ingrédient"
                );
            }
        }
        // Sinon, vérifier si c'est une zone de livraison
        else if (this.deliveryManager?.isDeliveryZone(targetX, targetY)) {
            console.log(
                `Interaction avec la zone de livraison à la position (${targetX}, ${targetY})`
            );
            this.processDelivery();
        }
        // Sinon, vérifier si c'est un plan de travail
        else if (isoMap.isCounter(targetX, targetY)) {
            console.log(
                `Interaction avec le plan de travail à la position (${targetX}, ${targetY})`
            );

            const hasItem = this.counterManager.hasItemOnCounter(
                targetX,
                targetY
            );
            console.log(
                `Objet sur comptoir: ${hasItem}, Inventaire: ${
                    this.inventoryManager.isEmpty() ? 0 : 1
                }`
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
                    console.log(`Ramassé: ${itemType}`);
                }
            } else if (!hasItem && !this.inventoryManager.isEmpty()) {
                // Poser l'objet
                const itemType = this.inventoryManager.removeItem();
                if (itemType) {
                    this.counterManager.placeItemOnCounter(
                        targetX,
                        targetY,
                        itemType
                    );
                    this.inventoryManager.removeCarriedItem();
                    console.log(`Posé: ${itemType}`);
                }
            } else if (hasItem && !this.inventoryManager.isEmpty()) {
                // Tenter une combinaison
                const itemInHand = this.inventoryManager.peekItem();
                const itemOnCounter = this.counterManager.getItemTypeOnCounter(
                    targetX,
                    targetY
                );

                if (itemInHand && itemOnCounter && this.ingredientManager) {
                    const resultId = this.ingredientManager
                        .getRecipeManager()
                        .combineIngredients(itemInHand, itemOnCounter);

                    if (resultId) {
                        console.log(
                            `✨ Combinaison réussie : ${itemInHand} + ${itemOnCounter} = ${resultId}`
                        );

                        // Retirer les ingrédients
                        this.inventoryManager.removeItem();
                        this.inventoryManager.removeCarriedItem();
                        this.counterManager.removeItemFromCounter(
                            targetX,
                            targetY
                        );

                        // Créer le résultat
                        this.counterManager.placeItemOnCounter(
                            targetX,
                            targetY,
                            resultId
                        );

                        // Effets visuels
                        this.counterManager.playFusionEffect(targetX, targetY);
                        const ingredient = this.ingredientManager
                            .getRecipeManager()
                            .getIngredient(resultId);
                        if (ingredient) {
                            this.counterManager.showCombinationMessage(
                                `✨ ${ingredient.name} créé !`,
                                targetX,
                                targetY
                            );
                        }

                        console.log(
                            `✨ ${resultId} créé - à livrer dans la zone rouge !`
                        );
                    } else {
                        console.log(
                            `❌ Aucune recette pour ${itemInHand} + ${itemOnCounter}`
                        );
                        this.counterManager.showCombinationMessage(
                            "❌ Pas de recette",
                            targetX,
                            targetY
                        );
                    }
                } else {
                    console.log(
                        "Inventaire plein (limite: 1 objet), ne peut pas ramasser"
                    );
                }
            } else {
                console.log(
                    "Aucun objet sur le plan de travail, inventaire vide"
                );
            }
        } else {
            console.log(
                `Aucune tile interactive à la position (${targetX}, ${targetY})`
            );
        }
    }

    changeScene() {
        this.scene.start("GameOver");
    }

    /**
     * Traite la livraison d'un plat
     */
    processDelivery() {
        if (
            !this.playerList ||
            !this.deliveryManager ||
            !this.inventoryManager ||
            !this.orderDisplayManager ||
            !this.scoreManager ||
            !this.ingredientManager
        )
            return;

        const playerGridX = this.player1.getPlayerGridX();
        const playerGridY = this.player1.getPlayerGridY();
        const lastDirection = this.player1.getLastDirection();

        console.log(
            `🚚 processDelivery appelé - Position joueur: (${playerGridX}, ${playerGridY}), Inventaire: ${
                this.inventoryManager.isEmpty() ? 0 : 1
            }`
        );

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
            console.log(
                `❌ Conditions non remplies - Dans zone: ${isInZone}, Regarde zone: ${isLookingAtZone}, Inventaire vide: ${this.inventoryManager.isEmpty()}`
            );
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

                console.log(`🎉 Plat livré avec succès : ${carriedItem}`);
                this.deliveryManager.showDeliverySuccessEffect();
            } else {
                console.log(
                    `❌ Ce plat n'est pas dans les commandes : ${carriedItem}`
                );
                this.deliveryManager.showDeliveryErrorEffect();
            }
        } else {
            console.log(`❌ Ce n'est pas un plat fini : ${carriedItem}`);
            this.deliveryManager.showDeliveryErrorEffect();
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

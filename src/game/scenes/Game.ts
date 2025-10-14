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

    // Managers1
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
        this.inventoryManager.initializeInventoryDisplay();

        // Configurer les contrôles
        this.cursors = this.input.keyboard?.createCursorKeys();

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
            }
        );
        helpText.setScrollFactor(0);
        helpText.setDepth(1000);

        // Initialiser le debug du joueur
        this.playerManager.initializeDebugCircle();
        this.playerManager.initializeDebugText(
            this.cameras.main.width,
            this.cameras.main.height
        );

        // Touche espace pour retourner au menu
        this.input.keyboard?.on("keydown-SPACE", () => {
            this.changeScene();
        });

        // Touche E pour interagir avec les plans de travail
        this.input.keyboard?.on("keydown-E", () => {
            this.interactWithCounter();
        });

        EventBus.emit("current-scene-ready", this);
    }

    createIsometricTiles() {
        // Créer des tiles carrés style Stardew Valley
        const tileSize = 48; // Taille du carré
        const tiles = [
            { key: "iso-grass", color: 0x5cb85c, darkColor: 0x4a9d4a }, // Vert herbe
            { key: "iso-dirt", color: 0x8b7355, darkColor: 0x6d5a43 }, // Marron terre
            { key: "iso-water", color: 0x4a90e2, darkColor: 0x3a75c4 }, // Bleu eau
            { key: "iso-wall", color: 0x666666, darkColor: 0x444444 }, // Gris mur
            { key: "iso-counter", color: 0xd2691e, darkColor: 0xb8860b }, // Marron bois
            {
                key: "iso-ingredient-chocolate",
                color: 0x8b4513,
                darkColor: 0x654321,
            }, // Marron chocolat
            {
                key: "iso-ingredient-butter",
                color: 0xffd700,
                darkColor: 0xddaa00,
            }, // Jaune beurre
            {
                key: "iso-ingredient-wheat",
                color: 0xf5deb3,
                darkColor: 0xd2b48c,
            }, // Beige farine
            {
                key: "iso-delivery-zone",
                color: 0xff6b6b,
                darkColor: 0xe53e3e,
            }, // Rouge zone de livraison
        ];

        tiles.forEach(({ key, color, darkColor }) => {
            const graphics = this.add.graphics();

            // Dessiner un carré avec effet 3D
            // Face supérieure (carré principal)
            graphics.fillStyle(color, 1);
            graphics.fillRect(0, 0, tileSize, tileSize);

            // Bordures pour effet 3D
            // Côté droit (plus sombre)
            graphics.fillStyle(darkColor, 1);
            graphics.fillRect(tileSize - 4, 0, 4, tileSize);

            // Côté bas (plus sombre)
            graphics.fillRect(0, tileSize - 4, tileSize, 4);

            // Bordure claire en haut et à gauche
            graphics.lineStyle(2, 0xffffff, 0.3);
            graphics.beginPath();
            graphics.moveTo(0, tileSize);
            graphics.lineTo(0, 0);
            graphics.lineTo(tileSize, 0);
            graphics.strokePath();

            // Convertir en texture
            graphics.generateTexture(key, tileSize, tileSize);
            graphics.destroy();
        });

        // Les sprites de grand-mère sont déjà chargés dans le préchargeur
        // Pas besoin de générer de texture, on utilise directement les images
        // La texture de pâte (dough.png) est déjà chargée dans le préchargeur
    }

    createPlayer() {
        // Positionner le joueur sur un tile d'herbe (case 2,2) pour éviter les bordures
        // Ajustement pour l'origine centrée (0.5, 0.5) au lieu de (0.5, 0.75)
        const startX =
            this.mapOffsetX +
            2 * IsometricUtils.TILE_WIDTH +
            IsometricUtils.TILE_WIDTH / 2;
        const startY =
            this.mapOffsetY +
            2 * IsometricUtils.TILE_HEIGHT +
            IsometricUtils.TILE_HEIGHT / 2 -
            12; // -12 pour compenser le changement d'origine

        // Créer un sprite avec physique (grand-mère de face par défaut)
        this.player = this.physics.add.sprite(startX, startY, "grandma-front");
        this.player.setOrigin(0.5, 0.5); // Centré pour la rotation

        // Configurer la hitbox (zone de collision)
        const body = this.player.body as Phaser.Physics.Arcade.Body;

        // Hitbox rectangulaire adaptée aux sprites de grand-mère
        // Taille réduite de moitié
        const hitboxWidth = this.player.width; // Toute la largeur
        const hitboxHeight = this.player.height * 0.3; // 30% de la hauteur (moitié de 60%)

        // Positionner la hitbox au niveau des pieds
        body.setSize(hitboxWidth, hitboxHeight);

        // Offset pour positionner la hitbox au bas du sprite, centrée horizontalement
        // Avec origine (0.5, 0.5), offset positif descend vers le bas
        // X: centrer la hitbox réduite
        const offsetX = (this.player.width - hitboxWidth) / 2;
        // Y: positionner au bas (offset positif pour descendre)
        const offsetY = this.player.height * 0.7; // 70% de la hauteur vers le bas
        body.setOffset(offsetX, offsetY);

        this.lastPlayerY = startY;
        this.updatePlayerDepth();
    }

    createMapBoundaries() {
        // Créer un groupe de murs statiques (invisibles)
        this.walls = this.physics.add.staticGroup();

        const wallThickness = 1; // Épaisseur des murs (1 pixel)

        // Calculer les vraies limites de la carte
        // Les tiles sont centrés, donc on doit tenir compte de leur taille
        const tileHalfWidth = IsometricUtils.TILE_WIDTH / 2;
        const tileHalfHeight = IsometricUtils.TILE_HEIGHT / 2;

        // Limites réelles de la carte (bords extérieurs des tiles)
        const mapLeft = this.mapOffsetX - tileHalfWidth;
        const mapRight =
            this.mapOffsetX +
            (this.mapWidth - 1) * IsometricUtils.TILE_WIDTH +
            tileHalfWidth;
        const mapTop = this.mapOffsetY - tileHalfHeight;
        const mapBottom =
            this.mapOffsetY +
            (this.mapHeight - 1) * IsometricUtils.TILE_HEIGHT +
            tileHalfHeight;

        // Mur du haut
        const topWall = this.add.rectangle(
            (mapLeft + mapRight) / 2,
            mapTop - wallThickness / 2,
            mapRight - mapLeft + wallThickness * 2,
            wallThickness,
            0xff0000,
            0.2 // Légèrement visible pour débugger
        );
        this.walls.add(topWall);

        // Mur du bas
        const bottomWall = this.add.rectangle(
            (mapLeft + mapRight) / 2,
            mapBottom + wallThickness / 2,
            mapRight - mapLeft + wallThickness * 2,
            wallThickness,
            0xff0000,
            0.2 // Légèrement visible pour débugger
        );
        this.walls.add(bottomWall);

        // Mur de gauche
        const leftWall = this.add.rectangle(
            mapLeft - wallThickness / 2,
            (mapTop + mapBottom) / 2,
            wallThickness,
            mapBottom - mapTop,
            0xff0000,
            0.2 // Légèrement visible pour débugger
        );
        this.walls.add(leftWall);

        // Mur de droite
        const rightWall = this.add.rectangle(
            mapRight + wallThickness / 2,
            (mapTop + mapBottom) / 2,
            wallThickness,
            mapBottom - mapTop,
            0xff0000,
            0.2 // Légèrement visible pour débugger
        );
        this.walls.add(rightWall);

        // Activer la collision entre le joueur et les murs
        if (this.player && this.walls) {
            this.physics.add.collider(this.player, this.walls);
        }
    }

    updatePlayerDepth() {
        if (this.player) {
            // Simple : utiliser directement la position Y du joueur
            // Plus le Y est grand, plus on est devant
            // On multiplie par 10 et on ajoute un offset de 5 pour être sûr d'être au-dessus des tiles
            this.player.setDepth(this.player.y * 10 + 5);
            this.lastPlayerY = this.player.y;

            // Mettre à jour la profondeur de l'objet porté en même temps
            if (this.carriedItem) {
                if (this.lastDirection.y === -1) {
                    this.carriedItem.setDepth(this.player.depth - 1); // Derrière (vers le haut)
                } else {
                    this.carriedItem.setDepth(this.player.depth + 1); // Devant (autres directions)
                }
            }
        }
    }

    update(time: number, delta: number) {
        if (!this.cursors || !this.playerManager) return;

        const player = this.playerManager.getPlayer();
        if (!player) return;

        // Mettre à jour le mouvement du joueur
        this.playerManager.updateMovement(this.cursors);

        // Mettre à jour la position en grille du joueur
        this.playerManager.updateGridPosition();

        // Mettre à jour le texte de debug
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

        const hasCounterAtTarget = isoMap?.isCounter(targetX, targetY) || false;
        const totalCounters = isoMap?.getCounterTiles().length || 0;

        this.playerManager.updateDebugText(
            isPlayerOnCounter,
            hasCounterAtTarget,
            totalCounters
        );

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

        // Dessiner le cercle de debug au centre de la hitbox
        this.playerManager.updateDebugCircle();
    }

    interactWithCounter() {
        if (!this.isoMap || !this.player) return;

        // Utiliser directement playerGridX et playerGridY qui sont déjà calculés
        // dans updatePlayerGridPosition() basé sur la hitbox

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

    placeItemOnCounter(gridX: number, gridY: number, itemType: string) {
        if (!this.isoMap || !this.isoMap.isCounter(gridX, gridY)) return false;

        const key = `${gridX},${gridY}`;

        // Vérifier s'il n'y a pas déjà un objet sur ce plan de travail
        if (this.itemsOnCounters.has(key)) return false;

        // Calculer la position à l'écran
        const screenPos = IsometricUtils.gridToScreen(gridX, gridY);
        const x = screenPos.x + this.mapOffsetX;
        const y = screenPos.y + this.mapOffsetY;

        // Créer une image simple (pas de drag & drop)
        const item = this.add.image(x, y, itemType);
        item.setOrigin(0.5, 0.5);
        item.setScale(1.2);
        item.setDepth(y + 100);
        this.itemsOnCounters.set(key, item);
        return true;
    }

    removeItemFromCounter(gridX: number, gridY: number): string | null {
        const key = `${gridX},${gridY}`;
        const item = this.itemsOnCounters.get(key);

        if (item) {
            const itemType = item.texture.key;
            item.destroy();
            this.itemsOnCounters.delete(key);
            return itemType;
        }

        return null;
    }

    hasItemOnCounter(gridX: number, gridY: number): boolean {
        const key = `${gridX},${gridY}`;
        return this.itemsOnCounters.has(key);
    }

    getItemTypeOnCounter(gridX: number, gridY: number): string | null {
        const key = `${gridX},${gridY}`;
        const item = this.itemsOnCounters.get(key);
        return item ? item.texture.key : null;
    }

    playFusionEffect(gridX: number, gridY: number) {
        const screenPos = IsometricUtils.gridToScreen(gridX, gridY);
        const x = screenPos.x + this.mapOffsetX;
        const y = screenPos.y + this.mapOffsetY;

        // Créer des particules scintillantes (utiliser 'star' si disponible)
        try {
            const particles = this.add.particles(x, y, "star", {
                speed: { min: -100, max: 100 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.5, end: 0 },
                lifespan: 600,
                quantity: 15,
                blendMode: "ADD",
            });

            // Détruire l'émetteur après l'animation
            this.time.delayedCall(600, () => {
                particles.destroy();
            });
        } catch (e) {
            // Si pas de texture 'star', on saute l'effet
            console.log("Pas de particules (texture 'star' manquante)");
        }
    }

    showCombinationMessage(text: string, gridX: number, gridY: number) {
        const screenPos = IsometricUtils.gridToScreen(gridX, gridY);
        const x = screenPos.x + this.mapOffsetX;
        const y = screenPos.y + this.mapOffsetY - 50;

        const message = this.add.text(x, y, text, {
            fontFamily: "Arial",
            fontSize: "24px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4,
        });
        message.setOrigin(0.5);

        // Animation de montée et disparition
        this.tweens.add({
            targets: message,
            y: y - 30,
            alpha: 0,
            duration: 1000,
            ease: "Cubic.easeOut",
            onComplete: () => message.destroy(),
        });
    }

    createCarriedItem(itemType: string) {
        if (!this.player) return;

        // Détruire l'objet porté précédent s'il existe
        if (this.carriedItem) {
            this.carriedItem.destroy();
        }

        // Calculer la position initiale en fonction de la direction actuelle
        // Ajustement pour les sprites de grand-mère
        const offsetDistance = 20; // Distance du centre du sprite

        // Calculer l'offset en fonction de la direction
        let offsetX = this.lastDirection.x * offsetDistance;
        let offsetY = this.lastDirection.y * offsetDistance;

        // Si le joueur va sur les côtés (gauche ou droite), baisser un peu l'objet
        if (this.lastDirection.x !== 0) {
            offsetY += 8; // Baisser de 8 pixels sur les côtés
        }

        // Si le joueur va vers le haut, baisser l'objet et le passer derrière
        if (this.lastDirection.y === -1) {
            offsetY += 15; // Baisser de 15 pixels vers le haut
        }

        // Si le joueur va vers le bas, ajuster la position pour éviter les conflits
        if (this.lastDirection.y === 1) {
            offsetY -= 5; // Remonter légèrement quand on va vers le bas
        }

        // Créer le nouvel objet porté
        this.carriedItem = this.add.image(
            this.player.x + offsetX,
            this.player.y + offsetY,
            itemType
        );
        this.carriedItem.setOrigin(0.5, 0.5);
        this.carriedItem.setScale(0.8); // Un peu plus petit que sur le plan de travail

        // Profondeur selon la direction
        // Utiliser la profondeur du joueur comme base pour éviter les oscillations
        const playerDepth = this.player.depth;
        if (this.lastDirection.y === -1) {
            this.carriedItem.setDepth(playerDepth - 1); // Derrière la grand-mère (vers le haut)
        } else {
            this.carriedItem.setDepth(playerDepth + 1); // Devant la grand-mère (toutes autres directions)
        }
    }

    removeCarriedItem() {
        if (this.carriedItem) {
            this.carriedItem.destroy();
            this.carriedItem = undefined;
        }
    }

    initializeIngredientTiles() {
        // Mapper les positions des tiles d'ingrédients selon la carte
        // Position (1,1) = chocolat
        this.ingredientTiles.set("1,1", "chocolate");
        // Position (1,8) = beurre
        this.ingredientTiles.set("1,8", "butter");
        // Position (2,8) = farine
        this.ingredientTiles.set("2,8", "wheat_floor");

        console.log(
            "Tiles d'ingrédients initialisées:",
            Array.from(this.ingredientTiles.entries())
        );
    }

    isIngredientTile(gridX: number, gridY: number): boolean {
        const key = `${gridX},${gridY}`;
        return this.ingredientTiles.has(key);
    }

    getIngredientFromTile(gridX: number, gridY: number): string | null {
        const key = `${gridX},${gridY}`;
        return this.ingredientTiles.get(key) || null;
    }

    changeScene() {
        this.scene.start("GameOver");
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


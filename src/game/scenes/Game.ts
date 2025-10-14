/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { EventBus } from '../EventBus';
import { IsometricMap, IsometricUtils } from '../utils/IsometricUtils';
/* END-USER-IMPORTS */

export default class Game extends Phaser.Scene {
	private isoMap?: IsometricMap;
	private player?: Phaser.Physics.Arcade.Sprite;
	private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
	private playerSpeed: number = 150; // Pixels par seconde
	private mapOffsetX: number = 272;
	private mapOffsetY: number = 144;
	private mapWidth: number = 10; // Nombre de tiles en largeur
	private mapHeight: number = 10; // Nombre de tiles en hauteur
	
	// Précalcul des constantes pour optimisation
	private readonly DIAGONAL_FACTOR = Math.SQRT2 / 2; // ~0.707
	private lastPlayerY: number = 0;
	private walls?: Phaser.Physics.Arcade.StaticGroup;
	private playerGridX: number = 2; // Position en grille du joueur
	private playerGridY: number = 2;
	private debugText?: Phaser.GameObjects.Text;
	private inventoryText?: Phaser.GameObjects.Text;
	private inventory: string[] = []; // Inventaire du joueur
	private itemsOnCounters: Map<string, Phaser.GameObjects.Image> = new Map(); // Objets posés sur les plans de travail
	private carriedItem?: Phaser.GameObjects.Image; // Objet porté visible au-dessus du joueur
	private lastDirection: { x: number, y: number } = { x: 0, y: 1 }; // Direction actuelle du joueur (par défaut vers le bas)

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
		this.cameras.main.setBackgroundColor(0x87CEEB); // Bleu ciel

		// Créer les tiles procéduralement
		this.createIsometricTiles();

		// Créer la carte en grille
		this.isoMap = new IsometricMap(this);
		
		// Exemple de carte (10x10)
		// 1 = herbe, 2 = terre, 3 = eau, 4 = mur, 5 = plan de travail, 0 = vide
		const mapData = [
			[4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
			[4, 1, 2, 2, 1, 1, 1, 3, 3, 4],
			[4, 1, 2, 2, 1, 5, 5, 3, 3, 4],
			[4, 1, 2, 2, 1, 5, 5, 1, 1, 4],
			[4, 1, 1, 1, 1, 5, 5, 1, 1, 4],
			[4, 1, 1, 1, 1, 2, 2, 1, 1, 4],
			[4, 3, 3, 1, 1, 2, 2, 1, 1, 4],
			[4, 3, 3, 1, 5, 5, 5, 1, 1, 4],
			[4, 1, 1, 1, 1, 1, 1, 1, 2, 4],
			[4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
		];

		const tileTextures = {
			1: 'iso-grass',
			2: 'iso-dirt',
			3: 'iso-water',
			4: 'iso-wall',
			5: 'iso-counter'
		};

		// Créer la carte directement avec l'offset
		this.isoMap.createMap(mapData, tileTextures, this.mapOffsetX, this.mapOffsetY);

		// Créer le joueur
		this.createPlayer();

		// Créer les murs invisibles autour de la carte
		this.createMapBoundaries();

		// Activer les collisions entre le joueur et les tiles solides
		if (this.player && this.isoMap) {
			const solidTiles = this.isoMap.getSolidTiles();
			if (solidTiles.length > 0) {
				this.physics.add.collider(this.player, solidTiles);
			}
		}

		// Placer un cookie sur un plan de travail
		this.placeItemOnCounter(5, 2, 'cookie'); // Placer un cookie sur le plan de travail (5,2)

		// Configurer les contrôles
		this.cursors = this.input.keyboard?.createCursorKeys();

		// Texte d'aide
		const helpText = this.add.text(10, 10, 
			'Utilise les flèches pour te déplacer librement\nE pour interagir avec les plans de travail\nEspace pour revenir au menu', 
			{
				fontFamily: 'Arial',
				fontSize: '16px',
				color: '#ffffff',
				backgroundColor: '#000000',
				padding: { x: 10, y: 10 }
			}
		);
		helpText.setScrollFactor(0);
		helpText.setDepth(1000);

		// Texte de debug pour la position
		this.debugText = this.add.text(10, 120, '', {
			fontFamily: 'Arial',
			fontSize: '14px',
			color: '#ffffff',
			backgroundColor: '#000000',
			padding: { x: 5, y: 5 }
		});
		this.debugText.setScrollFactor(0);
		this.debugText.setDepth(1000);

		// Texte d'inventaire
		this.inventoryText = this.add.text(10, 220, '', {
			fontFamily: 'Arial',
			fontSize: '14px',
			color: '#ffffff',
			backgroundColor: '#000000',
			padding: { x: 5, y: 5 }
		});
		this.inventoryText.setScrollFactor(0);
		this.inventoryText.setDepth(1000);

		// Touche espace pour retourner au menu
		this.input.keyboard?.on('keydown-SPACE', () => {
			this.changeScene();
		});

		// Touche E pour interagir avec les plans de travail
		this.input.keyboard?.on('keydown-E', () => {
			this.interactWithCounter();
		});

        EventBus.emit('current-scene-ready', this);
	}

	createIsometricTiles() {
		// Créer des tiles carrés style Stardew Valley
		const tileSize = 48; // Taille du carré
		const tiles = [
			{ key: 'iso-grass', color: 0x5CB85C, darkColor: 0x4A9D4A }, // Vert herbe
			{ key: 'iso-dirt', color: 0x8B7355, darkColor: 0x6D5A43 },  // Marron terre
			{ key: 'iso-water', color: 0x4A90E2, darkColor: 0x3A75C4 }, // Bleu eau
			{ key: 'iso-wall', color: 0x666666, darkColor: 0x444444 },  // Gris mur
			{ key: 'iso-counter', color: 0xD2691E, darkColor: 0xB8860B }, // Marron bois
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
			graphics.lineStyle(2, 0xFFFFFF, 0.3);
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
	}

	createPlayer() {
		// Positionner le joueur sur un tile d'herbe (case 2,2) pour éviter les bordures
		// Ajustement pour l'origine centrée (0.5, 0.5) au lieu de (0.5, 0.75)
		const startX = this.mapOffsetX + 2 * IsometricUtils.TILE_WIDTH + IsometricUtils.TILE_WIDTH / 2;
		const startY = this.mapOffsetY + 2 * IsometricUtils.TILE_HEIGHT + IsometricUtils.TILE_HEIGHT / 2 - 12; // -12 pour compenser le changement d'origine
		
		// Créer un sprite avec physique (grand-mère de face par défaut)
		this.player = this.physics.add.sprite(startX, startY, 'grandma-front');
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
		const mapRight = this.mapOffsetX + (this.mapWidth - 1) * IsometricUtils.TILE_WIDTH + tileHalfWidth;
		const mapTop = this.mapOffsetY - tileHalfHeight;
		const mapBottom = this.mapOffsetY + (this.mapHeight - 1) * IsometricUtils.TILE_HEIGHT + tileHalfHeight;

		// Mur du haut
		const topWall = this.add.rectangle(
			(mapLeft + mapRight) / 2,
			mapTop - wallThickness / 2,
			(mapRight - mapLeft) + wallThickness * 2,
			wallThickness,
			0xff0000,
			0.2 // Légèrement visible pour débugger
		);
		this.walls.add(topWall);

		// Mur du bas
		const bottomWall = this.add.rectangle(
			(mapLeft + mapRight) / 2,
			mapBottom + wallThickness / 2,
			(mapRight - mapLeft) + wallThickness * 2,
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
		if (!this.cursors || !this.player) return;

		let velocityX = 0;
		let velocityY = 0;

		// Déplacement fluide avec les flèches
		if (this.cursors.up!.isDown) {
			velocityY = -this.playerSpeed;
			this.lastDirection = { x: 0, y: -1 }; // Haut
			this.updatePlayerSprite('grandma-back', false); // Vue de dos
		} else if (this.cursors.down!.isDown) {
			velocityY = this.playerSpeed;
			this.lastDirection = { x: 0, y: 1 }; // Bas
			this.updatePlayerSprite('grandma-front', false); // Vue de face
		}

		if (this.cursors.left!.isDown) {
			velocityX = -this.playerSpeed;
			this.lastDirection = { x: -1, y: 0 }; // Gauche
			this.updatePlayerSprite('grandma-side', true); // Vue de côté (gauche, retournée)
		} else if (this.cursors.right!.isDown) {
			velocityX = this.playerSpeed;
			this.lastDirection = { x: 1, y: 0 }; // Droite
			this.updatePlayerSprite('grandma-side', false); // Vue de côté (droite, normale)
		}

		// Normaliser la vitesse en diagonale (utilise la constante précalculée)
		if (velocityX !== 0 && velocityY !== 0) {
			velocityX *= this.DIAGONAL_FACTOR;
			velocityY *= this.DIAGONAL_FACTOR;
		}

		// Appliquer la vélocité (la physique gère les collisions)
		this.player.setVelocity(velocityX, velocityY);

		// Mettre à jour la position en grille du joueur
		this.updatePlayerGridPosition();

		// Mettre à jour le texte de debug
		this.updateDebugText();

		// Mettre à jour l'affichage de l'inventaire
		this.updateInventoryDisplay();

		// Mettre à jour la position de l'objet porté
		this.updateCarriedItemPosition();

		// Mettre à jour la profondeur seulement si Y a changé
		if (this.player.y !== this.lastPlayerY) {
			this.updatePlayerDepth();
		}
	}

	updatePlayerGridPosition() {
		if (!this.player || !this.isoMap) return;

		// Calculer les limites du sprite du joueur avec origine centrée (0.5, 0.5)
		// Utiliser la hitbox réelle du joueur pour plus de précision
		const body = this.player.body as Phaser.Physics.Arcade.Body;
		const playerLeft = this.player.x - body.halfWidth;
		const playerRight = this.player.x + body.halfWidth;
		const playerTop = this.player.y - body.halfHeight;
		const playerBottom = this.player.y + body.halfHeight;

		// Convertir les coins du joueur en coordonnées de grille
		const topLeft = IsometricUtils.screenToGrid(playerLeft - this.mapOffsetX, playerTop - this.mapOffsetY);
		const topRight = IsometricUtils.screenToGrid(playerRight - this.mapOffsetX, playerTop - this.mapOffsetY);
		const bottomLeft = IsometricUtils.screenToGrid(playerLeft - this.mapOffsetX, playerBottom - this.mapOffsetY);
		const bottomRight = IsometricUtils.screenToGrid(playerRight - this.mapOffsetX, playerBottom - this.mapOffsetY);

		// Déterminer les limites de grille occupées par le joueur
		const minGridX = Math.floor(Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x));
		const maxGridX = Math.ceil(Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x));
		const minGridY = Math.floor(Math.min(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y));
		const maxGridY = Math.ceil(Math.max(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y));

		// Calculer quelle tile contient le plus de surface du joueur
		let bestTileX = minGridX;
		let bestTileY = minGridY;
		let maxOverlap = 0;

		for (let gridX = minGridX; gridX <= maxGridX; gridX++) {
			for (let gridY = minGridY; gridY <= maxGridY; gridY++) {
				const overlap = this.calculateTileOverlap(gridX, gridY, playerLeft, playerTop, playerRight, playerBottom);
				if (overlap > maxOverlap) {
					maxOverlap = overlap;
					bestTileX = gridX;
					bestTileY = gridY;
				}
			}
		}

		this.playerGridX = bestTileX;
		this.playerGridY = bestTileY;
	}

	calculateTileOverlap(gridX: number, gridY: number, playerLeft: number, playerTop: number, playerRight: number, playerBottom: number): number {
		// Convertir la position de grille en coordonnées d'écran
		const tileScreenPos = IsometricUtils.gridToScreen(gridX, gridY);
		const tileLeft = tileScreenPos.x + this.mapOffsetX - IsometricUtils.TILE_WIDTH / 2;
		const tileRight = tileScreenPos.x + this.mapOffsetX + IsometricUtils.TILE_WIDTH / 2;
		const tileTop = tileScreenPos.y + this.mapOffsetY - IsometricUtils.TILE_HEIGHT / 2;
		const tileBottom = tileScreenPos.y + this.mapOffsetY + IsometricUtils.TILE_HEIGHT / 2;

		// Calculer l'intersection entre le joueur et la tile
		const overlapLeft = Math.max(playerLeft, tileLeft);
		const overlapRight = Math.min(playerRight, tileRight);
		const overlapTop = Math.max(playerTop, tileTop);
		const overlapBottom = Math.min(playerBottom, tileBottom);

		// Si il n'y a pas d'intersection, retourner 0
		if (overlapLeft >= overlapRight || overlapTop >= overlapBottom) {
			return 0;
		}

		// Calculer la surface d'intersection
		const overlapArea = (overlapRight - overlapLeft) * (overlapBottom - overlapTop);
		return overlapArea;
	}

	updateDebugText() {
		if (!this.debugText || !this.player) return;

		// Vérifier si le joueur est sur un plan de travail
		const isPlayerOnCounter = this.isoMap?.isCounter(this.playerGridX, this.playerGridY) || false;
		
		let targetX = this.playerGridX + this.lastDirection.x;
		let targetY = this.playerGridY + this.lastDirection.y;
		
		// Si le joueur est sur un plan de travail, la cible est sa propre position
		if (isPlayerOnCounter) {
			targetX = this.playerGridX;
			targetY = this.playerGridY;
		}
		
		const hasCounterAtTarget = this.isoMap?.isCounter(targetX, targetY) || false;
		
		// Debug : afficher les plans de travail disponibles
		const totalCounters = this.isoMap?.getCounterTiles().length || 0;
		
		// Convertir la direction en texte
		let directionText = '';
		if (this.lastDirection.x === 0 && this.lastDirection.y === -1) directionText = 'HAUT';
		else if (this.lastDirection.x === 1 && this.lastDirection.y === 0) directionText = 'DROITE';
		else if (this.lastDirection.x === 0 && this.lastDirection.y === 1) directionText = 'BAS';
		else if (this.lastDirection.x === -1 && this.lastDirection.y === 0) directionText = 'GAUCHE';
		
		// Calculer les limites du joueur pour le debug (utiliser la hitbox réelle)
		const body = this.player.body as Phaser.Physics.Arcade.Body;
		const playerLeft = this.player.x - body.halfWidth;
		const playerRight = this.player.x + body.halfWidth;
		const playerTop = this.player.y - body.halfHeight;
		const playerBottom = this.player.y + body.halfHeight;
		
		this.debugText.setText(
			`Position joueur: (${this.player.x.toFixed(0)}, ${this.player.y.toFixed(0)})\n` +
			`Limites joueur: (${playerLeft.toFixed(0)}, ${playerTop.toFixed(0)}) à (${playerRight.toFixed(0)}, ${playerBottom.toFixed(0)})\n` +
			`Grille (majorité): (${this.playerGridX}, ${this.playerGridY})\n` +
			`Sur plan de travail: ${isPlayerOnCounter ? 'OUI' : 'NON'}\n` +
			`Direction: ${directionText} (${this.lastDirection.x}, ${this.lastDirection.y})\n` +
			`Position cible: (${targetX}, ${targetY})\n` +
			`Plan de travail à la cible: ${hasCounterAtTarget ? 'OUI' : 'NON'}\n` +
			`Plans disponibles: ${totalCounters}`
		);
	}

	updateInventoryDisplay() {
		if (!this.inventoryText) return;

		if (this.inventory.length === 0) {
			this.inventoryText.setText('Inventaire: Vide (max: 1)');
		} else {
			this.inventoryText.setText(`Inventaire: ${this.inventory.join(', ')} (1/1)`);
		}
	}

	updateCarriedItemPosition() {
		if (!this.carriedItem || !this.player) return;

		// Calculer la position de l'objet porté en fonction de la direction du joueur
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
		
		// Positionner l'objet porté
		this.carriedItem.setPosition(this.player.x + offsetX, this.player.y + offsetY);
		
		// La profondeur est maintenant gérée dans updatePlayerDepth()
	}

	updatePlayerSprite(textureKey: string, flipX: boolean = false) {
		if (!this.player) return;
		
		// Changer la texture du sprite
		this.player.setTexture(textureKey);
		
		// Appliquer le retournement horizontal si nécessaire
		this.player.setFlipX(flipX);
		
		// Ajuster la hitbox selon la nouvelle texture
		const body = this.player.body as Phaser.Physics.Arcade.Body;
		const hitboxWidth = this.player.width; // Toute la largeur
		const hitboxHeight = this.player.height * 0.3; // 30% de la hauteur (moitié de 60%)
		
		// Positionner la hitbox au niveau des pieds
		body.setSize(hitboxWidth, hitboxHeight);
		
		// Offset pour positionner la hitbox au bas du sprite, centrée horizontalement
		// Avec origine (0.5, 0.5), offset positif descend vers le bas
		const offsetX = (this.player.width - hitboxWidth) / 2;
		const offsetY = this.player.height * 0.7; // 70% de la hauteur vers le bas
		body.setOffset(offsetX, offsetY);
	}

	interactWithCounter() {
		if (!this.isoMap) return;

		let targetX = this.playerGridX + this.lastDirection.x;
		let targetY = this.playerGridY + this.lastDirection.y;
		
		// Si le joueur est sur un plan de travail, interagir avec ce même plan
		if (this.isoMap.isCounter(this.playerGridX, this.playerGridY)) {
			targetX = this.playerGridX;
			targetY = this.playerGridY;
			console.log(`Joueur sur plan de travail, interaction sur la même position (${targetX}, ${targetY})`);
		}
		
		if (this.isoMap.isCounter(targetX, targetY)) {
			console.log(`Interaction avec le plan de travail à la position (${targetX}, ${targetY})`);
			
			// Vérifier s'il y a un objet sur ce plan de travail
			const hasItem = this.hasItemOnCounter(targetX, targetY);
			
			if (hasItem && this.inventory.length === 0) {
				// Ramasser l'objet (inventaire vide)
				const itemType = this.removeItemFromCounter(targetX, targetY);
				if (itemType) {
					this.inventory.push(itemType);
					this.createCarriedItem(itemType); // Créer l'objet porté visible
					console.log(`Ramassé: ${itemType}`);
				}
			} else if (!hasItem && this.inventory.length > 0) {
				// Poser l'objet (inventaire contient un objet)
				const itemType = this.inventory.pop()!;
				this.placeItemOnCounter(targetX, targetY, itemType);
				this.removeCarriedItem(); // Supprimer l'objet porté visible
				console.log(`Posé: ${itemType}`);
			} else if (hasItem && this.inventory.length > 0) {
				console.log('Inventaire plein (limite: 1 objet), ne peut pas ramasser');
			} else if (hasItem && this.inventory.length === 0) {
				console.log('Erreur: objet détecté mais inventaire vide');
			} else {
				console.log('Aucun objet sur le plan de travail, inventaire vide');
			}
			
			// Effet visuel sur le plan de travail (supprimé pour éviter l'animation lors de la pose)
			// const counterTile = this.isoMap.getCounter(targetX, targetY);
			// if (counterTile) {
			// 	this.tweens.add({
			// 		targets: counterTile,
			// 		alpha: 0.5,
			// 		duration: 200,
			// 		yoyo: true,
			// 		repeat: 1
			// 	});
			// }
		} else {
			console.log(`Aucun plan de travail à la position (${targetX}, ${targetY})`);
		}
	}

	placeItemOnCounter(gridX: number, gridY: number, itemType: string) {
		if (!this.isoMap || !this.isoMap.isCounter(gridX, gridY)) return false;

		const key = `${gridX},${gridY}`;
		
		// Vérifier s'il n'y a pas déjà un objet sur ce plan de travail
		if (this.itemsOnCounters.has(key)) return false;

		// Créer l'objet sur le plan de travail
		const screenPos = IsometricUtils.gridToScreen(gridX, gridY);
		const item = this.add.image(
			screenPos.x + this.mapOffsetX, 
			screenPos.y + this.mapOffsetY, 
			itemType
		);
		item.setOrigin(0.5, 0.5);
		item.setScale(1.2); // Rendre le cookie un peu plus grand
		
		// Positionner l'objet légèrement au-dessus du plan de travail
		item.setDepth(item.y + 100); // Profondeur plus élevée que le plan de travail
		
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
		this.carriedItem = this.add.image(this.player.x + offsetX, this.player.y + offsetY, itemType);
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

	changeScene() {
        this.scene.start('GameOver');
    }

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here

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
		// 1 = herbe, 2 = terre, 3 = eau, 4 = mur (impassable), 0 = vide
		const mapData = [
			[4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
			[4, 1, 2, 2, 1, 1, 1, 3, 3, 4],
			[4, 1, 2, 2, 1, 1, 1, 3, 3, 4],
			[4, 1, 2, 2, 1, 4, 4, 1, 1, 4],
			[4, 1, 1, 1, 1, 4, 4, 1, 1, 4],
			[4, 1, 1, 1, 1, 2, 2, 1, 1, 4],
			[4, 3, 3, 1, 1, 2, 2, 1, 1, 4],
			[4, 3, 3, 1, 1, 1, 1, 1, 1, 4],
			[4, 1, 1, 1, 1, 1, 1, 1, 2, 4],
			[4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
		];

		const tileTextures = {
			1: 'iso-grass',
			2: 'iso-dirt',
			3: 'iso-water',
			4: 'iso-wall'
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

		// Configurer les contrôles
		this.cursors = this.input.keyboard?.createCursorKeys();

		// Texte d'aide
		const helpText = this.add.text(10, 10, 
			'Utilise les flèches pour te déplacer librement\nEspace pour revenir au menu', 
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

		// Touche espace pour retourner au menu
		this.input.keyboard?.on('keydown-SPACE', () => {
			this.changeScene();
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

		// Créer un sprite simple pour le joueur
		const playerGraphics = this.add.graphics();
		playerGraphics.fillStyle(0xFF6B6B, 1);
		playerGraphics.fillCircle(24, 32, 16);
		playerGraphics.fillStyle(0xFFFFFF, 1);
		playerGraphics.fillCircle(18, 26, 4);
		playerGraphics.fillCircle(30, 26, 4);
		playerGraphics.generateTexture('iso-player', 48, 64);
		playerGraphics.destroy();
	}

	createPlayer() {
		// Positionner le joueur au centre de la carte (case 5,5)
		const startX = this.mapOffsetX + 5 * IsometricUtils.TILE_WIDTH + IsometricUtils.TILE_WIDTH / 2;
		const startY = this.mapOffsetY + 5 * IsometricUtils.TILE_HEIGHT + IsometricUtils.TILE_HEIGHT / 2;
		
		// Créer un sprite avec physique
		this.player = this.physics.add.sprite(startX, startY, 'iso-player');
		this.player.setOrigin(0.5, 0.75);
		
		// Configurer la hitbox (zone de collision)
		const body = this.player.body as Phaser.Physics.Arcade.Body;
		
		// Le personnage visuel est un cercle centré à (24, 32) avec rayon 16px
		// On crée une hitbox circulaire qui correspond au cercle visible
		const hitboxRadius = 14; // Un peu plus petit que le cercle visuel (16px)
		body.setCircle(
			hitboxRadius,           // Rayon de 14 pixels
			24 - hitboxRadius,      // Offset X : 24 - 14 = 10 (pour centrer sur le cercle)
			32 - hitboxRadius       // Offset Y : 32 - 14 = 18 (pour centrer sur le cercle)
		);
		
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
		const mapRight = this.mapOffsetX + this.mapWidth * IsometricUtils.TILE_WIDTH - tileHalfWidth;
		const mapTop = this.mapOffsetY - tileHalfHeight;
		const mapBottom = this.mapOffsetY + this.mapHeight * IsometricUtils.TILE_HEIGHT - tileHalfHeight;

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
		}
	}

	update(time: number, delta: number) {
		if (!this.cursors || !this.player) return;

		let velocityX = 0;
		let velocityY = 0;

		// Déplacement fluide avec les flèches
		if (this.cursors.up!.isDown) {
			velocityY = -this.playerSpeed;
		} else if (this.cursors.down!.isDown) {
			velocityY = this.playerSpeed;
		}

		if (this.cursors.left!.isDown) {
			velocityX = -this.playerSpeed;
		} else if (this.cursors.right!.isDown) {
			velocityX = this.playerSpeed;
		}

		// Normaliser la vitesse en diagonale (utilise la constante précalculée)
		if (velocityX !== 0 && velocityY !== 0) {
			velocityX *= this.DIAGONAL_FACTOR;
			velocityY *= this.DIAGONAL_FACTOR;
		}

		// Appliquer la vélocité (la physique gère les collisions)
		this.player.setVelocity(velocityX, velocityY);

		// Mettre à jour la profondeur seulement si Y a changé
		if (this.player.y !== this.lastPlayerY) {
			this.updatePlayerDepth();
		}
	}

	changeScene() {
		this.scene.start('GameOver');
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here

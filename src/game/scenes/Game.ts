/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { EventBus } from '../EventBus';
import { IsometricMap, IsometricUtils } from '../utils/IsometricUtils';
/* END-USER-IMPORTS */

export default class Game extends Phaser.Scene {
	private isoMap?: IsometricMap;
	private player?: Phaser.GameObjects.Sprite;
	private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
	private playerSpeed: number = 150; // Pixels par seconde
	private mapOffsetX: number = 272;
	private mapOffsetY: number = 144;
	
	// Précalcul des constantes pour optimisation
	private readonly DIAGONAL_FACTOR = Math.SQRT2 / 2; // ~0.707
	private minX: number = 0;
	private maxX: number = 0;
	private minY: number = 0;
	private maxY: number = 0;
	private lastPlayerY: number = 0;

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
		// 1 = herbe, 2 = terre, 3 = eau, 0 = vide
		const mapData = [
			[1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
			[1, 2, 2, 2, 1, 1, 1, 3, 3, 1],
			[1, 2, 2, 2, 1, 1, 1, 3, 3, 1],
			[1, 2, 2, 2, 1, 1, 1, 1, 1, 1],
			[1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
			[1, 1, 1, 1, 1, 2, 2, 1, 1, 1],
			[1, 3, 3, 1, 1, 2, 2, 1, 1, 1],
			[1, 3, 3, 1, 1, 1, 1, 1, 1, 1],
			[1, 1, 1, 1, 1, 1, 1, 1, 2, 1],
			[1, 1, 1, 1, 1, 1, 1, 1, 2, 1],
		];

		const tileTextures = {
			1: 'iso-grass',
			2: 'iso-dirt',
			3: 'iso-water'
		};

		// Créer la carte directement avec l'offset
		this.isoMap.createMap(mapData, tileTextures, this.mapOffsetX, this.mapOffsetY);

		// Créer le joueur
		this.createPlayer();

		// Calculer les limites une seule fois
		this.minX = this.mapOffsetX + IsometricUtils.TILE_WIDTH / 2;
		this.maxX = this.mapOffsetX + 10 * IsometricUtils.TILE_WIDTH - IsometricUtils.TILE_WIDTH / 2;
		this.minY = this.mapOffsetY + IsometricUtils.TILE_HEIGHT / 2;
		this.maxY = this.mapOffsetY + 10 * IsometricUtils.TILE_HEIGHT - IsometricUtils.TILE_HEIGHT / 2;

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
		
		this.player = this.add.sprite(startX, startY, 'iso-player');
		this.player.setOrigin(0.5, 0.75);
		this.lastPlayerY = startY;
		this.updatePlayerDepth();
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

		// Calculer la vitesse en fonction du delta time (pour un mouvement fluide)
		const speed = this.playerSpeed * (delta / 1000);
		
		let velocityX = 0;
		let velocityY = 0;

		// Déplacement fluide avec les flèches
		if (this.cursors.up!.isDown) {
			velocityY = -speed;
		} else if (this.cursors.down!.isDown) {
			velocityY = speed;
		}

		if (this.cursors.left!.isDown) {
			velocityX = -speed;
		} else if (this.cursors.right!.isDown) {
			velocityX = speed;
		}

		// Normaliser la vitesse en diagonale (utilise la constante précalculée)
		if (velocityX !== 0 && velocityY !== 0) {
			velocityX *= this.DIAGONAL_FACTOR;
			velocityY *= this.DIAGONAL_FACTOR;
		}

		// Calculer et appliquer la nouvelle position (avec limites précalculées)
		this.player.x = Phaser.Math.Clamp(this.player.x + velocityX, this.minX, this.maxX);
		this.player.y = Phaser.Math.Clamp(this.player.y + velocityY, this.minY, this.maxY);

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

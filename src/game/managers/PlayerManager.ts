import Phaser from "phaser";
import { IsometricUtils } from "../utils/IsometricUtils";

/**
 * Gestionnaire du joueur : mouvement, sprites, position, profondeur
 */
export class PlayerManager {
    private scene: Phaser.Scene;
    private player?: Phaser.Physics.Arcade.Sprite;
    private playerSpeed: number = 150; // Pixels par seconde
    private readonly DIAGONAL_FACTOR = Math.SQRT2 / 2; // ~0.707
    private lastPlayerY: number = 0;
    private playerGridX: number = 2; // Position en grille du joueur
    private playerGridY: number = 2;
    private lastDirection: { x: number; y: number } = { x: 0, y: 1 }; // Direction actuelle du joueur (par défaut vers le bas)
    private mapOffsetX: number;
    private mapOffsetY: number;


    constructor(scene: Phaser.Scene, mapOffsetX: number, mapOffsetY: number) {
        this.scene = scene;
        this.mapOffsetX = mapOffsetX;
        this.mapOffsetY = mapOffsetY;
    }

    /**
     * Crée le joueur à la position initiale
     */
    createPlayer(
        startGridX: number = 2,
        startGridY: number = 2
    ): Phaser.Physics.Arcade.Sprite {
        // Positionner le joueur sur un tile d'herbe (case 2,2) pour éviter les bordures
        const startX =
            this.mapOffsetX +
            startGridX * IsometricUtils.TILE_WIDTH +
            IsometricUtils.TILE_WIDTH / 2;
        const startY =
            this.mapOffsetY +
            startGridY * IsometricUtils.TILE_HEIGHT +
            IsometricUtils.TILE_HEIGHT / 2 -
            12; // -12 pour compenser le changement d'origine

        // Créer un sprite avec physique (grand-mère de face par défaut)
        this.player = this.scene.physics.add.sprite(
            startX,
            startY,
            "grandma-front"
        );
        this.player.setOrigin(0.5, 0.5); // Centré pour la rotation

        // Configurer la hitbox (zone de collision)
        const body = this.player.body as Phaser.Physics.Arcade.Body;

        // Hitbox rectangulaire adaptée aux sprites de grand-mère
        const hitboxWidth = this.player.width;
        const hitboxHeight = this.player.height * 0.3; // 30% de la hauteur

        // Positionner la hitbox au niveau des pieds
        body.setSize(hitboxWidth, hitboxHeight);

        // Offset pour positionner la hitbox au bas du sprite, centrée horizontalement
        const offsetX = (this.player.width - hitboxWidth) / 2;
        const offsetY = this.player.height * 0.7; // 70% de la hauteur vers le bas
        body.setOffset(offsetX, offsetY);

        this.lastPlayerY = startY;
        this.playerGridX = startGridX;
        this.playerGridY = startGridY;
        this.updatePlayerDepth();

        return this.player;
    }

    /**
     * Met à jour le mouvement du joueur basé sur les contrôles
     */
    updateMovement(cursors: Phaser.Types.Input.Keyboard.CursorKeys): void {
        if (!this.player) return;

        let velocityX = 0;
        let velocityY = 0;

        // Déplacement fluide avec les flèches
        if (cursors.up!.isDown) {
            velocityY = -this.playerSpeed;
            this.lastDirection = { x: 0, y: -1 }; // Haut
            this.updatePlayerSprite("grandma-back", false); // Vue de dos
        } else if (cursors.down!.isDown) {
            velocityY = this.playerSpeed;
            this.lastDirection = { x: 0, y: 1 }; // Bas
            this.updatePlayerSprite("grandma-front", false); // Vue de face
        }

        if (cursors.left!.isDown) {
            velocityX = -this.playerSpeed;
            this.lastDirection = { x: -1, y: 0 }; // Gauche
            this.updatePlayerSprite("grandma-side", true); // Vue de côté (gauche, retournée)
        } else if (cursors.right!.isDown) {
            velocityX = this.playerSpeed;
            this.lastDirection = { x: 1, y: 0 }; // Droite
            this.updatePlayerSprite("grandma-side", false); // Vue de côté (droite, normale)
        }

        // Normaliser la vitesse en diagonale
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= this.DIAGONAL_FACTOR;
            velocityY *= this.DIAGONAL_FACTOR;
        }

        // Appliquer la vélocité
        this.player.setVelocity(velocityX, velocityY);
    }

    /**
     * Met à jour la position en grille du joueur
     */
    updateGridPosition(): void {
        if (!this.player) return;

        const body = this.player.body as Phaser.Physics.Arcade.Body;

        // Utiliser le centre de la hitbox pour une détection plus stable
        const centerX = body.center.x;
        const centerY = body.center.y;

        // Convertir la position du centre en coordonnées de grille
        const gridPos = IsometricUtils.screenToGrid(
            centerX - this.mapOffsetX,
            centerY - this.mapOffsetY
        );

        const newGridX = gridPos.x;
        const newGridY = gridPos.y;

        this.playerGridX = newGridX;
        this.playerGridY = newGridY;
    }

    /**
     * Met à jour la profondeur du joueur pour le rendu isométrique
     */
    updatePlayerDepth(carriedItem?: Phaser.GameObjects.Image): void {
        if (!this.player) return;

        // Utiliser directement la position Y du joueur
        this.player.setDepth(this.player.y * 10 + 5);
        this.lastPlayerY = this.player.y;

        // Mettre à jour la profondeur de l'objet porté
        if (carriedItem) {
            if (this.lastDirection.y === -1) {
                carriedItem.setDepth(this.player.depth - 1); // Derrière (vers le haut)
            } else {
                carriedItem.setDepth(this.player.depth + 1); // Devant (autres directions)
            }
        }
    }

    /**
     * Met à jour le sprite du joueur selon la direction
     */
    private updatePlayerSprite(
        textureKey: string,
        flipX: boolean = false
    ): void {
        if (!this.player) return;

        // Changer la texture du sprite
        this.player.setTexture(textureKey);

        // Appliquer le retournement horizontal si nécessaire
        this.player.setFlipX(flipX);

        // Ajuster la hitbox selon la nouvelle texture
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        const hitboxWidth = this.player.width;
        const hitboxHeight = this.player.height * 0.3;

        body.setSize(hitboxWidth, hitboxHeight);

        const offsetX = (this.player.width - hitboxWidth) / 2;
        const offsetY = this.player.height * 0.7;
        body.setOffset(offsetX, offsetY);
    }

    // Getters
    getPlayer(): Phaser.Physics.Arcade.Sprite | undefined {
        return this.player;
    }

    getPlayerGridX(): number {
        return this.playerGridX;
    }

    getPlayerGridY(): number {
        return this.playerGridY;
    }

    getLastDirection(): { x: number; y: number } {
        return this.lastDirection;
    }

    hasPlayerMoved(): boolean {
        return this.player ? this.player.y !== this.lastPlayerY : false;
    }
}


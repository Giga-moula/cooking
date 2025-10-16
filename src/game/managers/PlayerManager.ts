import Phaser from "phaser";
import { IsometricUtils } from "../utils/IsometricUtils";
import { ControlsManager, PlayerControls } from "../actions/ControlsManager";
import { InventoryManager } from "./InventoryManager";
import { GameConfig } from "../config/GameConfig";
import { CraftActions, type CraftDirection } from "../actions/CraftActions";

/**
 * Gestionnaire du joueur : mouvement, sprites, position, profondeur
 */
export class PlayerManager {
    private scene: Phaser.Scene;

    private player?: Phaser.Physics.Arcade.Sprite;
    private playerColor: string = GameConfig.COLORS.PLAYER_1; // Couleur par défaut
    private playerNumber: number; // 1 ou 2
    private baseSpeed: number = GameConfig.PLAYER_SPEED;
    private playerSpeed: number = GameConfig.PLAYER_SPEED;
    private speedMultiplier: number = 1.0;
    private readonly DIAGONAL_FACTOR = Math.SQRT2 / 2; // ~0.707
    private lastPlayerY: number = 0;
    private playerGridX: number = GameConfig.PLAYER_START_POSITIONS.PLAYER_1.x;
    private playerGridY: number = GameConfig.PLAYER_START_POSITIONS.PLAYER_1.y;
    private lastDirection: { x: number; y: number } = { x: 0, y: 1 }; // Direction actuelle du joueur (par défaut vers le bas)
    private mapOffsetX: number;
    private mapOffsetY: number;
    private movementEnabled: boolean = true; // Contrôle si le joueur peut bouger

    private controls: PlayerControls;

    private inventory: InventoryManager;
    private craftActions: CraftActions;

    constructor(
        scene: Phaser.Scene,
        mapOffsetX: number,
        mapOffsetY: number,
        playerNumber: number
    ) {
        this.scene = scene;
        this.mapOffsetX = mapOffsetX;
        this.mapOffsetY = mapOffsetY;
        this.playerNumber = playerNumber;
        this.controls = this.initializeControls(playerNumber);
        this.inventory = new InventoryManager(scene);
        // CraftActions sera initialisé plus tard via setMapManager
        this.craftActions = null as any;

        if (playerNumber === 1) {
            this.playerColor = GameConfig.COLORS.PLAYER_1;
            this.playerGridX = GameConfig.PLAYER_START_POSITIONS.PLAYER_1.x;
            this.playerGridY = GameConfig.PLAYER_START_POSITIONS.PLAYER_1.y;
        } else {
            this.playerColor = GameConfig.COLORS.PLAYER_2;
            this.playerGridX = GameConfig.PLAYER_START_POSITIONS.PLAYER_2.x;
            this.playerGridY = GameConfig.PLAYER_START_POSITIONS.PLAYER_2.y;
        }
    }

    private initializeControls(playerNumber: number): PlayerControls {
        const controlsManager = new ControlsManager(this.scene);
        if (playerNumber === 1) {
            return controlsManager.getPlayer1Controls();
        } else {
            return controlsManager.getPlayer2Controls();
        }
    }

    update(): void {
        this.handleMovement();
        this.updateGridPosition();
        this.updateCarriedItemPosition();
        this.updatePlayerDepth();
        this.handleCraftActions();
    }

    /**
     * Vérifie si la touche d'interaction vient d'être pressée
     * Utilise JustDown pour éviter les répétitions
     */
    public isInteractionPressed(): boolean {
        return Phaser.Input.Keyboard.JustDown(this.controls.interactKey);
    }

    /**
     * Vérifie si la touche de transformation vient d'être pressée
     * Utilise JustDown pour éviter les répétitions
     */
    public isTransformPressed(): boolean {
        return Phaser.Input.Keyboard.JustDown(this.controls.craftKey);
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
            `${this.playerColor}-grandma-front`
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

    handleMovement(): void {
        if (!this.player || !this.movementEnabled) return;

        let velocityX = 0;
        let velocityY = 0;

        if (this.controls.upKey.isDown) {
            velocityY = -this.playerSpeed;
            this.lastDirection = { x: 0, y: -1 };
            this.updatePlayerSprite(`${this.playerColor}-grandma-back`, false);
        } else if (this.controls.downKey.isDown) {
            velocityY = this.playerSpeed;
            this.lastDirection = { x: 0, y: 1 };
            this.updatePlayerSprite(`${this.playerColor}-grandma-front`, false);
        }

        if (this.controls.leftKey.isDown) {
            velocityX = -this.playerSpeed;
            this.lastDirection = { x: -1, y: 0 };
            this.updatePlayerSprite(`${this.playerColor}-grandma-side`, true);
        } else if (this.controls.rightKey.isDown) {
            velocityX = this.playerSpeed;
            this.lastDirection = { x: 1, y: 0 };
            this.updatePlayerSprite(`${this.playerColor}-grandma-side`, false);
        }

        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= this.DIAGONAL_FACTOR;
            velocityY *= this.DIAGONAL_FACTOR;
        }

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
    updatePlayerDepth(): void {
        if (!this.player) return;

        // Utiliser directement la position Y du joueur
        this.player.setDepth(this.player.y * 10 + 5);
        this.lastPlayerY = this.player.y;

        // Mettre à jour la profondeur de l'objet porté
        const carriedItem = this.inventory.getCarriedItem();
        if (carriedItem) {
            if (this.lastDirection.y === -1) {
                carriedItem.setDepth(this.player.depth - 1); // Derrière (vers le haut)
            } else {
                carriedItem.setDepth(this.player.depth + 1); // Devant (autres directions)
            }
        }
    }

    /**
     * Met à jour la position de l'objet porté
     */
    private updateCarriedItemPosition(): void {
        if (!this.player || !this.inventory) return;

        const carriedItem = this.inventory.getCarriedItem();
        if (carriedItem) {
            this.inventory.updateCarriedItemPosition(
                this.player.x,
                this.player.y,
                this.lastDirection
            );
        }
    }

    /**
     * Met à jour l'objet porté (crée ou détruit selon l'inventaire)
     */
    public updateCarriedItem(): void {
        if (!this.player || !this.inventory) return;

        const item = this.inventory.peekItem();
        if (item) {
            this.inventory.createCarriedItem(
                item,
                this.player.x,
                this.player.y,
                this.lastDirection,
                this.player.depth
            );
        }
    }

    /**
     * Supprime l'objet porté visuellement
     */
    public removeCarriedItem(): void {
        if (!this.inventory) return;
        this.inventory.removeCarriedItem();
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

    getInventory(): InventoryManager {
        return this.inventory;
    }

    /**
     * Applique un multiplicateur de vitesse (depuis les upgrades)
     */
    applySpeedMultiplier(multiplier: number): void {
        this.speedMultiplier = multiplier;
        this.playerSpeed = this.baseSpeed * this.speedMultiplier;
    }

    getPlayerNumber(): number {
        return this.playerNumber;
    }

    getPlayerColor(): string {
        return this.playerColor;
    }

    /**
     * Calcule la position cible devant le joueur (basée sur la dernière direction)
     */
    getTargetPosition(): { x: number; y: number } {
        return {
            x: this.playerGridX + this.lastDirection.x,
            y: this.playerGridY + this.lastDirection.y,
        };
    }
    /**
     * Définit la position en grille du joueur
     */
    setGridPosition(gridX: number, gridY: number): void {
        this.playerGridX = gridX;
        this.playerGridY = gridY;
    }

    /**
     * Gère les actions de craft (affichage et input)
     */
    private handleCraftActions(): void {
        if (!this.craftActions) return; // S'assurer que craftActions est initialisé

        // Vérifier si la touche craft est maintenue
        if (this.controls.craftKey.isDown) {
            if (!this.craftActions.isActive()) {
                this.craftActions.startCrafting();
            } else {
                // Mettre à jour la position de l'interface
                this.craftActions.updatePosition();

                // Vérifier les inputs de direction pour le craft
                if (Phaser.Input.Keyboard.JustDown(this.controls.craftUpKey)) {
                    this.craftActions.processDirectionInput("up");
                } else if (
                    Phaser.Input.Keyboard.JustDown(this.controls.craftDownKey)
                ) {
                    this.craftActions.processDirectionInput("down");
                } else if (
                    Phaser.Input.Keyboard.JustDown(this.controls.craftLeftKey)
                ) {
                    this.craftActions.processDirectionInput("left");
                } else if (
                    Phaser.Input.Keyboard.JustDown(this.controls.craftRightKey)
                ) {
                    this.craftActions.processDirectionInput("right");
                }
            }
        } else {
            // Arrêter le craft si la touche n'est plus maintenue
            if (this.craftActions.isActive()) {
                this.craftActions.stopCrafting();
            }
        }
    }

    /**
     * Récupère l'instance CraftActions (pour debug ou usage externe)
     */
    public getCraftActions(): CraftActions | null {
        return this.craftActions;
    }

    /**
     * Active ou désactive le mouvement du joueur
     */
    setMovementEnabled(enabled: boolean): void {
        this.movementEnabled = enabled;
    }

    /**
     * Définit la référence vers le MapManager
     */
    setMapManager(mapManager: any): void {
        // Recréer l'instance de CraftActions avec le MapManager
        this.craftActions = new CraftActions(
            this.scene,
            this,
            this.playerNumber,
            mapManager
        );
    }
}

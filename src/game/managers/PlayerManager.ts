import Phaser from "phaser";
import { ControlsManager, PlayerControls } from "../actions/ControlsManager";
import { CraftActions } from "../actions/CraftActions";
import { DashAction } from "../actions/dashAction";
import {
    DEPTH_CONSTANTS,
    PHYSICS_CONSTANTS,
    PLAYER_OFFSET,
} from "../config/Constants";
import { GameConfig } from "../config/GameConfig";
import { IMapManager } from "../types/interfaces";
import { IsometricUtils } from "../utils/IsometricUtils";
import { Logger } from "../utils/Logger";
import { ActionSoundManager } from "./ActionSoundManager";
import { InventoryManager } from "./InventoryManager";

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
    private readonly DIAGONAL_FACTOR =
        PHYSICS_CONSTANTS.DIAGONAL_MOVEMENT_FACTOR;
    private lastPlayerY: number = 0;
    private playerGridX: number = GameConfig.PLAYER_START_POSITIONS.PLAYER_1.x;
    private playerGridY: number = GameConfig.PLAYER_START_POSITIONS.PLAYER_1.y;
    private lastDirection: { x: number; y: number } = { x: 0, y: 1 }; // Direction actuelle du joueur (par défaut vers le bas)
    private mapOffsetX: number;
    private mapOffsetY: number;
    private movementEnabled: boolean = true; // Contrôle si le joueur peut bouger
    private hasSkates: boolean = false; // Indique si le joueur utilise les skates

    private controls: PlayerControls;

    private inventory: InventoryManager;
    private craftActions: CraftActions | null = null;
    private dashAction: DashAction;
    private actionSoundManager: ActionSoundManager | null = null;

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
        this.dashAction = new DashAction(scene, this);
        // CraftActions sera initialisé plus tard via setMapManager

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
        this.handleDashInput();
        this.dashAction.update();
        this.applyDashTilt();
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
            IsometricUtils.TILE_HEIGHT / 2 +
            PLAYER_OFFSET.Y_ADJUSTMENT; // Compensation pour le changement d'origine

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
        const hitboxHeight =
            this.player.height * PHYSICS_CONSTANTS.HITBOX_HEIGHT_RATIO;

        // Positionner la hitbox au niveau des pieds
        body.setSize(hitboxWidth, hitboxHeight);

        // Offset pour positionner la hitbox au bas du sprite, centrée horizontalement
        const offsetX = (this.player.width - hitboxWidth) / 2;
        const offsetY =
            this.player.height * PHYSICS_CONSTANTS.HITBOX_OFFSET_RATIO;
        body.setOffset(offsetX, offsetY);

        this.lastPlayerY = startY;
        this.playerGridX = startGridX;
        this.playerGridY = startGridY;
        this.updatePlayerDepth();

        return this.player;
    }

    handleMovement(): void {
        if (!this.player || !this.movementEnabled || this.isDashing()) return;

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
    public updateGridPosition(): void {
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
    public updatePlayerDepth(): void {
        if (!this.player) return;

        // Utiliser directement la position Y du joueur
        this.player.setDepth(
            this.player.y * DEPTH_CONSTANTS.PLAYER_DEPTH_MULTIPLIER +
                DEPTH_CONSTANTS.PLAYER_DEPTH_OFFSET
        );
        this.lastPlayerY = this.player.y;

        // Mettre à jour la profondeur de l'objet porté
        const carriedItem = this.inventory.getCarriedItem();
        if (carriedItem) {
            if (this.lastDirection.y === -1) {
                carriedItem.setDepth(
                    this.player.depth +
                        DEPTH_CONSTANTS.CARRIED_ITEM_OFFSET_BEHIND
                ); // Derrière (vers le haut)
            } else {
                carriedItem.setDepth(
                    this.player.depth +
                        DEPTH_CONSTANTS.CARRIED_ITEM_OFFSET_FRONT
                ); // Devant (autres directions)
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

        // Utiliser l'état hasSkates pour déterminer le sprite à utiliser
        let currentTextureKey = textureKey;

        if (this.hasSkates) {
            // Si le joueur a les skates, utiliser les sprites avec skate
            const direction = textureKey.split("-").pop(); // Extraire 'front', 'back', ou 'side'

            switch (direction) {
                case "back":
                    currentTextureKey = `skating-grandma-${this.playerColor}-back`;
                    break;
                case "side":
                    currentTextureKey = `skating-grandma-${this.playerColor}-side`;
                    break;
                case "front":
                default:
                    currentTextureKey = `skating-grandma-${this.playerColor}-front`;
                    break;
            }
        } else {
            // Utiliser la texture normale passée en paramètre
            currentTextureKey = textureKey;
        }

        // Changer la texture du sprite
        this.player.setTexture(currentTextureKey);

        // Appliquer le retournement horizontal
        if (this.hasSkates) {
            // Pour les sprites avec skate, appliquer le flip seulement pour les côtés
            if (currentTextureKey.includes("-side")) {
                this.player.setFlipX(flipX);
            } else {
                this.player.setFlipX(false); // Pas de flip pour front/back avec skate
            }
        } else {
            // Pour les sprites normaux, appliquer le flip normalement
            this.player.setFlipX(flipX);
        }

        // Ajuster la hitbox selon la nouvelle texture
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        const hitboxWidth = this.player.width;
        const hitboxHeight =
            this.player.height * PHYSICS_CONSTANTS.HITBOX_HEIGHT_RATIO;

        body.setSize(hitboxWidth, hitboxHeight);

        const offsetX = (this.player.width - hitboxWidth) / 2;
        const offsetY =
            this.player.height * PHYSICS_CONSTANTS.HITBOX_OFFSET_RATIO;
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

    /**
     * Change le skin du joueur en fonction des upgrades
     */
    changeSkin(skinType: string | null): void {
        if (!this.player) return;

        const previousHasSkates = this.hasSkates;

        // Mettre à jour l'état des skates
        this.hasSkates = skinType === "speed_boost";

        // Si l'état a changé, forcer la mise à jour du sprite
        if (previousHasSkates !== this.hasSkates) {
            let newTextureKey = "";

            if (this.hasSkates) {
                // Utiliser les sprites avec skate selon la couleur du joueur
                const currentTexture = this.player.texture.key;

                // Déterminer la direction actuelle
                if (currentTexture.includes("back")) {
                    newTextureKey = `skating-grandma-${this.playerColor}-back`;
                } else if (currentTexture.includes("side")) {
                    newTextureKey = `skating-grandma-${this.playerColor}-side`;
                } else {
                    newTextureKey = `skating-grandma-${this.playerColor}-front`;
                }
            } else {
                // Retour aux sprites normaux
                const normalColor =
                    this.playerNumber === 1
                        ? GameConfig.COLORS.PLAYER_1
                        : GameConfig.COLORS.PLAYER_2;
                this.playerColor = normalColor;

                // Construire la texture normale selon la direction actuelle
                const currentTexture = this.player.texture.key;
                if (
                    currentTexture.includes("back") ||
                    currentTexture.includes("skating")
                ) {
                    newTextureKey = `${this.playerColor}-grandma-back`;
                } else if (
                    currentTexture.includes("side") ||
                    currentTexture.includes("skating")
                ) {
                    newTextureKey = `${this.playerColor}-grandma-side`;
                } else {
                    newTextureKey = `${this.playerColor}-grandma-front`;
                }
            }

            // Appliquer le nouveau sprite
            if (newTextureKey) {
                const wasFlipped = this.player.flipX;
                this.player.setTexture(newTextureKey);

                // Gestion du flip selon le type de sprite
                if (this.hasSkates) {
                    // Pour les sprites avec skate, conserver le flip seulement pour les côtés
                    if (newTextureKey.includes("-side")) {
                        this.player.setFlipX(wasFlipped);
                    } else {
                        this.player.setFlipX(false);
                    }
                } else {
                    // Pour les sprites normaux, conserver l'état de flip
                    this.player.setFlipX(wasFlipped);
                }

                Logger.debug(
                    `Skin changed to: ${newTextureKey}, hasSkates: ${this.hasSkates}`
                );
            }
        }
    }

    getPlayerNumber(): number {
        return this.playerNumber;
    }

    getPlayerColor(): string {
        return this.playerColor;
    }

    /**
     * Récupère les contrôles du joueur
     */
    getControls(): PlayerControls {
        return this.controls;
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
     * Définit la référence vers l'ActionSoundManager
     */
    setActionSoundManager(actionSoundManager: ActionSoundManager): void {
        Logger.debug(
            `🎵 PlayerManager ${this.playerNumber}: Configuration de l'ActionSoundManager`,
            actionSoundManager
        );
        this.actionSoundManager = actionSoundManager;
        // Si CraftActions existe déjà, lui passer l'ActionSoundManager
        if (this.craftActions) {
            Logger.debug(
                `🎵 PlayerManager ${this.playerNumber}: Passage de l'ActionSoundManager à CraftActions`
            );
            this.craftActions.setActionSoundManager(actionSoundManager);
        }
    }

    /**
     * Définit la référence vers le MapManager
     */
    setMapManager(mapManager: IMapManager): void {
        // Recréer l'instance de CraftActions avec le MapManager
        this.craftActions = new CraftActions(
            this.scene,
            this,
            this.playerNumber,
            mapManager,
            this.actionSoundManager
        );

        // Si l'ActionSoundManager n'était pas encore défini, le passer maintenant
        if (this.actionSoundManager && this.craftActions) {
            Logger.debug(
                `🎵 PlayerManager ${this.playerNumber}: Passage de l'ActionSoundManager à CraftActions après création`
            );
            this.craftActions.setActionSoundManager(this.actionSoundManager);
        }

        // Passer la référence du MapManager au DashAction
        this.dashAction.setMapManager(mapManager);
    }

    /**
     * Gère l'input du dash
     */
    private handleDashInput(): void {
        if (this.controls.dashKey) {
            this.dashAction.handleDashInput(this.controls.dashKey);
        }
    }

    /**
     * Récupère l'instance DashAction (pour debug ou usage externe)
     */
    public getDashAction(): DashAction {
        return this.dashAction;
    }

    /**
     * Applique l'effet d'inclinaison pour le dash avec skate
     */
    public applyDashTilt(): void {
        if (!this.player || !this.hasSkates) return;

        if (this.isDashing()) {
            const currentTexture = this.player.texture.key;
            const direction = this.lastDirection;

            // Appliquer l'inclinaison seulement pour les sprites côté avec skate
            if (
                currentTexture.includes("skating-grandma") &&
                currentTexture.includes("-side")
            ) {
                if (direction.x > 0) {
                    // Mouvement vers la droite : incliner vers l'avant-droite
                    this.player.setRotation(-0.5); // -8.6 degrés
                } else if (direction.x < 0) {
                    // Mouvement vers la gauche : incliner vers l'avant-gauche
                    this.player.setRotation(0.5); // 8.6 degrés
                }
            }
        } else {
            // Remettre à zéro la rotation quand le dash est terminé
            this.player.setRotation(0);
        }
    }

    /**
     * Vérifie si le joueur est actuellement en train de dasher
     */
    public isDashing(): boolean {
        return this.dashAction.isDashActive();
    }
}


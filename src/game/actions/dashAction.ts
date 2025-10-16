import Phaser from "phaser";
import { PHYSICS_CONSTANTS } from "../config/Constants";
import { IsometricUtils } from "../utils/IsometricUtils";

export interface DashConfig {
    speed: number; // Vitesse du dash (au lieu de distance)
    duration: number; // Durée du dash
    cooldown: number; // Temps de recharge
}

export class DashAction {
    private scene: Phaser.Scene;
    private playerManager: any; // Référence au PlayerManager
    private mapManager?: any; // Référence au MapManager

    // Configuration du dash
    private readonly dashConfig: DashConfig = {
        speed: 300, // Vitesse du dash en pixels/seconde
        duration: 300, // Durée du dash en millisecondes
        cooldown: 500, // Temps de recharge en millisecondes
    };

    // État du dash
    private isDashing: boolean = false;
    private lastDashTime: number = 0;
    private dashDirection: { x: number; y: number } = { x: 0, y: 0 };
    private dashStartTime: number = 0;
    private smokeTrail: Phaser.GameObjects.Sprite[] = [];
    private smokeTimer?: Phaser.Time.TimerEvent;

    constructor(scene: Phaser.Scene, playerManager: any) {
        this.scene = scene;
        this.playerManager = playerManager;
    }

    /**
     * Définit la référence vers le MapManager
     */
    public setMapManager(mapManager: any): void {
        this.mapManager = mapManager;
    }

    /**
     * Vérifie si le dash peut être utilisé
     */
    public canDash(): boolean {
        // Ne peut pas dash si déjà en cours de dash
        if (this.isDashing) {
            return false;
        }

        // Vérifier le cooldown
        const currentTime = this.scene.time.now;
        if (currentTime - this.lastDashTime < this.dashConfig.cooldown) {
            return false;
        }

        // Vérifier si le craft est actif
        const craftActions = this.playerManager.getCraftActions();
        if (craftActions && craftActions.isActive()) {
            return false;
        }

        return true;
    }

    /**
     * Calcule la direction actuelle du dash basée sur les touches pressées
     */
    private getCurrentDashDirection(): { x: number; y: number } {
        // Récupérer les contrôles du joueur
        const controls = this.playerManager.getControls();
        if (!controls) {
            return { x: 0, y: 0 };
        }

        let directionX = 0;
        let directionY = 0;

        // Vérifier les touches directionnelles
        if (controls.upKey && controls.upKey.isDown) {
            directionY = -1;
        } else if (controls.downKey && controls.downKey.isDown) {
            directionY = 1;
        }

        if (controls.leftKey && controls.leftKey.isDown) {
            directionX = -1;
        } else if (controls.rightKey && controls.rightKey.isDown) {
            directionX = 1;
        }

        return { x: directionX, y: directionY };
    }

    /**
     * Exécute le dash dans la direction actuelle (peut être diagonale)
     */
    public executeDash(): boolean {
        if (!this.canDash()) {
            return false;
        }

        const player = this.playerManager.getPlayer();
        if (!player) {
            return false;
        }

        // Calculer la direction du dash basée sur les touches actuellement pressées
        const dashDirection = this.getCurrentDashDirection();
        if (dashDirection.x === 0 && dashDirection.y === 0) {
            // Aucune direction détectée, utiliser la dernière direction
            dashDirection.x = this.playerManager.getLastDirection().x;
            dashDirection.y = this.playerManager.getLastDirection().y;
        }

        // Marquer le début du dash
        this.isDashing = true;
        this.lastDashTime = this.scene.time.now;
        this.dashStartTime = this.scene.time.now;
        this.dashDirection = { ...dashDirection };

        // Désactiver le mouvement normal pendant le dash
        this.playerManager.setMovementEnabled(false);

        // Commencer la traînée de fumée
        this.startSmokeTrail();

        // Normaliser la vitesse pour les mouvements diagonaux
        let dashVelocityX = this.dashDirection.x * this.dashConfig.speed;
        let dashVelocityY = this.dashDirection.y * this.dashConfig.speed;

        // Si c'est un mouvement diagonal, appliquer le facteur de normalisation
        if (this.dashDirection.x !== 0 && this.dashDirection.y !== 0) {
            const diagonalFactor = PHYSICS_CONSTANTS.DIAGONAL_MOVEMENT_FACTOR;
            dashVelocityX *= diagonalFactor;
            dashVelocityY *= diagonalFactor;
        }

        player.setVelocity(dashVelocityX, dashVelocityY);

        // Créer l'effet visuel du dash
        this.createDashEffect(player, dashDirection);

        return true;
    }

    /**
     * Crée un effet visuel pour le dash
     */
    private createDashEffect(
        player: Phaser.Physics.Arcade.Sprite,
        direction: { x: number; y: number }
    ): void {
        // Effet de particules au point de départ seulement
        this.createDashParticles(player.x, player.y);
    }

    /**
     * Crée un effet de particules pour le dash
     */
    private createDashParticles(x: number, y: number): void {
        // Créer quelques particules simples avec des sprites existants
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const distance = 20 + Math.random() * 15;

            const particleX = x + Math.cos(angle) * 10;
            const particleY = y + Math.sin(angle) * 10;

            // Utiliser un petit sprite blanc ou de couleur pour les particules
            const particle = this.scene.add.rectangle(
                particleX,
                particleY,
                4,
                4,
                0xffffff
            );
            particle.setDepth(1000);

            // Animation des particules qui s'étalent
            this.scene.tweens.add({
                targets: particle,
                x: particleX + Math.cos(angle) * distance,
                y: particleY + Math.sin(angle) * distance,
                alpha: 0,
                scaleX: 0,
                scaleY: 0,
                duration: 300,
                ease: "Quad.easeOut",
                onComplete: () => {
                    particle.destroy();
                },
            });
        }
    }

    /**
     * Appelé quand le dash est terminé
     */
    private onDashComplete(): void {
        this.isDashing = false;

        const player = this.playerManager.getPlayer();
        if (player) {
            // Arrêter la vélocité du dash
            player.setVelocity(0, 0);
        }

        // Réactiver le mouvement normal
        this.playerManager.setMovementEnabled(true);

        // Nettoyer la traînée de fumée
        this.clearSmokeTrail();

        // Mettre à jour la position en grille
        this.playerManager.updateGridPosition();

        // Mettre à jour la profondeur
        this.playerManager.updatePlayerDepth();
    }

    /**
     * Met à jour le dash (à appeler depuis PlayerManager.update)
     */
    public update(): void {
        if (!this.isDashing) return;

        const currentTime = this.scene.time.now;
        const elapsedTime = currentTime - this.dashStartTime;

        // Vérifier si le dash est terminé
        if (elapsedTime >= this.dashConfig.duration) {
            this.onDashComplete();
            return;
        }

        // Vérifier les collisions pendant le dash
        if (this.checkDashCollision()) {
            this.onDashComplete();
            return;
        }
    }

    /**
     * Vérifie les collisions pendant le dash
     */
    private checkDashCollision(): boolean {
        const player = this.playerManager.getPlayer();
        if (!player || !this.mapManager) return false;

        // Calculer la position de grille actuelle du joueur
        const mapOffsetX = this.mapManager.getMapOffsetX
            ? this.mapManager.getMapOffsetX()
            : 0;
        const mapOffsetY = this.mapManager.getMapOffsetY
            ? this.mapManager.getMapOffsetY()
            : 0;

        const currentGridPos = IsometricUtils.screenToGrid(
            player.x - mapOffsetX,
            player.y - mapOffsetY
        );

        // Calculer la position que le joueur aura dans un petit moment (pour anticiper)
        const lookAheadDistance = 0.7; // Distance d'anticipation (plus proche de l'obstacle)
        let deltaX =
            this.dashDirection.x *
            IsometricUtils.TILE_WIDTH *
            lookAheadDistance;
        let deltaY =
            this.dashDirection.y *
            IsometricUtils.TILE_HEIGHT *
            lookAheadDistance;

        // Appliquer le facteur diagonal si nécessaire
        if (this.dashDirection.x !== 0 && this.dashDirection.y !== 0) {
            const diagonalFactor = PHYSICS_CONSTANTS.DIAGONAL_MOVEMENT_FACTOR;
            deltaX *= diagonalFactor;
            deltaY *= diagonalFactor;
        }

        const futureX = player.x + deltaX;
        const futureY = player.y + deltaY;

        const futureGridPos = IsometricUtils.screenToGrid(
            futureX - mapOffsetX,
            futureY - mapOffsetY
        );

        const nextGridX = Math.round(futureGridPos.x);
        const nextGridY = Math.round(futureGridPos.y);

        // Pour les mouvements diagonaux, vérifier aussi les positions adjacentes
        if (this.dashDirection.x !== 0 && this.dashDirection.y !== 0) {
            // Vérifier la position diagonale et les deux positions adjacentes
            const blockedDiagonal = this.isPositionBlocked(
                nextGridX,
                nextGridY
            );
            const blockedHorizontal = this.isPositionBlocked(
                nextGridX,
                Math.round(currentGridPos.y)
            );
            const blockedVertical = this.isPositionBlocked(
                Math.round(currentGridPos.x),
                nextGridY
            );

            return blockedDiagonal || blockedHorizontal || blockedVertical;
        } else {
            // Mouvement cardinal normal
            return this.isPositionBlocked(nextGridX, nextGridY);
        }
    }

    /**
     * Vérifie si une position est bloquée par un tile solide
     */
    private isPositionBlocked(gridX: number, gridY: number): boolean {
        if (!this.mapManager) return false;

        // Vérifier les limites de la carte
        const mapWidth = this.mapManager.getMapWidth
            ? this.mapManager.getMapWidth()
            : 12;
        const mapHeight = this.mapManager.getMapHeight
            ? this.mapManager.getMapHeight()
            : 12;

        if (gridX < 0 || gridY < 0 || gridX >= mapWidth || gridY >= mapHeight) {
            return true;
        }

        // Vérifier si la position contient un tile solide
        const isoMap = this.mapManager.getIsoMap
            ? this.mapManager.getIsoMap()
            : null;
        if (isoMap) {
            const solidTile = isoMap.getSolidTile(gridX, gridY);
            if (solidTile) {
                return true;
            }
        }

        return false;
    }

    /**
     * Commence la traînée de fumée
     */
    private startSmokeTrail(): void {
        this.clearSmokeTrail();

        // Créer un timer pour générer de la fumée périodiquement
        this.smokeTimer = this.scene.time.addEvent({
            delay: 50, // Créer de la fumée toutes les 50ms
            callback: this.createSmokeParticle,
            callbackScope: this,
            loop: true,
        });
    }

    /**
     * Crée une particule de fumée à la position actuelle du joueur
     */
    private createSmokeParticle(): void {
        if (!this.isDashing) return;

        const player = this.playerManager.getPlayer();
        if (!player) return;

        // Créer un sprite de fumée à la position actuelle du joueur
        const smoke = this.scene.add.sprite(
            player.x,
            player.y,
            "prepare-smoke"
        );
        smoke.setDepth(player.depth - 1);
        smoke.setAlpha(0.7);
        smoke.setScale(0.9);

        this.smokeTrail.push(smoke);

        // Ajouter une rotation continue à la fumée
        this.scene.tweens.add({
            targets: smoke,
            rotation: Math.PI * 4, // Deux rotations complètes
            duration: 2000,
            ease: "Linear",
        });

        // Faire disparaître la fumée progressivement (plus lentement)
        this.scene.tweens.add({
            targets: smoke,
            alpha: 0,
            scaleX: 0.4,
            scaleY: 0.4,
            duration: 2000, // Durée augmentée de 1000ms à 2000ms
            ease: "Quad.easeOut",
            onComplete: () => {
                const index = this.smokeTrail.indexOf(smoke);
                if (index > -1) {
                    this.smokeTrail.splice(index, 1);
                }
                smoke.destroy();
            },
        });
    }

    /**
     * Nettoie la traînée de fumée
     */
    private clearSmokeTrail(): void {
        // Arrêter le timer de fumée
        if (this.smokeTimer) {
            this.smokeTimer.destroy();
            this.smokeTimer = undefined;
        }

        // Détruire toutes les particules de fumée existantes
        this.smokeTrail.forEach((smoke) => smoke.destroy());
        this.smokeTrail = [];
    }

    /**
     * Traite l'input du dash (à appeler depuis PlayerManager)
     */
    public handleDashInput(dashKey: Phaser.Input.Keyboard.Key): void {
        if (Phaser.Input.Keyboard.JustDown(dashKey)) {
            this.executeDash();
        }
    }

    /**
     * Vérifie si le dash est actuellement en cours
     */
    public isDashActive(): boolean {
        return this.isDashing;
    }

    /**
     * Récupère le temps restant avant de pouvoir dasher à nouveau (en ms)
     */
    public getRemainingCooldown(): number {
        const currentTime = this.scene.time.now;
        const timeSinceLastDash = currentTime - this.lastDashTime;
        const remaining = this.dashConfig.cooldown - timeSinceLastDash;
        return Math.max(0, remaining);
    }

    /**
     * Force l'arrêt du dash (pour les situations d'urgence)
     */
    public stopDash(): void {
        if (this.isDashing) {
            this.onDashComplete();
        }
    }

    /**
     * Met à jour la configuration du dash
     */
    public updateConfig(newConfig: Partial<DashConfig>): void {
        this.dashConfig.speed = newConfig.speed ?? this.dashConfig.speed;
        this.dashConfig.duration =
            newConfig.duration ?? this.dashConfig.duration;
        this.dashConfig.cooldown =
            newConfig.cooldown ?? this.dashConfig.cooldown;
    }

    /**
     * Récupère la configuration actuelle du dash
     */
    public getConfig(): DashConfig {
        return { ...this.dashConfig };
    }
}

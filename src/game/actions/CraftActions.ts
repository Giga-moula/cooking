export type CraftDirection = "up" | "down" | "left" | "right";

export interface CraftSequence {
    directions: CraftDirection[];
    currentIndex: number;
    isActive: boolean;
}

export class CraftActions {
    private scene: Phaser.Scene;
    private playerManager: any; // Référence au PlayerManager
    private playerNumber: number;

    // Éléments visuels
    private controlsBox?: Phaser.GameObjects.Sprite;
    private arrowSprites: Phaser.GameObjects.Sprite[] = [];
    private currentArrowIndex: number = 0;

    // Séquence de craft
    private craftSequence: CraftSequence = {
        directions: [],
        currentIndex: 0,
        isActive: false,
    };

    // Configuration
    private readonly MAX_SEQUENCE_LENGTH = 5;
    private readonly BOX_OFFSET_Y = -60; // Offset au-dessus du joueur
    private readonly ARROW_SPACING = 40; // Espacement entre les flèches
    private readonly ZOOM_SCALE = 1.5;
    private readonly ZOOM_DURATION = 200;
    private readonly SHAKE_DURATION = 1000;

    private isProcessingInput = false;
    private isPlayingErrorAnimation = false;

    constructor(scene: Phaser.Scene, playerManager: any, playerNumber: number) {
        this.scene = scene;
        this.playerManager = playerManager;
        this.playerNumber = playerNumber;
    }

    /**
     * Active le système de craft et génère une nouvelle séquence
     */
    public startCrafting(): void {
        if (this.craftSequence.isActive) return;

        this.generateRandomSequence();
        this.craftSequence.isActive = true;
        this.craftSequence.currentIndex = 0;
        this.displayCraftUI();
    }

    /**
     * Désactive le système de craft et nettoie l'interface
     */
    public stopCrafting(): void {
        // Ne pas arrêter le craft si une animation d'erreur est en cours
        if (this.isPlayingErrorAnimation) {
            return;
        }
        
        this.craftSequence.isActive = false;
        this.hideCraftUI();
    }

    /**
     * Génère une séquence aléatoire de directions
     */
    private generateRandomSequence(): void {
        const directions: CraftDirection[] = ["up", "down", "left", "right"];
        const sequenceLength =
            Math.floor(Math.random() * this.MAX_SEQUENCE_LENGTH) + 1;

        this.craftSequence.directions = [];
        for (let i = 0; i < sequenceLength; i++) {
            const randomIndex = Math.floor(Math.random() * directions.length);
            this.craftSequence.directions.push(directions[randomIndex]);
        }
    }

    /**
     * Affiche l'interface de craft avec la boîte et les flèches
     */
    private displayCraftUI(): void {
        const player = this.playerManager.getPlayer();
        if (!player) return;

        // Position de la boîte au-dessus du joueur
        const boxX = player.x;
        const boxY = player.y + this.BOX_OFFSET_Y;

        // Créer la boîte de contrôles
        this.controlsBox = this.scene.add.sprite(boxX, boxY, "controlsBox");
        this.controlsBox.setDepth(1000); // Au-dessus de tout

        // Créer la première flèche
        this.createArrowSprites(boxX, boxY);
    }

    /**
     * Crée le sprite de la flèche actuelle dans la boîte
     */
    private createArrowSprites(centerX: number, centerY: number): void {
        this.arrowSprites = [];
        
        // Créer seulement la flèche actuelle
        const currentDirection = this.craftSequence.directions[this.craftSequence.currentIndex];
        if (currentDirection) {
            const textureKey = `arrow-${currentDirection}`;
            const arrow = this.scene.add.sprite(centerX, centerY, textureKey);
            arrow.setDepth(1001);
            arrow.setAlpha(1.0); // Complètement visible
            
            this.arrowSprites.push(arrow);
        }
    }

    /**
     * Crée la nouvelle flèche après validation de la précédente
     */
    private showNextArrow(): void {
        // Supprimer l'ancienne flèche
        this.arrowSprites.forEach(arrow => arrow.destroy());
        this.arrowSprites = [];
        
        // Créer la nouvelle flèche si la séquence n'est pas terminée
        if (this.craftSequence.currentIndex < this.craftSequence.directions.length && this.controlsBox) {
            const currentDirection = this.craftSequence.directions[this.craftSequence.currentIndex];
            if (currentDirection) {
                const textureKey = `arrow-${currentDirection}`;
                const arrow = this.scene.add.sprite(this.controlsBox.x, this.controlsBox.y, textureKey);
                arrow.setDepth(1001);
                arrow.setAlpha(1.0);
                
                this.arrowSprites.push(arrow);
            }
        }
    }

    /**
     * Cache l'interface de craft
     */
    private hideCraftUI(): void {
        if (this.controlsBox) {
            this.controlsBox.destroy();
            this.controlsBox = undefined;
        }

        this.arrowSprites.forEach((arrow) => arrow.destroy());
        this.arrowSprites = [];
        this.currentArrowIndex = 0;
    }

    /**
     * Met à jour la position de l'interface selon la position du joueur
     */
    public updatePosition(): void {
        if (!this.craftSequence.isActive) return;

        const player = this.playerManager.getPlayer();
        if (!player || !this.controlsBox) return;

        const boxX = player.x;
        const boxY = player.y + this.BOX_OFFSET_Y;

        // Mettre à jour la position de la boîte
        this.controlsBox.setPosition(boxX, boxY);

        // Mettre à jour la position de la flèche actuelle
        this.arrowSprites.forEach((arrow) => {
            arrow.setPosition(boxX, boxY);
        });
    }

    /**
     * Traite une entrée de direction du joueur
     */
    public processDirectionInput(direction: CraftDirection): void {
        if (!this.craftSequence.isActive || this.isProcessingInput) return;

        this.isProcessingInput = true;

        const expectedDirection =
            this.craftSequence.directions[this.craftSequence.currentIndex];

        if (direction === expectedDirection) {
            // Bonne direction
            this.playSuccessAnimation(() => {
                this.craftSequence.currentIndex++;

                if (
                    this.craftSequence.currentIndex >=
                    this.craftSequence.directions.length
                ) {
                    // Séquence terminée avec succès
                    this.onSequenceComplete();
                } else {
                    // Afficher la flèche suivante
                    this.showNextArrow();
                }

                this.isProcessingInput = false;
            });
        } else {
            // Mauvaise direction
            this.playErrorAnimation(() => {
                this.isProcessingInput = false;
            });
        }
    }

    /**
     * Animation de succès (zoom + fade)
     */
    private playSuccessAnimation(onComplete: () => void): void {
        const currentArrow = this.arrowSprites[0]; // Il n'y a qu'une seule flèche dans le tableau
        if (!currentArrow) return;

        this.scene.tweens.add({
            targets: currentArrow,
            scaleX: this.ZOOM_SCALE,
            scaleY: this.ZOOM_SCALE,
            alpha: 0,
            duration: this.ZOOM_DURATION,
            ease: "Power2",
            onComplete: onComplete,
        });
    }

    /**
     * Animation d'erreur (rotation oscillante)
     */
    private playErrorAnimation(onComplete: () => void): void {
        const currentArrow = this.arrowSprites[0]; // Il n'y a qu'une seule flèche dans le tableau
        if (!currentArrow) return;

        this.isPlayingErrorAnimation = true; // Marquer le début de l'animation d'erreur

        this.scene.tweens.add({
            targets: currentArrow,
            rotation: { from: -0.2, to: 0.2 },
            duration: 100,
            yoyo: true,
            repeat: 9, // 10 oscillations au total (5 allers-retours)
            ease: "Sine.easeInOut",
            onComplete: () => {
                currentArrow.setRotation(0); // Remettre à 0
                this.isPlayingErrorAnimation = false; // Marquer la fin de l'animation d'erreur
                onComplete();
            },
        });
    }

    /**
     * Appelé quand la séquence est terminée avec succès
     */
    private onSequenceComplete(): void {
        console.log(`Player ${this.playerNumber} completed craft sequence!`);
        // Ici vous pourrez ajouter la logique de craft (création d'item, etc.)

        // Générer une nouvelle séquence
        this.generateRandomSequence();
        this.craftSequence.currentIndex = 0;

        // Recréer l'interface avec la nouvelle séquence
        this.hideCraftUI();
        this.displayCraftUI();
    }

    /**
     * Vérifie si le système de craft est actif
     */
    public isActive(): boolean {
        return this.craftSequence.isActive;
    }

    /**
     * Récupère la séquence actuelle (pour debug)
     */
    public getCurrentSequence(): CraftSequence {
        return { ...this.craftSequence };
    }

    /**
     * Vérifie si on peut arrêter le craft (pas d'animation d'erreur en cours)
     */
    public canStop(): boolean {
        return !this.isPlayingErrorAnimation;
    }
}

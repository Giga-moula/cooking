import {
    CraftDirection,
    getCraftingItem,
    getRandomCraftSequence,
    getTransformationSequence,
    isValidCraftSequence,
} from "../config/craftingItems";
import { INSTANT_CRAFT_RECIPES } from "../data/recipes";
import { ActionSoundManager } from "../managers/ActionSoundManager";
import { Logger } from "../utils/Logger";

// Ré-exporter le type CraftDirection
export type { CraftDirection };

export interface CraftSequence {
    directions: CraftDirection[];
    currentIndex: number;
    isActive: boolean;
    tileTypeId?: number; // ID du bloc de craft utilisé
    startDirection?: CraftDirection; // Direction de départ pour les rotations
}

export class CraftActions {
    private scene: Phaser.Scene;
    private playerManager: any; // Référence au PlayerManager
    private playerNumber: number;
    private mapManager: any; // Référence au MapManager
    private actionSoundManager: ActionSoundManager | null;

    // Éléments visuels
    private controlsBox?: Phaser.GameObjects.Sprite;
    private arrowSprites: Phaser.GameObjects.Sprite[] = [];
    private prepareSmoke?: Phaser.GameObjects.Sprite;
    private spinningArrow?: Phaser.GameObjects.Sprite; // Pour les rotations
    private currentArrowIndex: number = 0;

    // Séquence de craft
    private craftSequence: CraftSequence = {
        directions: [],
        currentIndex: 0,
        isActive: false,
    };

    // Suivi des rotations
    private rotationTracker: {
        isRotating: boolean;
        startDirection?: CraftDirection;
        currentDirection?: CraftDirection;
        completedDirections: CraftDirection[];
        expectedRotation: "spin" | "anti-spin" | null;
    } = {
        isRotating: false,
        completedDirections: [],
        expectedRotation: null,
    };

    // Configuration
    private readonly MAX_SEQUENCE_LENGTH = 5;
    private readonly BOX_OFFSET_Y = -60; // Offset au-dessus du joueur
    private readonly ARROW_SPACING = 40; // Espacement entre les flèches
    private readonly ZOOM_SCALE = 1.5;
    private readonly ZOOM_DURATION = 200;
    private readonly SHAKE_DURATION = 1000;
    private readonly SMOKE_OFFSET = 32; // Distance de la fumée par rapport au joueur

    private isProcessingInput = false;
    private isPlayingErrorAnimation = false;

    constructor(
        scene: Phaser.Scene,
        playerManager: any,
        playerNumber: number,
        mapManager: any,
        actionSoundManager: ActionSoundManager | null = null
    ) {
        this.scene = scene;
        this.playerManager = playerManager;
        this.playerNumber = playerNumber;
        this.mapManager = mapManager;
        this.actionSoundManager = actionSoundManager;
    }

    /**
     * Définit l'ActionSoundManager
     */
    public setActionSoundManager(actionSoundManager: ActionSoundManager): void {
        Logger.debug(
            "🎵 CraftActions: ActionSoundManager défini",
            actionSoundManager
        );
        this.actionSoundManager = actionSoundManager;
    }

    /**
     * Active le système de craft et génère une nouvelle séquence
     * Vérifie d'abord si le joueur est face à un bloc de craft valide
     */
    public startCrafting(): void {
        if (this.craftSequence.isActive) return;

        // Vérifier si le joueur est face à un bloc de craft autorisé
        const craftingTileId = this.getCraftingTileInFront();
        if (craftingTileId === null) {
            Logger.debug(
                `Player ${this.playerNumber}: Aucun bloc de craft valide devant le joueur`
            );
            return;
        }

        // Générer une séquence appropriée pour ce bloc
        this.generateSequenceForTile(craftingTileId);
        this.craftSequence.isActive = true;
        this.craftSequence.currentIndex = 0;
        this.craftSequence.tileTypeId = craftingTileId;

        // Réinitialiser la séquence des sons pour commencer par goodInput1
        this.actionSoundManager?.resetInputSequence();

        // Immobiliser le joueur
        this.setPlayerMovement(false);

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
        this.resetRotationTracker();

        // Réactiver le mouvement du joueur
        this.setPlayerMovement(true);

        this.hideCraftUI();
    }

    /**
     * Génère une séquence de craft spécifique pour un type de bloc
     */
    private generateSequenceForTile(tileTypeId: number): void {
        const target = this.playerManager.getTargetPosition();

        // Essayer d'abord de trouver une séquence spécifique basée sur la transformation
        const specificSequence = this.getSpecificSequenceForTransformation(
            target.x,
            target.y,
            tileTypeId
        );

        if (specificSequence) {
            this.craftSequence.directions = specificSequence;
        } else {
            // Fallback: séquence aléatoire
            const sequence = getRandomCraftSequence(tileTypeId);
            if (sequence) {
                this.craftSequence.directions = sequence;
            } else {
                // Fallback ultime: séquence basique
                this.craftSequence.directions = ["up", "down"];
            }
        }
    }

    /**
     * Récupère la séquence spécifique pour une transformation donnée
     */
    private getSpecificSequenceForTransformation(
        gridX: number,
        gridY: number,
        tileTypeId: number
    ): CraftDirection[] | null {
        const counterManager = this.mapManager.getCounterManager();
        const casseroleManager = this.mapManager.getCasseroleManager();
        const recipeManager = this.mapManager.getRecipeManager();

        if (!counterManager || !casseroleManager || !recipeManager) {
            return null;
        }

        switch (tileTypeId) {
            case 10: // Table de transformation
                if (!counterManager.hasItemOnCounter(gridX, gridY)) {
                    return null;
                }
                const itemOnCounter = counterManager.getItemTypeOnCounter(
                    gridX,
                    gridY
                );
                if (!itemOnCounter) {
                    return null;
                }

                // Vérifier s'il y a une transformation spéciale possible
                const transformResult =
                    recipeManager.performSpecialTransformation
                        ? recipeManager.performSpecialTransformation(
                              itemOnCounter
                          )
                        : null;

                if (transformResult) {
                    return getTransformationSequence(
                        itemOnCounter,
                        transformResult
                    );
                }
                return null;

            case 13: // Casserole
                if (!casseroleManager.hasItemInCasserole(gridX, gridY)) {
                    return null;
                }
                const itemInCasserole = casseroleManager.getItemInCasserole(
                    gridX,
                    gridY
                );
                if (!itemInCasserole) {
                    return null;
                }

                // Vérifier la cuisson possible dans la casserole
                const cookingRecipe = recipeManager.getCasseroleCooking
                    ? recipeManager.getCasseroleCooking(itemInCasserole)
                    : null;

                if (cookingRecipe) {
                    return getTransformationSequence(
                        itemInCasserole,
                        cookingRecipe.to
                    );
                }
                return null;

            default:
                return null;
        }
    }

    /**
     * Vérifie si le joueur est face à un bloc de craft autorisé et qu'il y a un ingrédient craftable
     */
    private getCraftingTileInFront(): number | null {
        const target = this.playerManager.getTargetPosition();
        const tileTypeId = this.mapManager.getTileTypeId(target.x, target.y);

        // Le four (11) n'utilise plus le système de craft, mais un timer à la place
        if (tileTypeId === 11) {
            return null;
        }

        if (!tileTypeId || !getCraftingItem(tileTypeId)) {
            return null;
        }

        // Pour la table de transformation (10), vérifier si c'est un craft instantané
        if (
            tileTypeId === 10 &&
            this.isInstantCraftRecipe(target.x, target.y)
        ) {
            return null;
        }

        // Vérifier qu'il y a un ingrédient craftable sur le bloc
        if (!this.hasValidIngredientOnTile(target.x, target.y, tileTypeId)) {
            return null;
        }

        return tileTypeId;
    }

    /**
     * Vérifie si la recette qui va être créée est un craft instantané
     */
    private isInstantCraftRecipe(gridX: number, gridY: number): boolean {
        const counterManager = this.mapManager.getCounterManager();
        const recipeManager = this.mapManager.getRecipeManager();

        if (!counterManager || !recipeManager) {
            return false;
        }

        // Vérifier s'il y a un item sur la table
        if (!counterManager.hasItemOnCounter(gridX, gridY)) {
            return false;
        }

        const itemOnCounter = counterManager.getItemTypeOnCounter(gridX, gridY);
        if (!itemOnCounter) {
            return false;
        }

        // Vérifier s'il y a un item dans la main du joueur
        const playerInventory = this.playerManager.getInventory();
        if (!playerInventory || playerInventory.isEmpty()) {
            return false;
        }

        const itemInHand = playerInventory.peekItem();
        if (!itemInHand) {
            return false;
        }

        // Essayer de trouver une recette avec ces deux ingrédients
        const allRecipes = recipeManager.getAllRecipes();
        for (const recipe of allRecipes) {
            if (
                (itemOnCounter === recipe.ingredient1 &&
                    itemInHand === recipe.ingredient2) ||
                (itemOnCounter === recipe.ingredient2 &&
                    itemInHand === recipe.ingredient1)
            ) {
                // Vérifier si c'est une recette instantanée
                if (INSTANT_CRAFT_RECIPES.includes(recipe.id)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Vérifie s'il y a un ingrédient valide et craftable sur la tile
     */
    private hasValidIngredientOnTile(
        gridX: number,
        gridY: number,
        tileTypeId: number
    ): boolean {
        const counterManager = this.mapManager.getCounterManager();
        const ovenManager = this.mapManager.getOvenManager();
        const casseroleManager = this.mapManager.getCasseroleManager();
        const recipeManager = this.mapManager.getRecipeManager();

        if (
            !counterManager ||
            !ovenManager ||
            !casseroleManager ||
            !recipeManager
        ) {
            return false;
        }

        switch (tileTypeId) {
            case 10: // Table de transformation
                if (!counterManager.hasItemOnCounter(gridX, gridY)) {
                    return false;
                }
                const itemOnCounter = counterManager.getItemTypeOnCounter(
                    gridX,
                    gridY
                );
                if (!itemOnCounter) return false;

                // Vérifier si l'item peut être transformé (transformation spéciale ou recettes)
                const canTransform = recipeManager.performSpecialTransformation
                    ? recipeManager.performSpecialTransformation(itemOnCounter)
                    : false;
                const playerInventory = this.playerManager.getInventory();
                const hasRecipePossible = this.canMakeRecipeWithItem(
                    itemOnCounter,
                    playerInventory,
                    recipeManager
                );

                return canTransform || hasRecipePossible;

            case 11: // Four
                if (!ovenManager.hasItemInOven(gridX, gridY)) {
                    return false;
                }
                const itemInOven = ovenManager.getItemTypeInOven(gridX, gridY);
                return (
                    itemInOven &&
                    recipeManager.canCookInOven &&
                    recipeManager.canCookInOven(itemInOven)
                );

            case 13: // Casserole
                if (!casseroleManager.hasItemInCasserole(gridX, gridY)) {
                    return false;
                }
                const itemInCasserole = casseroleManager.getItemInCasserole(
                    gridX,
                    gridY
                );
                return (
                    itemInCasserole &&
                    recipeManager.canCookInCasserole &&
                    recipeManager.canCookInCasserole(itemInCasserole)
                );

            default:
                return false;
        }
    }

    /**
     * Vérifie si une recette est possible avec l'item sur la table et l'inventaire du joueur
     */
    private canMakeRecipeWithItem(
        itemOnTable: string,
        playerInventory: any,
        recipeManager: any
    ): boolean {
        if (!playerInventory || !recipeManager.getAllRecipes) {
            return false;
        }

        const allRecipes = recipeManager.getAllRecipes();
        for (const recipe of allRecipes) {
            if (
                itemOnTable === recipe.ingredient1 ||
                itemOnTable === recipe.ingredient2
            ) {
                const neededIngredient =
                    itemOnTable === recipe.ingredient1
                        ? recipe.ingredient2
                        : recipe.ingredient1;

                if (
                    playerInventory.hasItem &&
                    playerInventory.hasItem(neededIngredient)
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Active ou désactive le mouvement du joueur
     */
    private setPlayerMovement(enabled: boolean): void {
        // Cette méthode devra être implémentée dans PlayerManager
        if (this.playerManager.setMovementEnabled) {
            this.playerManager.setMovementEnabled(enabled);
        }
    }

    /**
     * Remet à zéro le tracker de rotation
     */
    private resetRotationTracker(): void {
        this.rotationTracker = {
            isRotating: false,
            startDirection: undefined,
            currentDirection: undefined,
            completedDirections: [],
            expectedRotation: null,
        };
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

        // Créer la fumée dans la direction du joueur
        this.createPrepareSmoke();

        // Créer la première flèche
        this.createArrowSprites(boxX, boxY);
    }

    /**
     * Crée le sprite de la flèche actuelle dans la boîte
     */
    private createArrowSprites(centerX: number, centerY: number): void {
        this.arrowSprites = [];

        // Créer seulement la flèche actuelle
        const currentDirection =
            this.craftSequence.directions[this.craftSequence.currentIndex];
        if (currentDirection) {
            if (
                currentDirection === "spin" ||
                currentDirection === "anti-spin"
            ) {
                // Créer une flèche de rotation
                this.createSpinningArrow(centerX, centerY, currentDirection);
            } else {
                // Créer une flèche directionnelle normale
                const textureKey = `arrow-${currentDirection}`;
                const arrow = this.scene.add.sprite(
                    centerX,
                    centerY,
                    textureKey
                );
                arrow.setDepth(1001);
                arrow.setAlpha(1.0);
                this.arrowSprites.push(arrow);
            }
        }
    }

    /**
     * Crée une flèche de rotation (spinning)
     */
    private createSpinningArrow(
        centerX: number,
        centerY: number,
        spinType: "spin" | "anti-spin"
    ): void {
        const textureKey =
            spinType === "spin" ? "spinning-arrow" : "reverse-spinning-arrow";
        this.spinningArrow = this.scene.add.sprite(
            centerX,
            centerY,
            textureKey
        );
        this.spinningArrow.setDepth(1001);
        this.spinningArrow.setAlpha(1.0);

        // Démarrer le tracker de rotation
        this.rotationTracker.isRotating = true;
        this.rotationTracker.expectedRotation = spinType;
        this.rotationTracker.completedDirections = [];

        // Animation de rotation continue
        this.scene.tweens.add({
            targets: this.spinningArrow,
            rotation: spinType === "spin" ? Math.PI * 2 : -Math.PI * 2,
            duration: 2000,
            repeat: -1,
            ease: "Linear",
        });
    }

    /**
     * Crée la nouvelle flèche après validation de la précédente
     */
    private showNextArrow(): void {
        // Supprimer l'ancienne flèche
        this.arrowSprites.forEach((arrow) => arrow.destroy());
        this.arrowSprites = [];

        if (this.spinningArrow) {
            this.spinningArrow.destroy();
            this.spinningArrow = undefined;
        }

        // Remettre à zéro le tracker de rotation
        this.resetRotationTracker();

        // Créer la nouvelle flèche si la séquence n'est pas terminée
        if (
            this.craftSequence.currentIndex <
                this.craftSequence.directions.length &&
            this.controlsBox
        ) {
            this.createArrowSprites(this.controlsBox.x, this.controlsBox.y);
        }
    }

    /**
     * Crée la fumée de préparation dans la direction du joueur
     */
    private createPrepareSmoke(): void {
        const player = this.playerManager.getPlayer();
        if (!player) return;

        // Récupérer la direction du joueur
        const direction = this.playerManager.getLastDirection();

        // Calculer la position de la fumée selon la direction
        const smokeX = player.x + direction.x * this.SMOKE_OFFSET;
        const smokeY = player.y + direction.y * this.SMOKE_OFFSET;

        // Créer le sprite de fumée
        this.prepareSmoke = this.scene.add.sprite(
            smokeX,
            smokeY,
            "prepare-smoke"
        );

        // Gestion de la profondeur selon la direction
        if (direction.y === -1) {
            // Joueur regarde vers le haut : fumée au second plan
            this.prepareSmoke.setDepth(player.depth - 1);
        } else {
            // Autres directions : fumée devant le joueur
            this.prepareSmoke.setDepth(player.depth + 1);
        }

        // Ajouter une légère animation d'oscillation à la fumée
        this.scene.tweens.add({
            targets: this.prepareSmoke,
            alpha: { from: 0.8, to: 1.0 },
            scaleX: { from: 0.9, to: 1.1 },
            scaleY: { from: 0.9, to: 1.1 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });

        // Ajouter un effet de rotation continue à la fumée
        this.scene.tweens.add({
            targets: this.prepareSmoke,
            rotation: Math.PI * 2, // Rotation complète (360 degrés)
            duration: 1000, // 3 secondes pour une rotation complète
            repeat: -1,
            ease: "Linear",
        });
    }

    /**
     * Cache l'interface de craft
     */
    private hideCraftUI(): void {
        if (this.controlsBox) {
            this.controlsBox.destroy();
            this.controlsBox = undefined;
        }

        if (this.prepareSmoke) {
            this.prepareSmoke.destroy();
            this.prepareSmoke = undefined;
        }

        if (this.spinningArrow) {
            this.spinningArrow.destroy();
            this.spinningArrow = undefined;
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

        // Mettre à jour la position de la fumée
        if (this.prepareSmoke) {
            const direction = this.playerManager.getLastDirection();
            const smokeX = player.x + direction.x * this.SMOKE_OFFSET;
            const smokeY = player.y + direction.y * this.SMOKE_OFFSET;
            this.prepareSmoke.setPosition(smokeX, smokeY);

            // Mettre à jour la profondeur de la fumée selon la direction
            if (direction.y === -1) {
                this.prepareSmoke.setDepth(player.depth - 1);
            } else {
                this.prepareSmoke.setDepth(player.depth + 1);
            }
        }

        // Mettre à jour la position des flèches
        this.arrowSprites.forEach((arrow) => {
            arrow.setPosition(boxX, boxY);
        });

        if (this.spinningArrow) {
            this.spinningArrow.setPosition(boxX, boxY);
        }
    }

    /**
     * Traite une entrée de direction du joueur
     */
    public processDirectionInput(direction: CraftDirection): void {
        if (!this.craftSequence.isActive || this.isProcessingInput) return;

        this.isProcessingInput = true;

        const expectedDirection =
            this.craftSequence.directions[this.craftSequence.currentIndex];

        // Gestion spéciale des rotations
        if (expectedDirection === "spin" || expectedDirection === "anti-spin") {
            this.handleRotationInput(direction, expectedDirection);
        } else {
            // Gestion normale des directions
            this.handleNormalDirectionInput(direction, expectedDirection);
        }
    }

    /**
     * Gère les entrées pour les rotations
     */
    private handleRotationInput(
        direction: CraftDirection,
        expectedRotation: "spin" | "anti-spin"
    ): void {
        if (!this.rotationTracker.isRotating) {
            this.isProcessingInput = false;
            return;
        }

        // Définir la direction de départ si c'est le premier input
        if (!this.rotationTracker.startDirection) {
            this.rotationTracker.startDirection = direction;
            this.rotationTracker.currentDirection = direction;
            this.rotationTracker.completedDirections.push(direction);
            this.isProcessingInput = false;
            return;
        }

        // Vérifier si la direction suit la séquence de rotation attendue
        if (this.isValidRotationDirection(direction, expectedRotation)) {
            this.rotationTracker.completedDirections.push(direction);
            this.rotationTracker.currentDirection = direction;

            // Vérifier si la rotation est terminée (retour à la direction de départ)
            if (
                direction === this.rotationTracker.startDirection &&
                this.rotationTracker.completedDirections.length >= 5
            ) {
                // Rotation complète réussie
                this.actionSoundManager?.playGoodInput();
                this.playSuccessAnimation(() => {
                    this.craftSequence.currentIndex++;
                    this.checkSequenceCompletion();
                    this.isProcessingInput = false;
                });
            } else {
                // Direction correcte mais rotation pas encore terminée
                this.actionSoundManager?.playGoodInput();
                this.isProcessingInput = false;
            }
        } else {
            // Mauvaise direction dans la rotation
            this.actionSoundManager?.playFailedInput();
            this.playErrorAnimation(() => {
                // Enregistrer l'échec sur le four si c'est un four
                this.recordCraftFailure();
                this.resetRotationTracker();
                this.rotationTracker.isRotating = true;
                this.rotationTracker.expectedRotation = expectedRotation;
                this.isProcessingInput = false;
            });
        }
    }

    /**
     * Gère les entrées pour les directions normales
     */
    private handleNormalDirectionInput(
        direction: CraftDirection,
        expectedDirection: CraftDirection
    ): void {
        if (direction === expectedDirection) {
            // Bonne direction
            Logger.debug(
                "🎵 CraftActions: Tentative de jouer good input, actionSoundManager:",
                this.actionSoundManager
            );
            this.actionSoundManager?.playGoodInput();
            this.playSuccessAnimation(() => {
                this.craftSequence.currentIndex++;
                this.checkSequenceCompletion();
                this.isProcessingInput = false;
            });
        } else {
            // Mauvaise direction
            Logger.debug(
                "🎵 CraftActions: Tentative de jouer failed input, actionSoundManager:",
                this.actionSoundManager
            );
            this.actionSoundManager?.playFailedInput();
            this.playErrorAnimation(() => {
                // Enregistrer l'échec sur le four si c'est un four
                this.recordCraftFailure();
                this.isProcessingInput = false;
            });
        }
    }

    /**
     * Vérifie si la direction est valide pour la rotation en cours
     */
    private isValidRotationDirection(
        direction: CraftDirection,
        rotationType: "spin" | "anti-spin"
    ): boolean {
        const currentDir = this.rotationTracker.currentDirection;
        if (!currentDir) return false;

        const directions: CraftDirection[] = ["up", "right", "down", "left"];
        const currentIndex = directions.indexOf(currentDir);

        if (rotationType === "spin") {
            // Sens horaire: up -> right -> down -> left -> up
            const nextIndex = (currentIndex + 1) % directions.length;
            return direction === directions[nextIndex];
        } else {
            // Sens anti-horaire: up -> left -> down -> right -> up
            const nextIndex =
                (currentIndex - 1 + directions.length) % directions.length;
            return direction === directions[nextIndex];
        }
    }

    /**
     * Vérifie si la séquence est terminée
     */
    private checkSequenceCompletion(): void {
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
    }

    /**
     * Animation de succès (zoom + fade)
     */
    private playSuccessAnimation(onComplete: () => void): void {
        const targetSprite = this.spinningArrow || this.arrowSprites[0];
        if (!targetSprite) {
            onComplete();
            return;
        }

        this.scene.tweens.add({
            targets: targetSprite,
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
        const targetSprite = this.spinningArrow || this.arrowSprites[0];
        if (!targetSprite) {
            onComplete();
            return;
        }

        this.isPlayingErrorAnimation = true; // Marquer le début de l'animation d'erreur

        this.scene.tweens.add({
            targets: targetSprite,
            rotation: { from: -0.2, to: 0.2 },
            duration: 30,
            yoyo: true,
            repeat: 2, // 10 oscillations au total (5 allers-retours)
            ease: "Sine.easeInOut",
            onComplete: () => {
                targetSprite.setRotation(0); // Remettre à 0
                this.isPlayingErrorAnimation = false; // Marquer la fin de l'animation d'erreur
                onComplete();
            },
        });
    }

    /**
     * Appelé quand la séquence est terminée avec succès
     */
    private onSequenceComplete(): void {
        Logger.debug(
            `Player ${this.playerNumber} completed craft sequence for tile ${this.craftSequence.tileTypeId}!`
        );

        // Valider la séquence complète
        if (
            this.craftSequence.tileTypeId &&
            isValidCraftSequence(
                this.craftSequence.tileTypeId,
                this.craftSequence.directions
            )
        ) {
            Logger.debug(
                `Player ${this.playerNumber}: Séquence de craft validée!`
            );

            // Effectuer la transformation maintenant que la séquence est terminée
            const success = this.performCrafting(this.craftSequence.tileTypeId);

            if (success) {
                Logger.debug(
                    `Player ${this.playerNumber}: Transformation réussie!`
                );

                // Reset les échecs pour les fours après succès
                this.resetCraftFailures();
            } else {
                Logger.debug(
                    `Player ${this.playerNumber}: Échec de la transformation`
                );
            }

            // Arrêter le craft après succès
            this.stopCrafting();
        } else {
            Logger.debug(
                `Player ${this.playerNumber}: Séquence de craft non valide`
            );

            // Générer une nouvelle séquence pour le même bloc
            if (this.craftSequence.tileTypeId) {
                this.generateSequenceForTile(this.craftSequence.tileTypeId);
            }
            this.craftSequence.currentIndex = 0;

            // Recréer l'interface avec la nouvelle séquence
            this.hideCraftUI();
            this.displayCraftUI();
        }
    }

    /**
     * Effectue la transformation sur le bloc de craft
     */
    private performCrafting(tileTypeId: number): boolean {
        const target = this.playerManager.getTargetPosition();
        const gridX = target.x;
        const gridY = target.y;

        const counterManager = this.mapManager.getCounterManager();
        const ovenManager = this.mapManager.getOvenManager();
        const casseroleManager = this.mapManager.getCasseroleManager();

        if (!counterManager || !ovenManager || !casseroleManager) {
            return false;
        }

        switch (tileTypeId) {
            case 10: // Table de transformation
                const playerInventory = this.playerManager.getInventory();
                const success = counterManager.performSpecialTransformation(
                    gridX,
                    gridY,
                    playerInventory
                );
                if (success) {
                    this.playerManager.updateCarriedItem();
                }
                return success;

            case 11: // Four
                return ovenManager.performCooking(gridX, gridY);

            case 13: // Casserole
                return casseroleManager.cookInCasserole(gridX, gridY);

            default:
                return false;
        }
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

    /**
     * Enregistre un échec de craft pour les fours
     */
    private recordCraftFailure(): void {
        // Seulement pour les fours (tileTypeId 11)
        if (this.craftSequence.tileTypeId === 11) {
            const target = this.playerManager.getTargetPosition();
            const ovenManager = this.mapManager.getOvenManager();

            if (ovenManager && ovenManager.recordCraftFailure) {
                ovenManager.recordCraftFailure(target.x, target.y);
            }
        }
    }

    /**
     * Reset les échecs de craft pour les fours
     */
    private resetCraftFailures(): void {
        // Seulement pour les fours (tileTypeId 11)
        if (this.craftSequence.tileTypeId === 11) {
            const target = this.playerManager.getTargetPosition();
            const ovenManager = this.mapManager.getOvenManager();

            if (ovenManager && ovenManager.resetCraftFailures) {
                ovenManager.resetCraftFailures(target.x, target.y);
            }
        }
    }
}


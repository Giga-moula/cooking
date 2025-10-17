import Phaser from "phaser";
import {
    COOKING_CONSTANTS,
    PARTICLE_CONSTANTS,
    TIME_CONSTANTS,
} from "../config/Constants";
import { IsometricUtils } from "../utils/IsometricUtils";
import { Logger } from "../utils/Logger";
import { BaseCookingManager } from "./BaseCookingManager";
import { RecipeManager } from "./RecipeManager";
import { VoiceManager } from "./VoiceManager";

/**
 * Gestionnaire des interactions avec le four
 * Permet de faire fondre le beurre et cuire les cookies
 */
export class OvenManager extends BaseCookingManager {
    // Suivi des échecs de cuisson pour chaque four
    private cookingFailures: Map<string, number> = new Map();
    private readonly MAX_FAILURES_BEFORE_BURN =
        COOKING_CONSTANTS.MAX_FAILURES_BEFORE_BURN;
    private activeParticles: Phaser.GameObjects.Particles.ParticleEmitter[] =
        [];
    private voiceManager?: VoiceManager;

    // Système de timer de cuisson
    private cookingTimers: Map<
        string,
        {
            startTime: number;
            timerText?: Phaser.GameObjects.Text;
            originalItem: string;
        }
    > = new Map();
    private readonly COOKING_TIME = 8000; // 10 secondes en millisecondes
    private readonly BURN_TIME = 13000; // 15 secondes en millisecondes (10 + 5)

    constructor(
        scene: Phaser.Scene,
        mapOffsetX: number,
        mapOffsetY: number,
        recipeManager: RecipeManager
    ) {
        super(scene, mapOffsetX, mapOffsetY, recipeManager);
    }

    /**
     * Définit le gestionnaire de voix
     */
    setVoiceManager(voiceManager: VoiceManager): void {
        this.voiceManager = voiceManager;
    }

    /**
     * Place un objet dans le four
     */
    placeItemInOven(gridX: number, gridY: number, itemType: string): boolean {
        return this.placeItem(gridX, gridY, itemType);
    }

    /**
     * Retire un objet du four
     */
    removeItemFromOven(gridX: number, gridY: number): string | null {
        const key = `${gridX},${gridY}`;

        // Supprimer le timer si actif
        const timer = this.cookingTimers.get(key);
        if (timer && timer.timerText) {
            timer.timerText.destroy();
        }
        this.cookingTimers.delete(key);

        return this.removeItem(gridX, gridY);
    }

    /**
     * Vérifie si le four contient un objet
     */
    hasItemInOven(gridX: number, gridY: number): boolean {
        return this.hasItem(gridX, gridY);
    }

    /**
     * Récupère le type d'objet dans le four
     */
    getItemTypeInOven(gridX: number, gridY: number): string | null {
        return this.getItemType(gridX, gridY);
    }

    /**
     * Démarre la cuisson dans le four (démarre le timer de 10 secondes)
     */
    performCooking(
        gridX: number,
        gridY: number,
        playerNumber: number = 1
    ): boolean {
        const key = `${gridX},${gridY}`;
        const item = this.itemsInDevice.get(key);

        if (!item) {
            return false;
        }

        const currentItem = item.texture.key;

        // Vérifier que c'est un cookie-mix
        const cookingRecipe = this.recipeManager.getOvenCooking(currentItem);
        if (!cookingRecipe) {
            return false;
        }

        // Si un timer est déjà actif pour ce four, ne rien faire
        if (this.cookingTimers.has(key)) {
            return false;
        }

        // Démarrer le timer de cuisson
        this.startCookingTimer(gridX, gridY, currentItem, cookingRecipe.to);

        // Déclencher une voix pour l'utilisation du four
        if (this.voiceManager) {
            console.log(
                `🔥 Cuisson de ${currentItem} dans le four - déclencher voix (Joueur ${playerNumber})`
            );
            this.voiceManager.playVoiceForOven(playerNumber);
        }

        return true;
    }

    /**
     * Enregistre un échec de craft pour ce four
     * Brûle l'ingrédient après 3 échecs consécutifs
     */
    recordCraftFailure(gridX: number, gridY: number): boolean {
        const key = `${gridX},${gridY}`;
        const item = this.itemsInDevice.get(key);

        if (!item) return false;

        const currentItem = item.texture.key;

        // Vérifier que c'est un cookie-mix
        if (!currentItem.startsWith("cookie-mix-")) {
            return false;
        }

        // Incrémenter le compteur d'échecs
        const currentFailures = this.cookingFailures.get(key) || 0;
        const newFailures = currentFailures + 1;
        this.cookingFailures.set(key, newFailures);

        Logger.log(
            `Four ${key}: Échec ${newFailures}/${this.MAX_FAILURES_BEFORE_BURN}`
        );

        // Si 3 échecs atteints, brûler le cookie
        if (newFailures >= this.MAX_FAILURES_BEFORE_BURN) {
            item.setTexture("cookie-dead");
            this.cookingFailures.delete(key); // Reset le compteur
            this.playCookingEffect(gridX, gridY);
            Logger.log(`Four ${key}: Cookie brûlé !`);
            return true;
        }

        return false;
    }

    /**
     * Remet à zéro les échecs pour un four (appelé lors d'un craft réussi)
     */
    resetCraftFailures(gridX: number, gridY: number): void {
        const key = `${gridX},${gridY}`;
        this.cookingFailures.delete(key);
    }

    /**
     * Démarre le timer de cuisson pour un four
     */
    private startCookingTimer(
        gridX: number,
        gridY: number,
        originalItem: string,
        cookedItem: string
    ): void {
        const key = `${gridX},${gridY}`;
        const screenPos = IsometricUtils.gridToScreen(gridX, gridY);
        const x = screenPos.x + this.mapOffsetX;
        const y = screenPos.y + this.mapOffsetY - 40; // Au-dessus du four

        // Créer un texte pour afficher le timer
        const timerText = this.scene.add.text(x, y, "8s", {
            fontSize: "24px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4,
            fontStyle: "bold",
        });
        timerText.setOrigin(0.5, 0.5);
        timerText.setDepth(10000); // Au-dessus de tout

        // Enregistrer le timer
        this.cookingTimers.set(key, {
            startTime: this.scene.time.now,
            timerText: timerText,
            originalItem: originalItem,
        });

        // Effet visuel de démarrage
        this.playCookingEffect(gridX, gridY);

        Logger.log(
            `Four ${key}: Cuisson démarrée pour ${originalItem} → ${cookedItem}`
        );
    }

    /**
     * Met à jour tous les timers de cuisson
     * Doit être appelé à chaque frame
     */
    public update(): void {
        const currentTime = this.scene.time.now;
        const timersToRemove: string[] = [];

        this.cookingTimers.forEach((timer, key) => {
            const elapsedTime = currentTime - timer.startTime;
            const [gridX, gridY] = key.split(",").map(Number);
            const item = this.itemsInDevice.get(key);

            if (!item) {
                // L'item a été retiré, supprimer le timer
                if (timer.timerText) {
                    timer.timerText.destroy();
                }
                timersToRemove.push(key);
                return;
            }

            // Vérifier si le cookie doit brûler (15 secondes)
            if (elapsedTime >= this.BURN_TIME) {
                item.setTexture("cookie-dead");
                this.playCookingEffect(gridX, gridY);
                Logger.log(`Four ${key}: Cookie brûlé après 15 secondes !`);

                if (timer.timerText) {
                    timer.timerText.destroy();
                }
                timersToRemove.push(key);
            }
            // Vérifier si le cookie est cuit (10 secondes)
            else if (elapsedTime >= this.COOKING_TIME) {
                // Transformer en cookie cuit seulement une fois
                if (item.texture.key === timer.originalItem) {
                    const cookingRecipe = this.recipeManager.getOvenCooking(
                        timer.originalItem
                    );
                    if (cookingRecipe) {
                        item.setTexture(cookingRecipe.to);
                        this.playCookingEffect(gridX, gridY);
                        Logger.log(
                            `Four ${key}: Cookie cuit après 10 secondes !`
                        );
                    }
                }

                // Afficher le timer clignotant rouge/blanc (5 secondes restantes avant de brûler)
                if (timer.timerText) {
                    const burnRemainingTime = Math.max(
                        0,
                        this.BURN_TIME - elapsedTime
                    );
                    const seconds = Math.ceil(burnRemainingTime / 1000);
                    timer.timerText.setText(`${seconds}s`);

                    // Effet de clignotement entre rouge et blanc
                    const blinkSpeed = 4; // Vitesse de clignotement (changements par seconde)
                    const blinkPhase =
                        Math.floor((currentTime / 1000) * blinkSpeed) % 2;

                    if (blinkPhase === 0) {
                        timer.timerText.setColor("#ff0000"); // Rouge
                    } else {
                        timer.timerText.setColor("#ffffff"); // Blanc
                    }
                    timer.timerText.setAlpha(1); // Opacité complète
                }
            } else {
                // Cuisson en cours (0-10 secondes)
                if (timer.timerText) {
                    const remainingTime = Math.max(
                        0,
                        this.COOKING_TIME - elapsedTime
                    );
                    const seconds = Math.ceil(remainingTime / 1000);
                    timer.timerText.setText(`${seconds}s`);
                    timer.timerText.setAlpha(1); // Opacité complète

                    // Changer la couleur selon le temps restant
                    if (seconds > 3) {
                        timer.timerText.setColor("#ffffff"); // Blanc de 10s à 4s
                    } else {
                        timer.timerText.setColor("#00ff00"); // Vert pour les 3 dernières secondes (3s, 2s, 1s)
                    }
                }
            }
        });

        // Nettoyer les timers terminés
        timersToRemove.forEach((key) => this.cookingTimers.delete(key));
    }

    /**
     * Cuire un objet dans le four (ancienne méthode, conservée pour compatibilité)
     * Four : Beurre + Cookie-mix uniquement
     */
    cook(gridX: number, gridY: number): boolean {
        const key = `${gridX},${gridY}`;
        const item = this.itemsInDevice.get(key);

        if (!item) {
            return false;
        }

        const currentItem = item.texture.key;

        // Chercher la recette de cuisson au four
        const cookingRecipe = this.recipeManager.getOvenCooking(currentItem);

        if (!cookingRecipe) {
            return false;
        }

        // Remplacer l'objet par le résultat de la cuisson
        item.setTexture(cookingRecipe.to);

        this.playCookingEffect(gridX, gridY);

        return true;
    }

    /**
     * Affiche un effet de cuisson (particules de feu)
     */
    protected playCookingEffect(gridX: number, gridY: number): void {
        const screenPos = IsometricUtils.gridToScreen(gridX, gridY);
        const x = screenPos.x + this.mapOffsetX;
        const y = screenPos.y + this.mapOffsetY;

        // Effet de particules orange/rouge pour simuler le feu
        const particles = this.scene.add.particles(x, y, "star", {
            speed: PARTICLE_CONSTANTS.FIRE.SPEED,
            angle: PARTICLE_CONSTANTS.FIRE.ANGLE,
            scale: PARTICLE_CONSTANTS.FIRE.SCALE,
            lifespan: TIME_CONSTANTS.PARTICLE_LIFESPAN_FIRE,
            quantity: PARTICLE_CONSTANTS.FIRE.QUANTITY,
            tint: PARTICLE_CONSTANTS.FIRE.TINT,
            blendMode: PARTICLE_CONSTANTS.FIRE.BLEND_MODE,
        });

        // Tracker les particules actives
        this.activeParticles.push(particles);

        this.scene.time.delayedCall(
            TIME_CONSTANTS.PARTICLE_LIFESPAN_FIRE,
            () => {
                const index = this.activeParticles.indexOf(particles);
                if (index > -1) {
                    this.activeParticles.splice(index, 1);
                }
                if (particles && particles.scene) {
                    particles.destroy();
                }
            }
        );
    }

    /**
     * Obtient le nom de l'appareil
     */
    protected getDeviceName(): string {
        return "Four";
    }

    /**
     * Nettoie toutes les ressources (override de la méthode parent)
     */
    cleanup(): void {
        // Nettoyer les particules actives
        this.activeParticles.forEach((particles) => {
            if (particles && particles.scene) {
                particles.destroy();
            }
        });
        this.activeParticles = [];

        // Nettoyer les timers de cuisson
        this.cookingTimers.forEach((timer) => {
            if (timer.timerText) {
                timer.timerText.destroy();
            }
        });
        this.cookingTimers.clear();

        // Nettoyer les échecs de cuisson
        this.cookingFailures.clear();

        // Appeler le cleanup parent
        super.cleanup();
    }
}


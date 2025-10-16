import Phaser from "phaser";
import { IsometricUtils } from "../utils/IsometricUtils";
import { RecipeManager } from "./RecipeManager";
import { VisualEffectsManager } from "./VisualEffectsManager";
import { SCALE_CONSTANTS, DEPTH_CONSTANTS } from "../config/Constants";

/**
 * Classe abstraite de base pour les gestionnaires de cuisson (Four, Casserole, etc.)
 * Factorise le code commun entre OvenManager et CasseroleManager
 */
export abstract class BaseCookingManager {
    protected scene: Phaser.Scene;
    protected itemsInDevice: Map<string, Phaser.GameObjects.Image> = new Map();
    protected mapOffsetX: number;
    protected mapOffsetY: number;
    protected recipeManager: RecipeManager;
    protected cookingSpeedMultiplier: number = 1.0;
    protected visualEffects: VisualEffectsManager;

    constructor(
        scene: Phaser.Scene,
        mapOffsetX: number,
        mapOffsetY: number,
        recipeManager: RecipeManager
    ) {
        this.scene = scene;
        this.mapOffsetX = mapOffsetX;
        this.mapOffsetY = mapOffsetY;
        this.recipeManager = recipeManager;
        this.visualEffects = new VisualEffectsManager(scene, mapOffsetX, mapOffsetY);
    }

    /**
     * Place un objet dans l'appareil de cuisson
     */
    placeItem(gridX: number, gridY: number, itemType: string): boolean {
        const key = `${gridX},${gridY}`;

        // Vérifier s'il n'y a pas déjà un objet dans l'appareil
        if (this.itemsInDevice.has(key)) {
            return false;
        }

        // Calculer la position à l'écran
        const screenPos = IsometricUtils.gridToScreen(gridX, gridY);
        const x = screenPos.x + this.mapOffsetX;
        const y = screenPos.y + this.mapOffsetY;

        // Créer une image simple
        const item = this.scene.add.image(x, y, itemType);
        item.setOrigin(0.5, 0.5);
        item.setScale(SCALE_CONSTANTS.ITEM_IN_OVEN);
        item.setDepth(y + DEPTH_CONSTANTS.ITEM_ON_COUNTER_OFFSET);
        this.itemsInDevice.set(key, item);
        return true;
    }

    /**
     * Retire un objet de l'appareil
     */
    removeItem(gridX: number, gridY: number): string | null {
        const key = `${gridX},${gridY}`;
        const item = this.itemsInDevice.get(key);

        if (item) {
            const itemType = item.texture.key;
            item.destroy();
            this.itemsInDevice.delete(key);
            return itemType;
        }

        return null;
    }

    /**
     * Vérifie si l'appareil contient un objet
     */
    hasItem(gridX: number, gridY: number): boolean {
        const key = `${gridX},${gridY}`;
        return this.itemsInDevice.has(key);
    }

    /**
     * Récupère le type d'objet dans l'appareil
     */
    getItemType(gridX: number, gridY: number): string | null {
        const key = `${gridX},${gridY}`;
        const item = this.itemsInDevice.get(key);
        return item ? item.texture.key : null;
    }

    /**
     * Cuire/transformer un objet dans l'appareil
     * Méthode abstraite - chaque appareil définit ses propres recettes de cuisson
     */
    abstract cook(gridX: number, gridY: number): boolean;

    /**
     * Affiche un message temporaire au-dessus de l'appareil
     */
    showCookingMessage(message: string, gridX: number, gridY: number): void {
        this.visualEffects.showCookingMessage(message, gridX, gridY);
    }

    /**
     * Méthode abstraite pour l'effet visuel de cuisson
     * Permet aux classes dérivées de personnaliser l'effet
     */
    protected abstract playCookingEffect(gridX: number, gridY: number): void;

    /**
     * Applique un multiplicateur de vitesse de cuisson (pour les upgrades)
     */
    applyCookingSpeedMultiplier(multiplier: number): void {
        this.cookingSpeedMultiplier = multiplier;
    }

    /**
     * Nettoie tous les appareils
     */
    cleanup(): void {
        this.itemsInDevice.forEach((item) => {
            if (item && item.scene) {
                item.destroy();
            }
        });
        this.itemsInDevice.clear();
    }

    /**
     * Obtient le nom de l'appareil (pour les messages personnalisés)
     */
    protected abstract getDeviceName(): string;
}


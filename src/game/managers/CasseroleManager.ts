import Phaser from "phaser";
import { OVEN_COOKING } from "../data/recipes";
import { IsometricUtils } from "../utils/IsometricUtils";
import { RecipeManager } from "./RecipeManager";

/**
 * Gestionnaire des interactions avec la casserole
 * Permet de faire fondre le beurre et transformer le sucre en caramel
 */
export class CasseroleManager {
    private scene: Phaser.Scene;
    private itemsInCasserole: Map<string, Phaser.GameObjects.Image> = new Map();
    private mapOffsetX: number;
    private mapOffsetY: number;
    private recipeManager: RecipeManager;
    private cookingSpeedMultiplier: number = 1.0;

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
    }

    /**
     * Place un objet dans la casserole
     */
    placeItemInCasserole(gridX: number, gridY: number, itemType: string): boolean {
        const key = `${gridX},${gridY}`;

        // Vérifier s'il n'y a pas déjà un objet dans la casserole
        if (this.itemsInCasserole.has(key)) {
            return false;
        }

        // Calculer la position à l'écran
        const screenPos = IsometricUtils.gridToScreen(gridX, gridY);
        const x = screenPos.x + this.mapOffsetX;
        const y = screenPos.y + this.mapOffsetY;

        // Créer une image simple
        const item = this.scene.add.image(x, y, itemType);
        item.setOrigin(0.5, 0.5);
        item.setScale(1.2);
        item.setDepth(y + 100);
        this.itemsInCasserole.set(key, item);
        return true;
    }

    /**
     * Retire un objet de la casserole
     */
    removeItemFromCasserole(gridX: number, gridY: number): string | null {
        const key = `${gridX},${gridY}`;
        const item = this.itemsInCasserole.get(key);
        if (item) {
            const textureKey = item.texture.key;
            item.destroy();
            this.itemsInCasserole.delete(key);
            return textureKey;
        }
        return null;
    }

    /**
     * Vérifie s'il y a un objet dans la casserole
     */
    hasItemInCasserole(gridX: number, gridY: number): boolean {
        const key = `${gridX},${gridY}`;
        return this.itemsInCasserole.has(key);
    }

    /**
     * Obtient le type d'objet dans la casserole
     */
    getItemInCasserole(gridX: number, gridY: number): string | null {
        const key = `${gridX},${gridY}`;
        const item = this.itemsInCasserole.get(key);
        return item ? item.texture.key : null;
    }

    /**
     * Cuire/transformer un objet dans la casserole
     * Utilise les mêmes recettes que le four pour beurre->molten_butter et sucre->caramel
     */
    cookInCasserole(gridX: number, gridY: number): boolean {
        const key = `${gridX},${gridY}`;
        const item = this.itemsInCasserole.get(key);
        
        if (!item) {
            return false;
        }

        const currentItem = item.texture.key;

        // Chercher la recette de transformation
        const cookingRecipe = OVEN_COOKING.find(recipe => recipe.from === currentItem);
        
        if (!cookingRecipe) {
            this.showCookingMessage("❌ Ne peut pas cuire ça !", gridX, gridY);
            return false;
        }


        // Remplacer l'objet par le résultat de la cuisson
        item.setTexture(cookingRecipe.to);
        
        this.showCookingMessage(`✅ ${cookingRecipe.name} !`, gridX, gridY);
        
        return true;
    }

    /**
     * Affiche un message temporaire au-dessus de la casserole
     */
    showCookingMessage(message: string, gridX: number, gridY: number): void {
        const screenPos = IsometricUtils.gridToScreen(gridX, gridY);
        const x = screenPos.x + this.mapOffsetX;
        const y = screenPos.y + this.mapOffsetY;

        const text = this.scene.add.text(x, y - 50, message, {
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
        });
        text.setOrigin(0.5, 0.5);
        text.setDepth(1000);

        // Faire disparaître le message après 2 secondes
        this.scene.time.delayedCall(2000, () => {
            if (text && text.scene) {
                text.destroy();
            }
        });
    }

    /**
     * Applique un multiplicateur de vitesse de cuisson (pour les upgrades)
     */
    public applyCookingSpeedMultiplier(multiplier: number): void {
        this.cookingSpeedMultiplier = multiplier;
    }

    /**
     * Nettoie toutes les casseroles
     */
    cleanup(): void {
        this.itemsInCasserole.forEach((item) => {
            if (item && item.scene) {
                item.destroy();
            }
        });
        this.itemsInCasserole.clear();
    }
}

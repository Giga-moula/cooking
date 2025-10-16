import Phaser from "phaser";
import { IsometricUtils } from "../utils/IsometricUtils";
import { RecipeManager } from "./RecipeManager";
import { BaseCookingManager } from "./BaseCookingManager";

/**
 * Gestionnaire des interactions avec la casserole
 * Permet de faire fondre le beurre et transformer le sucre en caramel
 */
export class CasseroleManager extends BaseCookingManager {
    constructor(
        scene: Phaser.Scene,
        mapOffsetX: number,
        mapOffsetY: number,
        recipeManager: RecipeManager
    ) {
        super(scene, mapOffsetX, mapOffsetY, recipeManager);
    }

    /**
     * Place un objet dans la casserole
     */
    placeItemInCasserole(gridX: number, gridY: number, itemType: string): boolean {
        return this.placeItem(gridX, gridY, itemType);
    }

    /**
     * Retire un objet de la casserole
     */
    removeItemFromCasserole(gridX: number, gridY: number): string | null {
        return this.removeItem(gridX, gridY);
    }

    /**
     * Vérifie s'il y a un objet dans la casserole
     */
    hasItemInCasserole(gridX: number, gridY: number): boolean {
        return this.hasItem(gridX, gridY);
    }

    /**
     * Obtient le type d'objet dans la casserole
     */
    getItemInCasserole(gridX: number, gridY: number): string | null {
        return this.getItemType(gridX, gridY);
    }

    /**
     * Cuire/transformer un objet dans la casserole
     */
    cookInCasserole(gridX: number, gridY: number): boolean {
        return this.cook(gridX, gridY);
    }

    /**
     * Cuire un objet dans la casserole
     * Casserole : Sucre + Beurre uniquement
     */
    cook(gridX: number, gridY: number): boolean {
        const key = `${gridX},${gridY}`;
        const item = this.itemsInDevice.get(key);

        if (!item) {
            return false;
        }

        const currentItem = item.texture.key;

        // Chercher la recette de cuisson à la casserole
        const cookingRecipe = this.recipeManager.getCasseroleCooking(currentItem);

        if (!cookingRecipe) {
            this.showCookingMessage("❌ Ne peut pas cuire ça à la casserole !", gridX, gridY);
            return false;
        }

        // Remplacer l'objet par le résultat de la cuisson
        item.setTexture(cookingRecipe.to);

        this.showCookingMessage(`✅ ${cookingRecipe.name} !`, gridX, gridY);
        this.playCookingEffect(gridX, gridY);

        return true;
    }

    /**
     * Effet visuel de cuisson pour la casserole (vapeur/bulles)
     */
    protected playCookingEffect(gridX: number, gridY: number): void {
        const screenPos = IsometricUtils.gridToScreen(gridX, gridY);
        const x = screenPos.x + this.mapOffsetX;
        const y = screenPos.y + this.mapOffsetY;

        // Effet de particules bleues/blanches pour simuler la vapeur
        const particles = this.scene.add.particles(x, y, "star", {
            speed: { min: -30, max: 30 },
            angle: { min: 270, max: 270 }, // Particules qui montent
            scale: { start: 0.2, end: 0 },
            lifespan: 1000,
            quantity: 8,
            tint: 0x87ceeb, // Couleur bleu ciel
            blendMode: "ADD",
        });

        this.scene.time.delayedCall(1000, () => {
            particles.destroy();
        });
    }

    /**
     * Obtient le nom de l'appareil
     */
    protected getDeviceName(): string {
        return "Casserole";
    }
}

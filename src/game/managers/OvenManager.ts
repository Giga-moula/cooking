import Phaser from "phaser";
import { IsometricUtils } from "../utils/IsometricUtils";
import { RecipeManager } from "./RecipeManager";
import { BaseCookingManager } from "./BaseCookingManager";

/**
 * Gestionnaire des interactions avec le four
 * Permet de faire fondre le beurre et cuire les cookies
 */
export class OvenManager extends BaseCookingManager {
    constructor(
        scene: Phaser.Scene,
        mapOffsetX: number,
        mapOffsetY: number,
        recipeManager: RecipeManager
    ) {
        super(scene, mapOffsetX, mapOffsetY, recipeManager);
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
     * Effectue la cuisson dans le four
     */
    performCooking(gridX: number, gridY: number): boolean {
        return this.cook(gridX, gridY);
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
            speed: { min: -50, max: 50 },
            angle: { min: 270, max: 90 }, // Particules qui montent
            scale: { start: 0.3, end: 0 },
            lifespan: 800,
            quantity: 10,
            tint: 0xff4500, // Couleur orange-rouge
            blendMode: "ADD",
        });

        this.scene.time.delayedCall(800, () => {
            particles.destroy();
        });
    }

    /**
     * Obtient le nom de l'appareil
     */
    protected getDeviceName(): string {
        return "Four";
    }
}


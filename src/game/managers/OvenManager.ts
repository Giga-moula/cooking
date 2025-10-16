import Phaser from "phaser";
import { IsometricUtils } from "../utils/IsometricUtils";
import { RecipeManager } from "./RecipeManager";
import { BaseCookingManager } from "./BaseCookingManager";

/**
 * Gestionnaire des interactions avec le four
 * Permet de faire fondre le beurre et cuire les cookies
 */
export class OvenManager extends BaseCookingManager {
    // Suivi des échecs de cuisson pour chaque four
    private cookingFailures: Map<string, number> = new Map();
    private readonly MAX_FAILURES_BEFORE_BURN = 3;

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

        console.log(
            `Four ${key}: Échec ${newFailures}/${this.MAX_FAILURES_BEFORE_BURN}`
        );

        // Si 3 échecs atteints, brûler le cookie
        if (newFailures >= this.MAX_FAILURES_BEFORE_BURN) {
            item.setTexture("cookie-dead");
            this.cookingFailures.delete(key); // Reset le compteur
            this.playCookingEffect(gridX, gridY);
            console.log(`Four ${key}: Cookie brûlé !`);
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
     * Cuire un objet dans le four
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

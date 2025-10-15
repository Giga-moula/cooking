import Phaser from "phaser";
import { OVEN_COOKING } from "../data/recipes";
import { IsometricUtils } from "../utils/IsometricUtils";
import { RecipeManager } from "./RecipeManager";

/**
 * Gestionnaire des interactions avec le four
 * Permet de faire fondre le beurre et cuire les cookies
 */
export class OvenManager {
    private scene: Phaser.Scene;
    private itemsInOven: Map<string, Phaser.GameObjects.Image> = new Map();
    private mapOffsetX: number;
    private mapOffsetY: number;
    private recipeManager: RecipeManager;

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
     * Place un objet dans le four
     */
    placeItemInOven(gridX: number, gridY: number, itemType: string): boolean {
        console.log(
            `placeItemInOven appelée pour (${gridX}, ${gridY}) avec ${itemType}`
        );
        const key = `${gridX},${gridY}`;

        // Vérifier s'il n'y a pas déjà un objet dans le four
        if (this.itemsInOven.has(key)) {
            console.log(`Objet déjà présent dans le four (${gridX}, ${gridY})`);
            return false;
        }

        // Calculer la position à l'écran
        const screenPos = IsometricUtils.gridToScreen(gridX, gridY);
        const x = screenPos.x + this.mapOffsetX;
        const y = screenPos.y + this.mapOffsetY;

        console.log(`Position écran calculée: (${x}, ${y})`);

        // Créer une image simple
        const item = this.scene.add.image(x, y, itemType);
        item.setOrigin(0.5, 0.5);
        item.setScale(1.2);
        item.setDepth(y + 100);
        this.itemsInOven.set(key, item);
        console.log(
            `Objet ${itemType} placé avec succès dans le four (${gridX}, ${gridY})`
        );
        return true;
    }

    /**
     * Retire un objet du four
     */
    removeItemFromOven(gridX: number, gridY: number): string | null {
        const key = `${gridX},${gridY}`;
        const item = this.itemsInOven.get(key);

        if (item) {
            const itemType = item.texture.key;
            item.destroy();
            this.itemsInOven.delete(key);
            return itemType;
        }

        return null;
    }

    /**
     * Vérifie si le four contient un objet
     */
    hasItemInOven(gridX: number, gridY: number): boolean {
        const key = `${gridX},${gridY}`;
        const hasItem = this.itemsInOven.has(key);
        console.log(`hasItemInOven(${gridX}, ${gridY}): ${hasItem}`);
        return hasItem;
    }

    /**
     * Récupère le type d'objet dans le four
     */
    getItemTypeInOven(gridX: number, gridY: number): string | null {
        const key = `${gridX},${gridY}`;
        const item = this.itemsInOven.get(key);
        return item ? item.texture.key : null;
    }

    /**
     * Effectue la cuisson dans le four
     * @param gridX Position X de la grille
     * @param gridY Position Y de la grille
     * @returns true si une cuisson a eu lieu, false sinon
     */
    performCooking(gridX: number, gridY: number): boolean {
        const key = `${gridX},${gridY}`;
        const item = this.itemsInOven.get(key);

        if (!item) return false;

        const currentType = item.texture.key;

        // Chercher une recette de cuisson correspondante
        const cookingRecipe = OVEN_COOKING.find(
            (recipe) => recipe.from === currentType
        );

        if (cookingRecipe) {
            this.cookItem(
                gridX,
                gridY,
                cookingRecipe.to,
                `🔥 ${cookingRecipe.name}`
            );
            return true;
        }

        return false;
    }

    /**
     * Cuit un item en un autre
     */
    private cookItem(
        gridX: number,
        gridY: number,
        newType: string,
        message: string
    ): void {
        const key = `${gridX},${gridY}`;
        const item = this.itemsInOven.get(key);

        if (item) {
            // Changer la texture
            item.setTexture(newType);
            // Afficher le message de cuisson
            this.showCookingMessage(message, gridX, gridY);
            // Effet visuel
            this.playCookingEffect(gridX, gridY);
        }
    }

    /**
     * Affiche un effet de cuisson (particules de feu)
     */
    playCookingEffect(gridX: number, gridY: number): void {
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
     * Affiche un message de cuisson
     */
    showCookingMessage(text: string, gridX: number, gridY: number): void {
        const screenPos = IsometricUtils.gridToScreen(gridX, gridY);
        const x = screenPos.x + this.mapOffsetX;
        const y = screenPos.y + this.mapOffsetY - 50;

        const message = this.scene.add.text(x, y, text, {
            fontFamily: "Arial",
            fontSize: "24px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4,
        });
        message.setOrigin(0.5);

        // Animation de montée et disparition
        this.scene.tweens.add({
            targets: message,
            y: y - 30,
            alpha: 0,
            duration: 1000,
            ease: "Cubic.easeOut",
            onComplete: () => message.destroy(),
        });
    }
}


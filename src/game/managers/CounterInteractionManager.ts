import Phaser from "phaser";
import { IsometricUtils } from "../utils/IsometricUtils";

/**
 * Gestionnaire des interactions avec les comptoirs et des objets posés
 */
export class CounterInteractionManager {
    private scene: Phaser.Scene;
    private itemsOnCounters: Map<string, Phaser.GameObjects.Image> = new Map();
    private mapOffsetX: number;
    private mapOffsetY: number;
    private inventoryManager?: any; // Référence vers l'inventory manager

    constructor(scene: Phaser.Scene, mapOffsetX: number, mapOffsetY: number) {
        this.scene = scene;
        this.mapOffsetX = mapOffsetX;
        this.mapOffsetY = mapOffsetY;
    }

    /**
     * Définit la référence vers l'inventory manager
     */
    setInventoryManager(inventoryManager: any): void {
        this.inventoryManager = inventoryManager;
    }

    /**
     * Place un objet sur un comptoir
     */
    placeItemOnCounter(
        gridX: number,
        gridY: number,
        itemType: string
    ): boolean {
        console.log(`placeItemOnCounter appelée pour (${gridX}, ${gridY}) avec ${itemType}`);
        const key = `${gridX},${gridY}`;

        // Vérifier s'il n'y a pas déjà un objet sur ce plan de travail
        if (this.itemsOnCounters.has(key)) {
            console.log(`Objet déjà présent sur (${gridX}, ${gridY})`);
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
        this.itemsOnCounters.set(key, item);
        console.log(`Objet ${itemType} placé avec succès sur (${gridX}, ${gridY})`);
        return true;
    }

    /**
     * Retire un objet d'un comptoir
     */
    removeItemFromCounter(gridX: number, gridY: number): string | null {
        const key = `${gridX},${gridY}`;
        const item = this.itemsOnCounters.get(key);

        if (item) {
            const itemType = item.texture.key;
            item.destroy();
            this.itemsOnCounters.delete(key);
            return itemType;
        }

        return null;
    }

    /**
     * Vérifie si un comptoir a un objet
     */
    hasItemOnCounter(gridX: number, gridY: number): boolean {
        const key = `${gridX},${gridY}`;
        const hasItem = this.itemsOnCounters.has(key);
        console.log(`hasItemOnCounter(${gridX}, ${gridY}): ${hasItem}`);
        return hasItem;
    }

    /**
     * Récupère le type d'objet sur un comptoir
     */
    getItemTypeOnCounter(gridX: number, gridY: number): string | null {
        const key = `${gridX},${gridY}`;
        const item = this.itemsOnCounters.get(key);
        return item ? item.texture.key : null;
    }

    /**
     * Affiche un effet de fusion (particules)
     */
    playFusionEffect(gridX: number, gridY: number): void {
        const screenPos = IsometricUtils.gridToScreen(gridX, gridY);
        const x = screenPos.x + this.mapOffsetX;
        const y = screenPos.y + this.mapOffsetY;
            const particles = this.scene.add.particles(x, y, "star", {
                speed: { min: -100, max: 100 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.5, end: 0 },
                lifespan: 600,
                quantity: 15,
                blendMode: "ADD",
            });

            this.scene.time.delayedCall(600, () => {
                particles.destroy();
            });
    }

    /**
     * Affiche un message de combinaison
     */
    showCombinationMessage(text: string, gridX: number, gridY: number): void {
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

    /**
     * Effectue une transformation d'ingrédients sur une tile spéciale (type 10)
     * @param gridX Position X de la grille
     * @param gridY Position Y de la grille
     * @returns true si une transformation a eu lieu, false sinon
     */
    performSpecialTransformation(gridX: number, gridY: number): boolean {
        const key = `${gridX},${gridY}`;
        const item = this.itemsOnCounters.get(key);

        if (!item) return false;

        const currentType = item.texture.key;
        
        // Transformation 1: Chocolat → Chunks de chocolat
        if (currentType === "chocolate") {
            this.transformItem(gridX, gridY, "chocolate-chunks", "🍫 Chocolat → Chunks");
            return true;
        }
        
        // Transformation 2: Beurre + Farine → Pâte
        if (currentType === "butter") {
            // Chercher de la farine dans l'inventaire
            if (this.hasIngredientAvailable("wheat_floor")) {
                this.consumeIngredient("wheat_floor");
                this.transformItem(gridX, gridY, "dough", "🧈 Beurre + Farine → Pâte");
                return true;
            }
        }
        
        if (currentType === "wheat_floor") {
            // Chercher du beurre dans l'inventaire
            if (this.hasIngredientAvailable("butter")) {
                this.consumeIngredient("butter");
                this.transformItem(gridX, gridY, "dough", "🌾 Farine + Beurre → Pâte");
                return true;
            }
        }
        
        // Transformation 3: Pâte + Chunks de chocolat → Cookie Mix
        if (currentType === "dough") {
            if (this.hasIngredientAvailable("chocolate-chunks")) {
                this.consumeIngredient("chocolate-chunks");
                this.transformItem(gridX, gridY, "cookie-mix", "🥣 Pâte + Chunks → Cookie Mix");
                return true;
            }
        }
        
        if (currentType === "chocolate-chunks") {
            if (this.hasIngredientAvailable("dough")) {
                this.consumeIngredient("dough");
                this.transformItem(gridX, gridY, "cookie-mix", "🍫 Chunks + Pâte → Cookie Mix");
                return true;
            }
        }

        return false;
    }

    /**
     * Transforme un item en un autre
     */
    private transformItem(gridX: number, gridY: number, newType: string, message: string): void {
        const key = `${gridX},${gridY}`;
        const item = this.itemsOnCounters.get(key);
        
        if (item) {
            // Changer la texture
            item.setTexture(newType);
            // Afficher le message de transformation
            this.showCombinationMessage(message, gridX, gridY);
            // Effet visuel
            this.playFusionEffect(gridX, gridY);
        }
    }

    /**
     * Vérifie si un ingrédient est disponible (dans l'inventaire du joueur)
     */
    private hasIngredientAvailable(ingredientType: string): boolean {
        if (!this.inventoryManager) return false;
        return this.inventoryManager.hasItem(ingredientType);
    }

    /**
     * Consomme un ingrédient de l'inventaire du joueur
     */
    private consumeIngredient(ingredientType: string): boolean {
        if (!this.inventoryManager) return false;
        return this.inventoryManager.removeSpecificItem(ingredientType);
    }
}


import Phaser from "phaser";
import { IsometricUtils } from "../utils/IsometricUtils";
import { RecipeManager } from "./RecipeManager";

/**
 * Gestionnaire des interactions avec les comptoirs et des objets posés
 */
export class CounterInteractionManager {
    private scene: Phaser.Scene;
    private itemsOnCounters: Map<string, Phaser.GameObjects.Image> = new Map();
    private mapOffsetX: number;
    private mapOffsetY: number;
    private inventoryManager?: any; // Référence vers l'inventory manager
    private recipeManager?: RecipeManager; // Référence vers le RecipeManager partagé

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
     * Définit la référence vers le RecipeManager partagé
     */
    setRecipeManager(recipeManager: RecipeManager): void {
        this.recipeManager = recipeManager;
    }

    /**
     * Place un objet sur un comptoir
     */
    placeItemOnCounter(
        gridX: number,
        gridY: number,
        itemType: string
    ): boolean {
        const key = `${gridX},${gridY}`;

        // Vérifier s'il n'y a pas déjà un objet sur ce plan de travail
        if (this.itemsOnCounters.has(key)) {
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
        this.itemsOnCounters.set(key, item);
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
     * Effectue une transformation d'ingrédients sur une table de transformation (type 10)
     * @param gridX Position X de la grille
     * @param gridY Position Y de la grille
     * @param playerInventory Inventaire du joueur effectuant la transformation (optionnel)
     * @returns true si une transformation a eu lieu, false sinon
     */
    performSpecialTransformation(gridX: number, gridY: number, playerInventory?: any): boolean {
        const key = `${gridX},${gridY}`;
        const item = this.itemsOnCounters.get(key);

        if (!item) return false;

        const currentType = item.texture.key;
        console.log(`🔍 Transformation sur table: ${currentType}, inventaire:`, playerInventory ? 'présent' : 'absent');
        
        // Vérifier d'abord les transformations spéciales (1 ingrédient → 1 autre)
        if (this.recipeManager) {
            const specialResult = this.recipeManager.performSpecialTransformation(currentType);
            if (specialResult) {
                const ingredient = this.recipeManager.getIngredient(specialResult);
                const message = ingredient ? `✨ ${ingredient.name}` : `✨ Transformation`;
                this.transformItem(gridX, gridY, specialResult, message);
                return true;
            }
            
            // Si un inventaire est fourni, essayer les recettes (2 ingrédients → 1 résultat)
            if (playerInventory) {
                // Essayer toutes les recettes possibles avec l'ingrédient sur la table
                const allRecipes = this.recipeManager.getAllRecipes();
                
                for (const recipe of allRecipes) {
                    // Vérifier si l'ingrédient sur la table correspond à ingredient1 ou ingredient2
                    if (currentType === recipe.ingredient1 || currentType === recipe.ingredient2) {
                        const neededIngredient = currentType === recipe.ingredient1 
                            ? recipe.ingredient2 
                            : recipe.ingredient1;
                        
                        // Vérifier si le joueur a l'ingrédient nécessaire
                        console.log(`🔍 Vérification recette: ${currentType} + ${neededIngredient} = ${recipe.result}`);
                        if (playerInventory.hasItem && playerInventory.hasItem(neededIngredient)) {
                            console.log(`✅ Ingrédient ${neededIngredient} trouvé dans l'inventaire`);
                            if (playerInventory.removeSpecificItem && playerInventory.removeSpecificItem(neededIngredient)) {
                                const ingredient = this.recipeManager.getIngredient(recipe.result);
                                const message = ingredient ? `✨ ${ingredient.name}` : `✨ ${recipe.name}`;
                                console.log(`🎉 Recette réussie: ${message}`);
                                this.transformItem(gridX, gridY, recipe.result, message);
                                return true;
                            }
                        } else {
                            console.log(`❌ Ingrédient ${neededIngredient} manquant dans l'inventaire`);
                        }
                    }
                }
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
     * @deprecated Utiliser playerInventory.hasItem() directement
     */
    private hasIngredientAvailable(ingredientType: string): boolean {
        if (!this.inventoryManager) return false;
        return this.inventoryManager.hasItem(ingredientType);
    }

    /**
     * Consomme un ingrédient de l'inventaire du joueur
     * @deprecated Utiliser playerInventory.removeSpecificItem() directement
     */
    private consumeIngredient(ingredientType: string): boolean {
        if (!this.inventoryManager) return false;
        return this.inventoryManager.removeSpecificItem(ingredientType);
    }
}


import { GameConfig } from "../config/GameConfig";

/**
 * Classe utilitaire pour la validation des données du jeu
 */
export class GameValidator {
    /**
     * Valide les coordonnées de grille
     */
    static isValidGridPosition(x: number, y: number): boolean {
        return x >= 0 && x < GameConfig.MAP_WIDTH && 
               y >= 0 && y < GameConfig.MAP_HEIGHT;
    }

    /**
     * Valide un ID d'ingrédient
     */
    static isValidIngredientId(id: string): boolean {
        const validIds = Object.values(GameConfig.TEXTURE_KEYS);
        return validIds.includes(id as any);
    }

    /**
     * Valide un ID de joueur
     */
    static isValidPlayerNumber(playerNumber: number): boolean {
        return playerNumber === 1 || playerNumber === 2;
    }

    /**
     * Valide une texture
     */
    static isValidTexture(texture: string): boolean {
        return texture !== "__MISSING" && texture.length > 0;
    }

    /**
     * Valide un objet Phaser
     */
    static isValidPhaserObject(obj: any): boolean {
        return obj && typeof obj === 'object' && obj.scene;
    }

    /**
     * Valide un inventaire
     */
    static isValidInventory(inventory: any): boolean {
        return inventory && 
               typeof inventory.addItem === 'function' &&
               typeof inventory.removeItem === 'function' &&
               typeof inventory.isEmpty === 'function';
    }

    /**
     * Valide une recette
     */
    static isValidRecipe(recipe: any): boolean {
        return recipe &&
               typeof recipe.id === 'string' &&
               typeof recipe.ingredient1 === 'string' &&
               typeof recipe.ingredient2 === 'string' &&
               typeof recipe.result === 'string' &&
               typeof recipe.name === 'string';
    }

    /**
     * Valide les paramètres d'un constructeur de manager
     */
    static validateManagerParams(scene: any, mapOffsetX: number, mapOffsetY: number): boolean {
        return this.isValidPhaserObject(scene) &&
               typeof mapOffsetX === 'number' &&
               typeof mapOffsetY === 'number' &&
               mapOffsetX >= 0 &&
               mapOffsetY >= 0;
    }
}

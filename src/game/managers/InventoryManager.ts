import Phaser from "phaser";
import { GameConfig } from "../config/GameConfig";

/**
 * Gestionnaire de l'inventaire et des objets portés
 */
export class InventoryManager {
    private scene: Phaser.Scene;
    private inventory: string[] = [];
    private carriedItem?: Phaser.GameObjects.Image;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }


    /**
     * Calcule les offsets pour l'objet porté en fonction de la direction
     * @private
     */
    private calculateCarriedItemOffset(lastDirection: { x: number; y: number }): { offsetX: number; offsetY: number } {
        const offsetDistance = GameConfig.INVENTORY.CARRIED_OFFSET_DISTANCE;
        let offsetX = lastDirection.x * offsetDistance;
        let offsetY = lastDirection.y * offsetDistance;

        // Ajustements selon la direction
        if (lastDirection.x !== 0) {
            offsetY += GameConfig.INVENTORY.OFFSET_HORIZONTAL_Y;
        }
        if (lastDirection.y === -1) {
            offsetY += GameConfig.INVENTORY.OFFSET_UP_Y;
        }
        if (lastDirection.y === 1) {
            offsetY += GameConfig.INVENTORY.OFFSET_DOWN_Y;
        }

        return { offsetX, offsetY };
    }

    /**
     * Crée un objet porté visible au-dessus du joueur
     */
    createCarriedItem(
        itemType: string,
        playerX: number,
        playerY: number,
        lastDirection: { x: number; y: number },
        playerDepth: number
    ): Phaser.GameObjects.Image {
        // Détruire l'objet porté précédent s'il existe
        if (this.carriedItem) {
            this.carriedItem.destroy();
        }

        // Calculer la position en utilisant la méthode factorisée
        const { offsetX, offsetY } = this.calculateCarriedItemOffset(lastDirection);

        // Créer le nouvel objet porté
        this.carriedItem = this.scene.add.image(
            playerX + offsetX,
            playerY + offsetY,
            itemType
        );
        this.carriedItem.setOrigin(0.5, 0.5);
        this.carriedItem.setScale(GameConfig.INVENTORY.CARRIED_SCALE);

        // Profondeur selon la direction
        if (lastDirection.y === -1) {
            this.carriedItem.setDepth(playerDepth - 1);
        } else {
            this.carriedItem.setDepth(playerDepth + 1);
        }

        return this.carriedItem;
    }

    /**
     * Met à jour la position de l'objet porté
     */
    updateCarriedItemPosition(
        playerX: number,
        playerY: number,
        lastDirection: { x: number; y: number }
    ): void {
        if (!this.carriedItem) return;

        // Utiliser la méthode factorisée
        const { offsetX, offsetY } = this.calculateCarriedItemOffset(lastDirection);
        this.carriedItem.setPosition(playerX + offsetX, playerY + offsetY);
    }

    /**
     * Supprime l'objet porté
     */
    removeCarriedItem(): void {
        if (this.carriedItem) {
            this.carriedItem.destroy();
            this.carriedItem = undefined;
        }
    }

    /**
     * Ajoute un objet à l'inventaire
     */
    addItem(itemType: string): boolean {
        if (this.inventory.length >= GameConfig.INVENTORY.MAX_ITEMS) return false; // Inventaire plein

        this.inventory.push(itemType);
        return true;
    }

    /**
     * Retire un objet de l'inventaire
     */
    removeItem(): string | null {
        if (this.inventory.length === 0) return null;

        const item = this.inventory.pop()!;
        return item;
    }

    /**
     * Récupère le premier objet de l'inventaire sans le retirer
     */
    peekItem(): string | null {
        return this.inventory.length > 0 ? this.inventory[0] : null;
    }

    /**
     * Vérifie si l'inventaire est vide
     */
    isEmpty(): boolean {
        return this.inventory.length === 0;
    }

    /**
     * Vérifie si l'inventaire est plein
     */
    isFull(): boolean {
        return this.inventory.length >= GameConfig.INVENTORY.MAX_ITEMS;
    }

    /**
     * Vérifie si un item spécifique est dans l'inventaire
     */
    hasItem(itemType: string): boolean {
        return this.inventory.includes(itemType);
    }

    /**
     * Retire un item spécifique de l'inventaire
     * @returns true si l'item a été retiré, false sinon
     */
    removeSpecificItem(itemType: string): boolean {
        const index = this.inventory.indexOf(itemType);
        if (index === -1) return false;

        this.inventory.splice(index, 1);
        
        // Si c'était l'item porté, détruire le visuel
        if (this.carriedItem && this.carriedItem.texture.key === itemType) {
            this.removeCarriedItem();
        }
        
        return true;
    }

    // Getters
    getCarriedItem(): Phaser.GameObjects.Image | undefined {
        return this.carriedItem;
    }

    /**
     * Récupère tous les ingrédients de l'inventaire
     */
    getAllIngredients(): string[] {
        return [...this.inventory];
    }
}


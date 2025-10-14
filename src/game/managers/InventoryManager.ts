import Phaser from "phaser";

/**
 * Gestionnaire de l'inventaire et des objets portés
 */
export class InventoryManager {
    private scene: Phaser.Scene;
    private inventory: string[] = [];
    private carriedItem?: Phaser.GameObjects.Image;
    private inventoryText?: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * Initialise l'affichage de l'inventaire
     */
    initializeInventoryDisplay(x: number = 10, y: number = 220): void {
        this.inventoryText = this.scene.add.text(x, y, "", {
            fontFamily: "Arial",
            fontSize: "14px",
            color: "#ffffff",
            backgroundColor: "#000000",
            padding: { x: 5, y: 5 },
        });
        this.inventoryText.setScrollFactor(0);
        this.inventoryText.setDepth(1000);
        this.updateInventoryDisplay();
    }

    /**
     * Met à jour l'affichage de l'inventaire
     */
    updateInventoryDisplay(): void {
        if (!this.inventoryText) return;

        if (this.inventory.length === 0) {
            this.inventoryText.setText("Inventaire: Vide (max: 1)");
        } else {
            this.inventoryText.setText(
                `Inventaire: ${this.inventory.join(", ")} (1/1)`
            );
        }
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

        // Calculer la position initiale en fonction de la direction actuelle
        const offsetDistance = 20;
        let offsetX = lastDirection.x * offsetDistance;
        let offsetY = lastDirection.y * offsetDistance;

        // Ajustements selon la direction
        if (lastDirection.x !== 0) {
            offsetY += 8;
        }
        if (lastDirection.y === -1) {
            offsetY += 15;
        }
        if (lastDirection.y === 1) {
            offsetY -= 5;
        }

        // Créer le nouvel objet porté
        this.carriedItem = this.scene.add.image(
            playerX + offsetX,
            playerY + offsetY,
            itemType
        );
        this.carriedItem.setOrigin(0.5, 0.5);
        this.carriedItem.setScale(0.8);

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

        const offsetDistance = 20;
        let offsetX = lastDirection.x * offsetDistance;
        let offsetY = lastDirection.y * offsetDistance;

        // Ajustements selon la direction
        if (lastDirection.x !== 0) {
            offsetY += 8;
        }
        if (lastDirection.y === -1) {
            offsetY += 15;
        }
        if (lastDirection.y === 1) {
            offsetY -= 5;
        }

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
        if (this.inventory.length >= 1) return false; // Inventaire plein

        this.inventory.push(itemType);
        this.updateInventoryDisplay();
        return true;
    }

    /**
     * Retire un objet de l'inventaire
     */
    removeItem(): string | null {
        if (this.inventory.length === 0) return null;

        const item = this.inventory.pop()!;
        this.updateInventoryDisplay();
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
        return this.inventory.length >= 1;
    }

    // Getters
    getCarriedItem(): Phaser.GameObjects.Image | undefined {
        return this.carriedItem;
    }
}


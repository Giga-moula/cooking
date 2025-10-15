import Phaser from "phaser";
import { BaseMapManager } from "./BaseMapManager";

/**
 * Classe de base pour les managers qui gèrent des objets sur la carte
 */
export abstract class BaseObjectManager extends BaseMapManager {
    protected objects: Map<string, Phaser.GameObjects.Image> = new Map();

    constructor(scene: Phaser.Scene, mapOffsetX: number, mapOffsetY: number) {
        super(scene, mapOffsetX, mapOffsetY);
    }

    /**
     * Place un objet à une position donnée
     */
    protected placeObject(
        gridX: number, 
        gridY: number, 
        itemType: string, 
        scale: number = 1.2,
        depthOffset: number = 100
    ): boolean {
        const key = this.getGridKey(gridX, gridY);
        
        if (this.objects.has(key)) {
            return false;
        }

        const screenPos = this.gridToScreen(gridX, gridY);
        const x = screenPos.x;
        const y = screenPos.y;

        const item = this.scene.add.image(x, y, itemType);
        item.setOrigin(0.5, 0.5);
        item.setScale(scale);
        item.setDepth(y + depthOffset);
        
        this.objects.set(key, item);
        return true;
    }

    /**
     * Retire un objet d'une position donnée
     */
    protected removeObject(gridX: number, gridY: number): string | null {
        const key = this.getGridKey(gridX, gridY);
        const item = this.objects.get(key);
        
        if (item) {
            const itemType = item.texture.key;
            item.destroy();
            this.objects.delete(key);
            return itemType;
        }
        
        return null;
    }

    /**
     * Vérifie si un objet existe à une position donnée
     */
    protected hasObject(gridX: number, gridY: number): boolean {
        return this.objects.has(this.getGridKey(gridX, gridY));
    }

    /**
     * Récupère le type d'objet à une position donnée
     */
    protected getObjectType(gridX: number, gridY: number): string | null {
        const item = this.objects.get(this.getGridKey(gridX, gridY));
        return item ? item.texture.key : null;
    }

    /**
     * Transforme un objet en un autre
     */
    protected transformObject(
        gridX: number, 
        gridY: number, 
        newType: string, 
        message: string
    ): void {
        const key = this.getGridKey(gridX, gridY);
        const item = this.objects.get(key);
        
        if (item) {
            item.setTexture(newType);
            this.showTemporaryMessage(message, gridX, gridY);
            this.createParticleEffect(gridX, gridY);
        }
    }

    /**
     * Nettoie tous les objets
     */
    public cleanup(): void {
        this.objects.forEach(item => item.destroy());
        this.objects.clear();
    }
}

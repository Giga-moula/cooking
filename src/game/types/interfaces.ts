/**
 * Interfaces TypeScript pour éviter les types 'any' dans le projet
 */

import { InventoryManager } from "../managers/InventoryManager";
import { CraftActions } from "../actions/CraftActions";

/**
 * Interface pour les joueurs
 */
export interface IPlayer {
    getPlayer(): Phaser.Physics.Arcade.Sprite | undefined;
    getPlayerGridX(): number;
    getPlayerGridY(): number;
    getLastDirection(): { x: number; y: number };
    getInventory(): InventoryManager;
    getPlayerNumber(): number;
    getPlayerColor(): string;
    getTargetPosition(): { x: number; y: number };
    getCraftActions(): CraftActions | null;
    updateCarriedItem(): void;
    removeCarriedItem(): void;
    update(): void;
    isInteractionPressed(): boolean;
    isTransformPressed(): boolean;
    setGridPosition(gridX: number, gridY: number): void;
    setMapManager(mapManager: any): void;
    applySpeedMultiplier(multiplier: number): void;
    setMovementEnabled(enabled: boolean): void;
}

/**
 * Interface pour le MapManager
 */
export interface IMapManager {
    getCurrentMapConfig(): any;
    isDeliveryZone(gridX: number, gridY: number): boolean;
    isIngredientTile(gridX: number, gridY: number): boolean;
    isOven(gridX: number, gridY: number): boolean;
    isCasserole(gridX: number, gridY: number): boolean;
    isTransformationTable(gridX: number, gridY: number): boolean;
    getTileTypeId(gridX: number, gridY: number): number | null;
}

/**
 * Interface pour l'InventoryManager
 */
export interface IInventoryManager {
    isEmpty(): boolean;
    addItem(itemType: string): boolean;
    removeItem(): string | null;
    peekItem(): string | null;
    getAllIngredients(): string[];
    hasItem(itemType: string): boolean;
    removeSpecificItem(itemType: string): boolean;
    clear(): void;
    getCarriedItem(): Phaser.GameObjects.Image | null;
    removeCarriedItem(): void;
    createCarriedItem(
        itemType: string,
        x: number,
        y: number,
        direction: { x: number; y: number },
        depth: number
    ): void;
    updateCarriedItemPosition(
        playerX: number,
        playerY: number,
        direction: { x: number; y: number }
    ): void;
}


/**
 * Gestionnaire des comptoirs de communication entre les joueurs
 */

import Phaser from "phaser";
import { IsometricUtils } from "../utils/IsometricUtils";
import { MapManager } from "./MapManager";
import { PlayerManager } from "./PlayerManager";

export interface CommunicationCounter {
    x: number;
    y: number;
    items: Map<string, number>; // Map des ingrédients disponibles
    maxItems: number;
}

export class CommunicationManager {
    private scene: Phaser.Scene;
    private mapManager: MapManager;
    private communicationCounters: CommunicationCounter[] = [];
    private mapOffsetX: number;
    private mapOffsetY: number;

    constructor(scene: Phaser.Scene, mapManager: MapManager, mapOffsetX: number, mapOffsetY: number) {
        this.scene = scene;
        this.mapManager = mapManager;
        this.mapOffsetX = mapOffsetX;
        this.mapOffsetY = mapOffsetY;
    }

    /**
     * Initialise les comptoirs de communication
     */
    initializeCommunicationCounters(): void {
        this.communicationCounters = [];
        
        // Trouver les comptoirs de communication (tables normales entre les zones)
        const mapData = this.mapManager.getCurrentMapConfig().mapData;
        
        for (let y = 0; y < mapData.length; y++) {
            for (let x = 0; x < mapData[y].length; x++) {
                if (mapData[y][x] === 5) { // Table normale
                    // Vérifier si c'est un comptoir de communication
                    if (this.isCommunicationCounter(x, y, mapData)) {
                        this.communicationCounters.push({
                            x,
                            y,
                            items: new Map(),
                            maxItems: 3 // Maximum 3 ingrédients par comptoir
                        });
                    }
                }
            }
        }
        
        console.log(`📡 ${this.communicationCounters.length} comptoirs de communication initialisés`);
    }

    /**
     * Vérifie si une position est un comptoir de communication
     */
    private isCommunicationCounter(x: number, y: number, mapData: number[][]): boolean {
        // Un comptoir de communication est une table normale qui est accessible des deux côtés
        // ou qui est proche de la frontière entre les zones des joueurs
        
        const mapWidth = mapData[0].length;
        const centerX = Math.floor(mapWidth / 2);
        
        // Vérifier si c'est proche du centre (frontière entre les zones)
        return Math.abs(x - centerX) <= 1;
    }

    /**
     * Dépose un ingrédient sur un comptoir de communication
     */
    depositIngredient(player: PlayerManager, ingredientType: string, counterIndex: number = 0): boolean {
        if (counterIndex >= this.communicationCounters.length) return false;
        
        const counter = this.communicationCounters[counterIndex];
        
        // Vérifier si le comptoir a de la place
        if (counter.items.size >= counter.maxItems) {
            console.log(`❌ Comptoir de communication plein`);
            return false;
        }
        
        // Vérifier si le joueur a l'ingrédient
        const inventory = player.getInventory();
        if (!inventory.hasIngredient(ingredientType)) {
            console.log(`❌ Joueur n'a pas l'ingrédient ${ingredientType}`);
            return false;
        }
        
        // Retirer l'ingrédient de l'inventaire du joueur
        inventory.removeIngredient(ingredientType);
        
        // Ajouter l'ingrédient au comptoir
        const currentCount = counter.items.get(ingredientType) || 0;
        counter.items.set(ingredientType, currentCount + 1);
        
        console.log(`📤 ${ingredientType} déposé sur le comptoir de communication`);
        return true;
    }

    /**
     * Récupère un ingrédient d'un comptoir de communication
     */
    takeIngredient(player: PlayerManager, ingredientType: string, counterIndex: number = 0): boolean {
        if (counterIndex >= this.communicationCounters.length) return false;
        
        const counter = this.communicationCounters[counterIndex];
        
        // Vérifier si l'ingrédient est disponible
        const currentCount = counter.items.get(ingredientType) || 0;
        if (currentCount <= 0) {
            console.log(`❌ ${ingredientType} non disponible sur le comptoir`);
            return false;
        }
        
        // Vérifier si le joueur peut prendre l'ingrédient
        const inventory = player.getInventory();
        if (!inventory.canAddIngredient(ingredientType)) {
            console.log(`❌ Inventaire du joueur plein`);
            return false;
        }
        
        // Retirer l'ingrédient du comptoir
        counter.items.set(ingredientType, currentCount - 1);
        if (currentCount === 1) {
            counter.items.delete(ingredientType);
        }
        
        // Ajouter l'ingrédient à l'inventaire du joueur
        inventory.addIngredient(ingredientType);
        
        console.log(`📥 ${ingredientType} récupéré du comptoir de communication`);
        return true;
    }

    /**
     * Vérifie si un joueur est près d'un comptoir de communication
     */
    isPlayerNearCommunicationCounter(player: PlayerManager, counterIndex: number = 0): boolean {
        if (counterIndex >= this.communicationCounters.length) return false;
        
        const counter = this.communicationCounters[counterIndex];
        const playerPos = player.getTargetPosition();
        
        // Vérifier si le joueur est à côté du comptoir
        const distance = Math.abs(playerPos.x - counter.x) + Math.abs(playerPos.y - counter.y);
        return distance <= 1;
    }

    /**
     * Récupère tous les comptoirs de communication
     */
    getCommunicationCounters(): CommunicationCounter[] {
        return this.communicationCounters;
    }

    /**
     * Récupère les ingrédients disponibles sur un comptoir
     */
    getAvailableIngredients(counterIndex: number = 0): string[] {
        if (counterIndex >= this.communicationCounters.length) return [];
        
        const counter = this.communicationCounters[counterIndex];
        const ingredients: string[] = [];
        
        counter.items.forEach((count, ingredient) => {
            for (let i = 0; i < count; i++) {
                ingredients.push(ingredient);
            }
        });
        
        return ingredients;
    }

    /**
     * Affiche les informations des comptoirs de communication
     */
    displayCommunicationInfo(): void {
        console.log("📡 Comptoirs de communication:");
        this.communicationCounters.forEach((counter, index) => {
            console.log(`  Comptoir ${index + 1} (${counter.x}, ${counter.y}):`);
            if (counter.items.size === 0) {
                console.log("    Vide");
            } else {
                counter.items.forEach((count, ingredient) => {
                    console.log(`    ${ingredient}: ${count}`);
                });
            }
        });
    }
}

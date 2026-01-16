/**
 * Gestionnaire des comptoirs de communication entre les joueurs
 */

import Phaser from "phaser";
import { Logger } from "../utils/Logger";
import { ActionSoundManager } from "./ActionSoundManager";
import { MapManager } from "./MapManager";
import { PlayerManager } from "./PlayerManager";
import { VoiceManager } from "./VoiceManager";

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
    private voiceManager?: VoiceManager;
    private actionSoundManager?: ActionSoundManager;

    constructor(
        scene: Phaser.Scene,
        mapManager: MapManager,
        mapOffsetX: number,
        mapOffsetY: number
    ) {
        this.scene = scene;
        this.mapManager = mapManager;
        this.mapOffsetX = mapOffsetX;
        this.mapOffsetY = mapOffsetY;
    }

    /**
     * Définit le gestionnaire de voix
     */
    setVoiceManager(voiceManager: VoiceManager): void {
        this.voiceManager = voiceManager;
    }

    /**
     * Définit le gestionnaire de sons d'actions
     */
    setActionSoundManager(actionSoundManager: ActionSoundManager): void {
        this.actionSoundManager = actionSoundManager;
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
                if (mapData[y][x] === 5) {
                    // Table normale
                    // Vérifier si c'est un comptoir de communication
                    if (this.isCommunicationCounter(x, y, mapData)) {
                        this.communicationCounters.push({
                            x,
                            y,
                            items: new Map(),
                            maxItems: 3, // Maximum 3 ingrédients par comptoir
                        });
                    }
                }
            }
        }
    }

    /**
     * Vérifie si une position est un comptoir de communication
     */
    private isCommunicationCounter(
        x: number,
        y: number,
        mapData: number[][]
    ): boolean {
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
    depositIngredient(
        player: PlayerManager,
        ingredientType: string,
        counterIndex: number = 0
    ): boolean {
        if (counterIndex >= this.communicationCounters.length) return false;

        const counter = this.communicationCounters[counterIndex];

        // Vérifier si le comptoir a de la place
        if (counter.items.size >= counter.maxItems) {
            return false;
        }

        // Vérifier si le joueur a l'ingrédient
        const inventory = player.getInventory();
        if (!inventory.hasItem(ingredientType)) {
            return false;
        }

        // Retirer l'ingrédient de l'inventaire du joueur
        if (!inventory.removeSpecificItem(ingredientType)) {
            return false;
        }

        // Ajouter l'ingrédient au comptoir
        const currentCount = counter.items.get(ingredientType) || 0;
        counter.items.set(ingredientType, currentCount + 1);

        return true;
    }

    /**
     * Récupère un ingrédient d'un comptoir de communication
     */
    takeIngredient(
        player: PlayerManager,
        ingredientType: string,
        counterIndex: number = 0
    ): boolean {
        if (counterIndex >= this.communicationCounters.length) return false;

        const counter = this.communicationCounters[counterIndex];

        // Vérifier si l'ingrédient est disponible
        const currentCount = counter.items.get(ingredientType) || 0;
        if (currentCount <= 0) {
            return false;
        }

        // Vérifier si le joueur peut prendre l'ingrédient (inventaire plein?)
        const inventory = player.getInventory();
        if (inventory.isFull()) {
            return false;
        }

        // Retirer l'ingrédient du comptoir
        counter.items.set(ingredientType, currentCount - 1);
        if (currentCount === 1) {
            counter.items.delete(ingredientType);
        }

        // Ajouter l'ingrédient à l'inventaire du joueur
        if (!inventory.addItem(ingredientType)) {
            // Si l'ajout échoue, remettre l'item sur le comptoir
            counter.items.set(ingredientType, currentCount);
            return false;
        }

        // Déclencher une voix pour cet ingrédient
        if (this.voiceManager) {
            this.voiceManager.playVoiceForIngredient(
                ingredientType,
                player.getPlayerNumber()
            );
        }

        // Jouer le son de récupération réussie
        if (this.actionSoundManager) {
            Logger.debug(
                `🎵 Récupération d'ingrédient depuis communication: ${ingredientType}`
            );
            this.actionSoundManager.playRecupSuccess();
        }

        return true;
    }

    /**
     * Vérifie si un joueur est près d'un comptoir de communication
     */
    isPlayerNearCommunicationCounter(
        player: PlayerManager,
        counterIndex: number = 0
    ): boolean {
        if (counterIndex >= this.communicationCounters.length) return false;

        const counter = this.communicationCounters[counterIndex];
        const playerPos = player.getTargetPosition();

        // Vérifier si le joueur est à côté du comptoir
        const distance =
            Math.abs(playerPos.x - counter.x) +
            Math.abs(playerPos.y - counter.y);
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
}


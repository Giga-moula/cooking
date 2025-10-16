/**
 * Gestionnaire de cartes dynamiques qui génère des cartes aléatoires
 */

import { MapManager } from "./MapManager";
import { RandomMapGenerator, MapGenerationConfig } from "../generators/RandomMapGenerator";
import { MapConfig } from "../config/MapConfig";

export class DynamicMapManager extends MapManager {
    private currentWaveLevel: number = 1;
    private availableActions: number = 3; // Nombre d'actions disponibles
    private deliveryZonePosition: { x: number; y: number } | null = null; // Position fixe de la zone de livraison

    constructor(
        scene: Phaser.Scene,
        mapOffsetX: number,
        mapOffsetY: number,
        mapWidth: number = 12,
        mapHeight: number = 10
    ) {
        super(scene, mapOffsetX, mapOffsetY, mapWidth, mapHeight);
        
        // Générer la première carte
        this.generateNewMap();
    }

    /**
     * Met à jour le niveau de vague et génère une nouvelle carte
     */
    updateWaveLevel(waveLevel: number): void {
        this.currentWaveLevel = waveLevel;
        this.generateNewMap();
    }

    /**
     * Met à jour le nombre d'actions disponibles
     */
    updateAvailableActions(actions: number): void {
        this.availableActions = actions;
        this.generateNewMap();
    }

    /**
     * Génère une nouvelle carte aléatoire
     */
    generateNewMap(): MapConfig {
        const config: MapGenerationConfig = {
            waveLevel: this.currentWaveLevel,
            availableActions: this.availableActions,
            mapWidth: 12, // Utiliser les valeurs par défaut
            mapHeight: 10,
            separationWall: true // Toujours séparer les joueurs
        };

        const newMapConfig = RandomMapGenerator.generateMap(config);
        
        // Stocker la position de la zone de livraison lors de la première génération
        if (this.currentWaveLevel === 1 && !this.deliveryZonePosition) {
            // Trouver la position de la zone de livraison dans la carte générée
            for (let y = 0; y < newMapConfig.mapData.length; y++) {
                for (let x = 0; x < newMapConfig.mapData[y].length; x++) {
                    if (newMapConfig.mapData[y][x] === 9) { // Tile type 9 = zone de livraison
                        this.deliveryZonePosition = { x, y };
                        break;
                    }
                }
                if (this.deliveryZonePosition) break;
            }
        }
        
        // Réappliquer la zone de livraison pour les vagues 2+ à la même position
        if (this.currentWaveLevel > 1 && this.deliveryZonePosition) {
            const { x, y } = this.deliveryZonePosition;
            // Vérifier que la position est valide (sol libre)
            if (newMapConfig.mapData[y] && newMapConfig.mapData[y][x] === 1) {
                newMapConfig.mapData[y][x] = 9; // Zone de livraison
            } else {
                console.warn(`⚠️ Position de livraison (${x}, ${y}) non disponible, recherche d'une nouvelle position...`);
                // Chercher une position proche
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const newY = y + dy;
                        const newX = x + dx;
                        if (newMapConfig.mapData[newY] && newMapConfig.mapData[newY][newX] === 1) {
                            newMapConfig.mapData[newY][newX] = 9;
                            this.deliveryZonePosition = { x: newX, y: newY };
                            break;
                        }
                    }
                }
            }
        }
        
        // Appliquer la nouvelle configuration
        this.setMapConfig(newMapConfig);
        
        return newMapConfig;
    }

    /**
     * Récupère le niveau de vague actuel
     */
    getCurrentWaveLevel(): number {
        return this.currentWaveLevel;
    }

    /**
     * Récupère le nombre d'actions disponibles
     */
    getAvailableActions(): number {
        return this.availableActions;
    }

    /**
     * Force la régénération de la carte actuelle
     */
    regenerateCurrentMap(): MapConfig {
        return this.generateNewMap();
    }

    /**
     * Génère une carte avec des paramètres spécifiques
     */
    generateCustomMap(
        waveLevel: number, 
        actions: number, 
        useSeparation: boolean = false
    ): MapConfig {
        const config: MapGenerationConfig = {
            waveLevel,
            availableActions: actions,
            mapWidth: 12,
            mapHeight: 10,
            separationWall: useSeparation
        };

        const newMapConfig = RandomMapGenerator.generateMap(config);
        this.setMapConfig(newMapConfig);
        
        return newMapConfig;
    }
}

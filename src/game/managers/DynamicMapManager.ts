/**
 * Gestionnaire de cartes dynamiques qui génère des cartes aléatoires
 */

import { MapManager } from "./MapManager";
import { RandomMapGenerator, MapGenerationConfig } from "../generators/RandomMapGenerator";
import { MapConfig } from "../config/MapConfig";

export class DynamicMapManager extends MapManager {
    private currentWaveLevel: number = 1;
    private availableActions: number = 3; // Nombre d'actions disponibles

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
        
        // La zone de livraison est maintenant générée automatiquement par RandomMapGenerator
        // Elle change de position à chaque nouvelle vague
        
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

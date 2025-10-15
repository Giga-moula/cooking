/**
 * Exemple d'utilisation du système de cartes interchangeables
 */

import { MapManager } from "../managers/MapManager";
import { DEFAULT_MAP_CONFIG, ALTERNATIVE_MAP_CONFIG } from "../config/MapConfig";
import Game from "../scenes/Game";

export class MapSwitcher {
    private mapManager: MapManager;
    private gameScene?: Game;
    private currentMapIndex: number = 0;
    private availableMaps = [DEFAULT_MAP_CONFIG, ALTERNATIVE_MAP_CONFIG];

    constructor(mapManager: MapManager, gameScene?: Game) {
        this.mapManager = mapManager;
        this.gameScene = gameScene;
    }

    /**
     * Change vers la carte suivante
     */
    switchToNextMap(): void {
        this.currentMapIndex = (this.currentMapIndex + 1) % this.availableMaps.length;
        const newMapConfig = this.availableMaps[this.currentMapIndex];
        
        console.log(`🔄 Changement vers la carte: ${newMapConfig.name}`);
        console.log(`📝 Description: ${newMapConfig.description}`);
        
        // Changer la configuration de la carte
        this.mapManager.setMapConfig(newMapConfig);
        
        // Recréer la carte avec la nouvelle configuration
        this.mapManager.createMap();
        
        // Repositionner les joueurs selon les nouveaux points de spawn
        if (this.gameScene) {
            this.gameScene.repositionPlayers();
        }
    }

    /**
     * Change vers une carte spécifique
     */
    switchToMap(mapName: string): boolean {
        const mapConfig = this.availableMaps.find(map => map.name === mapName);
        if (!mapConfig) {
            console.error(`❌ Carte "${mapName}" non trouvée`);
            return false;
        }

        console.log(`🔄 Changement vers la carte: ${mapConfig.name}`);
        this.mapManager.setMapConfig(mapConfig);
        this.mapManager.createMap();
        
        // Repositionner les joueurs selon les nouveaux points de spawn
        if (this.gameScene) {
            this.gameScene.repositionPlayers();
        }
        
        return true;
    }

    /**
     * Récupère le nom de la carte actuelle
     */
    getCurrentMapName(): string {
        return this.mapManager.getCurrentMapConfig().name;
    }

    /**
     * Récupère la liste des cartes disponibles
     */
    getAvailableMaps(): string[] {
        return this.availableMaps.map(map => map.name);
    }
}

/**
 * Test du générateur de cartes aléatoires
 */

import { RandomMapGenerator, MapGenerationConfig } from "./RandomMapGenerator";

// Test de génération de carte
function testMapGeneration() {
    
    const config: MapGenerationConfig = {
        waveLevel: 2,
        availableActions: 6,
        mapWidth: 12,
        mapHeight: 10,
        separationWall: false
    };
    
    const mapConfig = RandomMapGenerator.generateMap(config);
    
    // Analyser la carte générée
    let butterBoxes = 0;
    let flourBoxes = 0;
    let chocoBoxes = 0;
    let ovens = 0;
    
    mapConfig.mapData.forEach((row, y) => {
        row.forEach((tile, x) => {
            switch (tile) {
                case 6: chocoBoxes++; break;
                case 7: butterBoxes++; break;
                case 8: flourBoxes++; break;
                case 11: ovens++; break;
            }
        });
    });
    
    return mapConfig;
}

// Exporter pour utilisation dans le jeu
export { testMapGeneration };

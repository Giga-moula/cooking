/**
 * Test du générateur de cartes aléatoires
 */

import { RandomMapGenerator, MapGenerationConfig } from "./RandomMapGenerator";

// Test de génération de carte
function testMapGeneration() {
    console.log("🧪 Test du générateur de cartes aléatoires");
    
    const config: MapGenerationConfig = {
        waveLevel: 2,
        availableActions: 6,
        mapWidth: 12,
        mapHeight: 10,
        separationWall: false
    };
    
    const mapConfig = RandomMapGenerator.generateMap(config);
    
    console.log(`📋 Carte générée: ${mapConfig.name}`);
    console.log(`📍 Joueur 1: (${mapConfig.spawnPoints.player1.x}, ${mapConfig.spawnPoints.player1.y})`);
    console.log(`📍 Joueur 2: (${mapConfig.spawnPoints.player2.x}, ${mapConfig.spawnPoints.player2.y})`);
    
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
    
    console.log(`📊 Analyse de la carte:`);
    console.log(`  🧈 Boîtes de beurre: ${butterBoxes}`);
    console.log(`  🌾 Boîtes de farine: ${flourBoxes}`);
    console.log(`  🍫 Boîtes de chocolat: ${chocoBoxes}`);
    console.log(`  🔥 Fours: ${ovens}`);
    
    // Vérifications
    const hasRequiredElements = butterBoxes >= 1 && flourBoxes >= 1 && ovens >= 1;
    console.log(`✅ Éléments requis présents: ${hasRequiredElements}`);
    
    if (!hasRequiredElements) {
        console.log(`❌ ERREUR: Il manque des éléments requis!`);
    }
    
    return mapConfig;
}

// Exporter pour utilisation dans le jeu
export { testMapGeneration };

/**
 * Gestionnaire de carte spécial pour le tutoriel avec la map cookie-choco 8x8
 */

import { MapConfig } from "../config/MapConfig";
import { MapManager } from "./MapManager";

export class TutorialMapManager extends MapManager {
    constructor(scene: Phaser.Scene, mapOffsetX: number, mapOffsetY: number) {
        super(scene, mapOffsetX, mapOffsetY, 8, 8);

        // Générer la map cookie-choco pour le tutoriel
        this.generateCookieChocoMap();
    }

    /**
     * Génère une map 8x8 spéciale pour le tutoriel cookie-choco
     * Les 2 joueurs ne sont pas séparés
     */
    generateCookieChocoMap(): MapConfig {
        // Créer une map 8x8
        const mapWidth = 8;
        const mapHeight = 8;

        // Initialiser la grille avec des sols
        const grid: number[][] = [];
        for (let y = 0; y < mapHeight; y++) {
            grid[y] = [];
            for (let x = 0; x < mapWidth; x++) {
                grid[y][x] = 1; // Sol par défaut
            }
        }

        // Placer les murs autour de la map
        for (let x = 0; x < mapWidth; x++) {
            grid[0][x] = 4; // Mur du haut
            grid[mapHeight - 1][x] = 4; // Mur du bas
        }
        for (let y = 0; y < mapHeight; y++) {
            grid[y][0] = 4; // Mur de gauche
            grid[y][mapWidth - 1] = 4; // Mur de droite
        }

        // Placer les boîtes d'ingrédients (ligne 1)
        grid[1][6] = 7; // Boîte beurre
        grid[1][2] = 8; // Boîte farine
        grid[1][3] = 6; // Boîte chocolat

        // Placer les stations de cuisson
        grid[6][6] = 13; // Casserole (pour beurre fondu et caramel)
        grid[6][1] = 11; // Four 1 (pour cuire le cookie)
        grid[2][6] = 11; // Four 2 (pour cuire le cookie)

        // Placer les tables (lignes 3 et 4) - mix de tables normales et de transformation
        grid[3][3] = 10; // Table de transformation 2 (avec craft)
        grid[3][4] = 5; // Table normale 2
        grid[4][1] = 5; // Table normale 3
        grid[4][2] = 10; // Table de transformation 3 (avec craft)

        // Placer la zone de livraison et la poubelle (ligne 5)
        grid[5][5] = 9; // Zone de livraison
        grid[5][6] = 14; // Poubelle

        // Placer les points de spawn des joueurs (pas séparés) (ligne 6)
        grid[6][1] = 1; // Spawn joueur 1
        grid[6][2] = 1; // Spawn joueur 2

        // Créer la configuration de la map
        const mapConfig: MapConfig = {
            name: "cookie-choco-tutorial",
            description: "Map 8x8 pour le tutoriel cookie-choco",
            mapData: grid,
            spawnPoints: {
                player1: { x: 1, y: 5 },
                player2: { x: 2, y: 5 },
            },
            deliveryZone: { x: 5, y: 5 },
            mapWidth: mapWidth,
            mapHeight: mapHeight,
            tileTypes: {
                0: { texture: "", isSolid: false, isCounter: false }, // Vide
                1: { texture: "planks", isSolid: false, isCounter: false }, // Sol
                4: { texture: "iso-wall", isSolid: true, isCounter: false }, // Mur
                5: { texture: "table-mono", isSolid: true, isCounter: true }, // Table normale
                6: {
                    texture: "choco_box",
                    isSolid: true,
                    isCounter: false,
                    isIngredient: "chocolate",
                    rotation: Math.PI,
                }, // Boîte chocolat
                7: {
                    texture: "butter_box",
                    isSolid: true,
                    isCounter: false,
                    isIngredient: "butter",
                    rotation: Math.PI,
                }, // Boîte beurre
                8: {
                    texture: "flour_box",
                    isSolid: true,
                    isCounter: false,
                    isIngredient: "flour",
                    rotation: Math.PI,
                }, // Boîte farine
                9: {
                    texture: "caisse",
                    isSolid: true,
                    isCounter: false,
                    isDeliveryZone: true,
                }, // Zone de livraison (caisse)
                10: {
                    texture: "table-mono",
                    isSolid: true,
                    isCounter: true,
                    isTransformationTable: true,
                }, // Table de transformation
                11: {
                    texture: "oven",
                    isSolid: true,
                    isCounter: false,
                    isOven: true,
                }, // Four
                12: {
                    texture: "sugar-box",
                    isSolid: true,
                    isCounter: false,
                    isIngredient: "sugar",
                    rotation: Math.PI,
                }, // Boîte sucre
                13: {
                    texture: "casserole_cuisson",
                    isSolid: true,
                    isCounter: false,
                    isCasserole: true,
                }, // Casserole de cuisson
                14: {
                    texture: "thrash",
                    isSolid: true,
                    isCounter: false,
                    isTrash: true,
                }, // Poubelle
            },
        };

        // Appliquer la configuration
        this.setMapConfig(mapConfig);

        return mapConfig;
    }
}


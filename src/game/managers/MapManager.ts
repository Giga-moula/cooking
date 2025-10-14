import Phaser from "phaser";
import { IsometricMap, IsometricUtils } from "../utils/IsometricUtils";

/**
 * Gestionnaire de la carte : tiles, murs, limites
 */
export class MapManager {
    private scene: Phaser.Scene;
    private isoMap?: IsometricMap;
    private walls?: Phaser.Physics.Arcade.StaticGroup;
    private mapOffsetX: number;
    private mapOffsetY: number;
    private mapWidth: number;
    private mapHeight: number;
    private ingredientTiles: Map<string, string> = new Map();

    constructor(
        scene: Phaser.Scene,
        mapOffsetX: number,
        mapOffsetY: number,
        mapWidth: number = 10,
        mapHeight: number = 10
    ) {
        this.scene = scene;
        this.mapOffsetX = mapOffsetX;
        this.mapOffsetY = mapOffsetY;
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
    }

    /**
     * Crée les tiles isométriques procéduralement
     */
    createIsometricTiles(): void {
        const tileSize = 48;
        const tiles = [
            { key: "iso-grass", color: 0x5cb85c, darkColor: 0x4a9d4a },
            { key: "iso-dirt", color: 0x8b7355, darkColor: 0x6d5a43 },
            { key: "iso-water", color: 0x4a90e2, darkColor: 0x3a75c4 },
            { key: "iso-wall", color: 0x666666, darkColor: 0x444444 },
            { key: "iso-counter", color: 0xd2691e, darkColor: 0xb8860b },
            {
                key: "iso-ingredient-chocolate",
                color: 0x8b4513,
                darkColor: 0x654321,
            },
            {
                key: "iso-ingredient-butter",
                color: 0xffd700,
                darkColor: 0xddaa00,
            },
            {
                key: "iso-ingredient-wheat",
                color: 0xf5deb3,
                darkColor: 0xd2b48c,
            },
            { key: "iso-delivery-zone", color: 0xff6b6b, darkColor: 0xe53e3e },
        ];

        tiles.forEach(({ key, color, darkColor }) => {
            const graphics = this.scene.add.graphics();

            // Face supérieure
            graphics.fillStyle(color, 1);
            graphics.fillRect(0, 0, tileSize, tileSize);

            // Bordures pour effet 3D
            graphics.fillStyle(darkColor, 1);
            graphics.fillRect(tileSize - 4, 0, 4, tileSize);
            graphics.fillRect(0, tileSize - 4, tileSize, 4);

            // Bordure claire
            graphics.lineStyle(2, 0xffffff, 0.3);
            graphics.beginPath();
            graphics.moveTo(0, tileSize);
            graphics.lineTo(0, 0);
            graphics.lineTo(tileSize, 0);
            graphics.strokePath();

            graphics.generateTexture(key, tileSize, tileSize);
            graphics.destroy();
        });
    }

    /**
     * Crée la carte avec les données fournies
     */
    createMap(): IsometricMap {
        this.isoMap = new IsometricMap(this.scene);

        const mapData = [
            [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
            [4, 6, 2, 2, 1, 1, 1, 3, 3, 4],
            [4, 1, 2, 2, 1, 5, 5, 3, 3, 4],
            [4, 1, 2, 2, 1, 5, 5, 1, 1, 4],
            [4, 1, 1, 1, 1, 5, 5, 1, 1, 4],
            [4, 1, 1, 1, 1, 2, 2, 1, 1, 4],
            [4, 3, 3, 1, 1, 2, 2, 1, 1, 4],
            [4, 3, 3, 1, 5, 5, 5, 1, 1, 4],
            [4, 7, 8, 1, 1, 1, 1, 1, 9, 4],
            [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
        ];

        const tileTextures = {
            1: "iso-grass",
            2: "iso-dirt",
            3: "iso-water",
            4: "iso-wall",
            5: "iso-counter",
            6: "iso-ingredient-chocolate",
            7: "iso-ingredient-butter",
            8: "iso-ingredient-wheat",
            9: "iso-delivery-zone",
        };

        this.isoMap.createMap(
            mapData,
            tileTextures,
            this.mapOffsetX,
            this.mapOffsetY
        );

        return this.isoMap;
    }

    /**
     * Crée les murs invisibles autour de la carte
     */
    createMapBoundaries(): Phaser.Physics.Arcade.StaticGroup {
        this.walls = this.scene.physics.add.staticGroup();

        const wallThickness = 1;
        const tileHalfWidth = IsometricUtils.TILE_WIDTH / 2;
        const tileHalfHeight = IsometricUtils.TILE_HEIGHT / 2;

        const mapLeft = this.mapOffsetX - tileHalfWidth;
        const mapRight =
            this.mapOffsetX +
            (this.mapWidth - 1) * IsometricUtils.TILE_WIDTH +
            tileHalfWidth;
        const mapTop = this.mapOffsetY - tileHalfHeight;
        const mapBottom =
            this.mapOffsetY +
            (this.mapHeight - 1) * IsometricUtils.TILE_HEIGHT +
            tileHalfHeight;

        // Murs (haut, bas, gauche, droite)
        const topWall = this.scene.add.rectangle(
            (mapLeft + mapRight) / 2,
            mapTop - wallThickness / 2,
            mapRight - mapLeft + wallThickness * 2,
            wallThickness,
            0xff0000,
            0.2
        );
        this.walls.add(topWall);

        const bottomWall = this.scene.add.rectangle(
            (mapLeft + mapRight) / 2,
            mapBottom + wallThickness / 2,
            mapRight - mapLeft + wallThickness * 2,
            wallThickness,
            0xff0000,
            0.2
        );
        this.walls.add(bottomWall);

        const leftWall = this.scene.add.rectangle(
            mapLeft - wallThickness / 2,
            (mapTop + mapBottom) / 2,
            wallThickness,
            mapBottom - mapTop,
            0xff0000,
            0.2
        );
        this.walls.add(leftWall);

        const rightWall = this.scene.add.rectangle(
            mapRight + wallThickness / 2,
            (mapTop + mapBottom) / 2,
            wallThickness,
            mapBottom - mapTop,
            0xff0000,
            0.2
        );
        this.walls.add(rightWall);

        return this.walls;
    }

    /**
     * Initialise les tiles d'ingrédients
     */
    initializeIngredientTiles(): void {
        this.ingredientTiles.set("1,1", "chocolate");
        this.ingredientTiles.set("1,8", "butter");
        this.ingredientTiles.set("2,8", "wheat_floor");

        console.log(
            "Tiles d'ingrédients initialisées:",
            Array.from(this.ingredientTiles.entries())
        );
    }

    /**
     * Vérifie si une position est une tile d'ingrédient
     */
    isIngredientTile(gridX: number, gridY: number): boolean {
        const key = `${gridX},${gridY}`;
        return this.ingredientTiles.has(key);
    }

    /**
     * Récupère le type d'ingrédient d'une tile
     */
    getIngredientFromTile(gridX: number, gridY: number): string | null {
        const key = `${gridX},${gridY}`;
        return this.ingredientTiles.get(key) || null;
    }

    // Getters
    getIsoMap(): IsometricMap | undefined {
        return this.isoMap;
    }

    getWalls(): Phaser.Physics.Arcade.StaticGroup | undefined {
        return this.walls;
    }

    getMapOffsetX(): number {
        return this.mapOffsetX;
    }

    getMapOffsetY(): number {
        return this.mapOffsetY;
    }
}


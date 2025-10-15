import Phaser from "phaser";
import { IsometricMap, IsometricUtils } from "../utils/IsometricUtils";
import { TableTileManager } from "./tableManager";

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
    private tableTileManager?: TableTileManager;

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
     * Les images des caisses d'ingrédients sont chargées directement depuis les assets
     */
    createIsometricTiles(): void {
        const tileSize = 64;  // Doit correspondre à TILE_WIDTH/TILE_HEIGHT
        const tiles = [
            { key: "iso-wall", color: 0x666666, darkColor: 0x444444 },
            { key: "iso-delivery-zone", color: 0xff6b6b, darkColor: 0xe53e3e },
            { key: "iso-special-counter", color: 0x4a9eff, darkColor: 0x2b7fd9 }, // Plan de travail spécial (bleu)
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
            [4, 6, 1, 1, 1, 1, 1, 1, 1, 4],
            [4, 1, 1, 1, 1, 5, 5, 1, 1, 4],
            [4, 1, 1, 1, 1, 5, 5, 1, 1, 4],
            [4, 1, 1, 1, 1, 5, 10, 1, 1, 4], // 10 = Tile spéciale (plan de travail pour actions spécifiques)
            [4, 1, 1, 1, 1, 1, 1, 1, 1, 4],
            [4, 1, 1, 1, 1, 1, 1, 1, 1, 4],
            [4, 1, 1, 1, 5, 5, 5, 1, 1, 4],
            [4, 7, 8, 1, 1, 1, 1, 1, 9, 4],
            [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
        ];

        // Générer les configurations de tables AVANT de créer la carte
        this.tableTileManager = new TableTileManager(mapData);
        const tableConfigurations = this.tableTileManager.generateTableConfigurations();

        // Créer un mapping des textures avec les bonnes textures de table
        const tileTextures = this.createTileTexturesWithTables(tableConfigurations);

        this.isoMap.createMap(
            mapData,
            tileTextures,
            this.mapOffsetX,
            this.mapOffsetY
        );

        // Appliquer les vraies textures de table après la création
        this.applyTableTextures(tableConfigurations);

        return this.isoMap;
    }

    /**
     * Crée le mapping des textures de base
     */
    private createTileTexturesWithTables(tableConfigurations: Array<{gridX: number, gridY: number, texture: string}>): { [key: number]: string } {
        return {
            1: "planks",
            4: "iso-wall",
            5: "table-mono",           // Texture temporaire qui sera remplacée par la bonne texture de table
            6: "choco_box",            // Caisse de chocolat
            7: "butter_box",           // Caisse de beurre
            8: "flour_box",            // Caisse de farine
            9: "iso-delivery-zone",
            10: "iso-special-counter", // Plan de travail spécial (pour actions spécifiques)
        };
    }

    /**
     * Applique les textures de comptoir/table correctes selon les adjacences
     */
    private applyTableTextures(tableConfigurations: Array<{gridX: number, gridY: number, texture: string}>): void {
        if (!this.isoMap) return;

        let replacedCount = 0;
        
        tableConfigurations.forEach(config => {
            const key = `${config.gridX},${config.gridY}`;
            
            // Les tables sont des tiles solides, on doit les récupérer depuis solidTiles
            const existingSolidTile = this.isoMap!.getSolidTile(config.gridX, config.gridY);
            if (existingSolidTile) {
                // Vérifier si c'est bien une table temporaire (table-mono ou toute texture de table)
                if (existingSolidTile.texture.key === 'table-mono' || existingSolidTile.texture.key.startsWith('table-')) {
                    // Supprimer l'ancien tile solide
                    this.isoMap!.removeSolidTile(config.gridX, config.gridY);
                    
                    // Créer le nouveau tile avec la bonne texture de table
                    this.isoMap!.createTile(
                        config.gridX, 
                        config.gridY, 
                        config.texture, 
                        this.mapOffsetX, 
                        this.mapOffsetY, 
                        true, // isSolid = true pour les comptoirs
                        true  // isCounter = true pour les tables/comptoirs
                    );
                    
                    replacedCount++;
                } 
            }
        });
        
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

    /**
     * Vérifie si une position est une tile spéciale (type 10 - pour actions spécifiques)
     */
    isSpecialTile(gridX: number, gridY: number): boolean {
        if (!this.isoMap) return false;
        const tile = this.isoMap.getSolidTile(gridX, gridY);
        const isSpecialTexture = tile?.texture.key === 'iso-special-counter';
        const isCounter = this.isoMap.isCounter(gridX, gridY);
        console.log(`isSpecialTile(${gridX}, ${gridY}): texture=${tile?.texture.key}, isSpecial=${isSpecialTexture}, isCounter=${isCounter}`);
        return isSpecialTexture;
    }

    /**
     * Récupère la tile spéciale à une position donnée
     */
    getSpecialTile(gridX: number, gridY: number): Phaser.Physics.Arcade.Sprite | undefined {
        if (!this.isSpecialTile(gridX, gridY)) return undefined;
        return this.isoMap?.getSolidTile(gridX, gridY);
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

    getTableTileManager(): TableTileManager | undefined {
        return this.tableTileManager;
    }
}


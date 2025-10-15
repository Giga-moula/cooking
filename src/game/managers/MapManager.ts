import Phaser from "phaser";
import { IsometricMap, IsometricUtils } from "../utils/IsometricUtils";
import { TableTileManager } from "./tableManager";
import { GameConfig } from "../config/GameConfig";
import { MapConfig, DEFAULT_MAP_CONFIG } from "../config/MapConfig";

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
    private craftPlanOverlays: Map<string, Phaser.GameObjects.Image> = new Map(); // Track des craft_plans
    private currentMapConfig: MapConfig;
   
    constructor(
        scene: Phaser.Scene,
        mapOffsetX: number,
        mapOffsetY: number,
        mapWidth: number = 12,
        mapHeight: number = 12,
        mapConfig: MapConfig = DEFAULT_MAP_CONFIG
    ) {
        this.scene = scene;
        this.mapOffsetX = mapOffsetX;
        this.mapOffsetY = mapOffsetY;
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.currentMapConfig = mapConfig;
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
            // Supprimé iso-transformation-table car on utilise maintenant les vraies tables
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
     * Crée la carte avec la configuration fournie
     */
    createMap(): IsometricMap {
        this.isoMap = new IsometricMap(this.scene);

        const mapData = this.currentMapConfig.mapData;
        
        // Générer les configurations de tables AVANT de créer la carte
        this.tableTileManager = new TableTileManager(mapData);
        const tableConfigurations = this.tableTileManager.generateTableConfigurations();

        // Créer un mapping des textures basé sur la configuration
        const tileTextures = this.createTileTexturesFromConfig(tableConfigurations);

        this.isoMap.createMap(
            mapData,
            tileTextures,
            this.mapOffsetX,
            this.mapOffsetY,
            this.currentMapConfig.tileTypes
        );

        // Appliquer les vraies textures de table après la création
        this.applyTableTextures(tableConfigurations);

        // Initialiser automatiquement les tiles d'ingrédients et autres propriétés
        this.initializeMapProperties();

        return this.isoMap;
    }

    /**
     * Crée le mapping des textures basé sur la configuration
     */
    private createTileTexturesFromConfig(tableConfigurations: Array<{gridX: number, gridY: number, texture: string, isTransformationTable?: boolean}>): { [key: number]: string } {
        const tileTextures: { [key: number]: string } = {};
        
        // Utiliser la configuration pour créer le mapping des textures
        for (const [tileType, config] of Object.entries(this.currentMapConfig.tileTypes)) {
            tileTextures[parseInt(tileType)] = config.texture;
        }
        
        return tileTextures;
    }

    /**
     * Initialise automatiquement les propriétés de la carte basées sur la configuration
     */
    private initializeMapProperties(): void {
        this.ingredientTiles.clear();
        
        const mapData = this.currentMapConfig.mapData;
        
        for (let y = 0; y < mapData.length; y++) {
            for (let x = 0; x < mapData[y].length; x++) {
                const tileType = mapData[y][x];
                const config = this.currentMapConfig.tileTypes[tileType];
                
                if (config?.isIngredient) {
                    this.ingredientTiles.set(`${x},${y}`, config.isIngredient);
                }
            }
        }
    }

    /**
     * Applique les textures de comptoir/table correctes selon les adjacences
     */
    private applyTableTextures(tableConfigurations: Array<{gridX: number, gridY: number, texture: string, isTransformationTable?: boolean}>): void {
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
                    
                    // Si c'est une table de transformation, ajouter le craft_plan en overlay
                    if (config.isTransformationTable) {
                        this.addCraftPlanOverlay(config.gridX, config.gridY);
                    }
                    
                    replacedCount++;
                } 
            }
        });
        
    }

    /**
     * Ajoute le craft_plan en overlay sur une table de transformation
     */
    private addCraftPlanOverlay(gridX: number, gridY: number): void {
        const key = `${gridX},${gridY}`;
        const screenPos = IsometricUtils.gridToScreen(gridX, gridY);
        const x = screenPos.x + this.mapOffsetX;
        const y = screenPos.y + this.mapOffsetY + GameConfig.CRAFT_PLAN_OFFSET_Y; // Utiliser la configuration

        // Créer l'overlay craft_plan
        const craftPlan = this.scene.add.image(x, y, "craft_plan");
        craftPlan.setOrigin(0.5, 0.5);
        craftPlan.setScale(GameConfig.CRAFT_PLAN_SCALE); // Utiliser la configuration
        craftPlan.setDepth(y + 50); // Légèrement au-dessus de la table
        
        // Optionnel : ajouter un effet de transparence pour que ce soit plus subtil
        craftPlan.setAlpha(GameConfig.CRAFT_PLAN_ALPHA);
        
        // Ajuster la rotation selon la texture de la table
        this.adjustCraftPlanRotation(craftPlan, gridX, gridY);
        
        // Tracker l'overlay
        this.craftPlanOverlays.set(key, craftPlan);
    }

    /**
     * Ajuste la rotation du craft_plan selon la texture de la table
     */
    private adjustCraftPlanRotation(craftPlan: Phaser.GameObjects.Image, gridX: number, gridY: number): void {
        if (!this.isoMap) return;
        
        const tile = this.isoMap.getSolidTile(gridX, gridY);
        const textureKey = tile?.texture.key;
        
        if (!textureKey || !textureKey.startsWith('table-')) return;
        
        // Analyser la texture pour déterminer les ouvertures
        const hasBottom = textureKey.includes('bottom');
        const hasLeft = textureKey.includes('left');
        const hasRight = textureKey.includes('right');
        const hasTop = textureKey.includes('top');
        
        // Logique de rotation selon les ouvertures
        if (hasBottom) {
            if (!hasLeft && !hasRight) {
                // Table ouverte seulement en bas -> rotation vers la gauche (-90°)
                craftPlan.setRotation(GameConfig.CRAFT_PLAN_ROTATIONS.LEFT);
            } else if (!hasLeft) {
                // Table ouverte en bas et à droite -> rotation vers la gauche (-90°)
                craftPlan.setRotation(GameConfig.CRAFT_PLAN_ROTATIONS.LEFT);
            } else if (!hasRight) {
                // Table ouverte en bas et à gauche -> rotation vers la droite (90°)
                craftPlan.setRotation(GameConfig.CRAFT_PLAN_ROTATIONS.RIGHT);
            } else {
                // Table ouverte partout -> rotation normale (0°)
                craftPlan.setRotation(GameConfig.CRAFT_PLAN_ROTATIONS.NORMAL);
            }
        } else if (!hasTop) {
            // Table pas ouverte en haut -> rotation à 180°
            craftPlan.setRotation(GameConfig.CRAFT_PLAN_ROTATIONS.UPSIDE_DOWN);
        } else {
            // Table pas ouverte en bas -> rotation normale (0°)
            craftPlan.setRotation(GameConfig.CRAFT_PLAN_ROTATIONS.NORMAL);
        }
        
        console.log(`🔄 Craft plan rotation pour ${textureKey}: ${craftPlan.rotation} rad (${(craftPlan.rotation * 180 / Math.PI).toFixed(0)}°)`);
    }

    /**
     * Vérifie si une position a un craft_plan overlay
     */
    private hasCraftPlanOverlay(gridX: number, gridY: number): boolean {
        const key = `${gridX},${gridY}`;
        return this.craftPlanOverlays.has(key);
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
     * Change la configuration de carte
     */
    setMapConfig(mapConfig: MapConfig): void {
        this.currentMapConfig = mapConfig;
    }

    /**
     * Récupère la configuration actuelle de la carte
     */
    getCurrentMapConfig(): MapConfig {
        return this.currentMapConfig;
    }

    /**
     * Récupère le point de spawn d'un joueur
     */
    getPlayerSpawnPoint(playerNumber: 1 | 2): { x: number; y: number } {
        if (playerNumber === 1) {
            return this.currentMapConfig.spawnPoints.player1;
        } else {
            return this.currentMapConfig.spawnPoints.player2;
        }
    }

    /**
     * Récupère tous les points de spawn de la carte
     */
    getAllSpawnPoints(): { player1: { x: number; y: number }; player2: { x: number; y: number } } {
        return this.currentMapConfig.spawnPoints;
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
     * Vérifie si une position est une table de transformation (avec craft_plan)
     */
    isTransformationTable(gridX: number, gridY: number): boolean {
        if (!this.isoMap) return false;
        const tile = this.isoMap.getSolidTile(gridX, gridY);
        const isCounter = this.isoMap.isCounter(gridX, gridY);
        
        // Vérifier si c'est une table (texture commence par 'table-') ET si elle a un craft_plan
        const isTable = tile?.texture.key?.startsWith('table-') || false;
        const hasCraftPlan = this.hasCraftPlanOverlay(gridX, gridY);
        
        console.log(`isTransformationTable(${gridX}, ${gridY}): texture=${tile?.texture.key}, isTable=${isTable}, hasCraftPlan=${hasCraftPlan}, isCounter=${isCounter}`);
        return isTable && hasCraftPlan;
    }

    /**
     * Récupère la table de transformation à une position donnée
     */
    getTransformationTable(gridX: number, gridY: number): Phaser.Physics.Arcade.Sprite | undefined {
        if (!this.isTransformationTable(gridX, gridY)) return undefined;
        return this.isoMap?.getSolidTile(gridX, gridY);
    }

    /**
     * Vérifie si une position est un four (type 11 - pour cuisson)
     */
    isOven(gridX: number, gridY: number): boolean {
        if (!this.isoMap) return false;
        const tile = this.isoMap.getSolidTile(gridX, gridY);
        const isOven = tile?.texture.key === 'oven';
        console.log(`isOven(${gridX}, ${gridY}): texture=${tile?.texture.key}, isOven=${isOven}`);
        return isOven;
    }

    /**
     * Vérifie si une position est une zone de livraison
     */
    isDeliveryZone(gridX: number, gridY: number): boolean {
        const mapData = this.currentMapConfig.mapData;
        if (gridY < 0 || gridY >= mapData.length) return false;
        if (gridX < 0 || gridX >= mapData[gridY].length) return false;
        
        const tileType = mapData[gridY][gridX];
        const config = this.currentMapConfig.tileTypes[tileType];
        return config?.isDeliveryZone || false;
    }

    /**
     * Récupère le four à une position donnée
     */
    getOven(gridX: number, gridY: number): Phaser.Physics.Arcade.Sprite | undefined {
        if (!this.isOven(gridX, gridY)) return undefined;
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


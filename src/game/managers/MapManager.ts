import Phaser from "phaser";
import { GameConfig } from "../config/GameConfig";
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
    private craftPlanOverlays: Map<string, Phaser.GameObjects.Image> =
        new Map(); // Track des craft_plans

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
        const tileSize = 64; // Doit correspondre à TILE_WIDTH/TILE_HEIGHT
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
     * Crée la carte avec les données fournies
     */
    createMap(): IsometricMap {
        this.isoMap = new IsometricMap(this.scene);

        const mapData = [
            [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
            [4, 6, 1, 1, 1, 1, 1, 1, 1, 4],
            [4, 1, 1, 1, 1, 5, 5, 1, 1, 4],
            [4, 1, 1, 1, 1, 5, 10, 1, 1, 4],
            [4, 1, 1, 1, 1, 5, 10, 1, 1, 4], // 10 = Table de transformation (pour actions spécifiques)
            [4, 1, 1, 1, 1, 1, 1, 1, 1, 4],
            [4, 1, 1, 1, 10, 1, 1, 1, 1, 4],
            [4, 1, 1, 1, 5, 5, 5, 1, 1, 4],
            [4, 7, 8, 12, 1, 11, 1, 1, 9, 4], // 7=butter, 8=flour, 12=sugar, 11=four
            [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
        ];

        // Générer les configurations de tables AVANT de créer la carte
        this.tableTileManager = new TableTileManager(mapData);
        const tableConfigurations =
            this.tableTileManager.generateTableConfigurations();

        // Créer un mapping des textures avec les bonnes textures de table
        const tileTextures =
            this.createTileTexturesWithTables(tableConfigurations);

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
    private createTileTexturesWithTables(
        tableConfigurations: Array<{
            gridX: number;
            gridY: number;
            texture: string;
            isTransformationTable?: boolean;
        }>
    ): { [key: number]: string } {
        return {
            1: "planks",
            4: "iso-wall",
            5: "table-mono", // Texture temporaire qui sera remplacée par la bonne texture de table
            6: "choco_box", // Caisse de chocolat
            7: "butter_box", // Caisse de beurre
            8: "flour_box", // Caisse de farine
            12: "sugar_box", // Caisse de sucre
            9: "iso-delivery-zone",
            10: "table-mono", // Table de transformation - utilise maintenant les vraies tables
            11: "oven", // Four (pour cuisson) - utilise l'image oven.png directement
        };
    }

    /**
     * Applique les textures de comptoir/table correctes selon les adjacences
     */
    private applyTableTextures(
        tableConfigurations: Array<{
            gridX: number;
            gridY: number;
            texture: string;
            isTransformationTable?: boolean;
        }>
    ): void {
        if (!this.isoMap) return;

        let replacedCount = 0;

        tableConfigurations.forEach((config) => {
            const key = `${config.gridX},${config.gridY}`;

            // Les tables sont des tiles solides, on doit les récupérer depuis solidTiles
            const existingSolidTile = this.isoMap!.getSolidTile(
                config.gridX,
                config.gridY
            );
            if (existingSolidTile) {
                // Vérifier si c'est bien une table temporaire (table-mono ou toute texture de table)
                if (
                    existingSolidTile.texture.key === "table-mono" ||
                    existingSolidTile.texture.key.startsWith("table-")
                ) {
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
                        true // isCounter = true pour les tables/comptoirs
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
        const y =
            screenPos.y + this.mapOffsetY + GameConfig.CRAFT_PLAN_OFFSET_Y; // Utiliser la configuration

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
    private adjustCraftPlanRotation(
        craftPlan: Phaser.GameObjects.Image,
        gridX: number,
        gridY: number
    ): void {
        if (!this.isoMap) return;

        const tile = this.isoMap.getSolidTile(gridX, gridY);
        const textureKey = tile?.texture.key;

        if (!textureKey || !textureKey.startsWith("table-")) return;

        // Analyser la texture pour déterminer les ouvertures
        const hasBottom = textureKey.includes("bottom");
        const hasLeft = textureKey.includes("left");
        const hasRight = textureKey.includes("right");
        const hasTop = textureKey.includes("top");

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

        console.log(
            `🔄 Craft plan rotation pour ${textureKey}: ${
                craftPlan.rotation
            } rad (${((craftPlan.rotation * 180) / Math.PI).toFixed(0)}°)`
        );
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
     * Initialise les tiles d'ingrédients
     */
    initializeIngredientTiles(): void {
        this.ingredientTiles.set("1,1", "chocolate");
        this.ingredientTiles.set("1,8", "butter");
        this.ingredientTiles.set("2,8", "flour");
        this.ingredientTiles.set("3,8", "sugar"); // Boîte de sucre à côté de la farine
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
        const isTable = tile?.texture.key?.startsWith("table-") || false;
        const hasCraftPlan = this.hasCraftPlanOverlay(gridX, gridY);

        console.log(
            `isTransformationTable(${gridX}, ${gridY}): texture=${tile?.texture.key}, isTable=${isTable}, hasCraftPlan=${hasCraftPlan}, isCounter=${isCounter}`
        );
        return isTable && hasCraftPlan;
    }

    /**
     * Récupère la table de transformation à une position donnée
     */
    getTransformationTable(
        gridX: number,
        gridY: number
    ): Phaser.Physics.Arcade.Sprite | undefined {
        if (!this.isTransformationTable(gridX, gridY)) return undefined;
        return this.isoMap?.getSolidTile(gridX, gridY);
    }

    /**
     * Vérifie si une position est un four (type 11 - pour cuisson)
     */
    isOven(gridX: number, gridY: number): boolean {
        if (!this.isoMap) return false;
        const tile = this.isoMap.getSolidTile(gridX, gridY);
        const isOven = tile?.texture.key === "oven";
        console.log(
            `isOven(${gridX}, ${gridY}): texture=${tile?.texture.key}, isOven=${isOven}`
        );
        return isOven;
    }

    /**
     * Récupère le four à une position donnée
     */
    getOven(
        gridX: number,
        gridY: number
    ): Phaser.Physics.Arcade.Sprite | undefined {
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


/**
 * Utilitaires pour la conversion de coordonnées de grille
 */

import { TableTileManager } from "../managers/TableTileManager";

export class IsometricUtils {
    // Taille des tiles en pixels (carrés)
    static TILE_WIDTH = 48;
    static TILE_HEIGHT = 48;

    /**
     * Convertit les coordonnées de grille (x, y) en coordonnées écran (grille carrée)
     */
    static gridToScreen(gridX: number, gridY: number): { x: number, y: number } {
        const x = gridX * this.TILE_WIDTH;
        const y = gridY * this.TILE_HEIGHT;
        return { x, y };
    }

    /**
     * Convertit les coordonnées écran en coordonnées de grille
     */
    static screenToGrid(screenX: number, screenY: number): { x: number, y: number } {
        // Utiliser Math.round pour une détection centrée sur les tiles
        // Plus précis que Math.floor qui biaise vers le coin supérieur gauche
        const gridX = Math.round(screenX / this.TILE_WIDTH);
        const gridY = Math.round(screenY / this.TILE_HEIGHT);
        return { x: gridX, y: gridY };
    }

    /**
     * Calcule la profondeur (z-index) pour le tri en grille
     * Plus on est en bas (Y élevé), plus on est devant
     */
    static getDepth(gridX: number, gridY: number): number {
        return gridY * 1000 + gridX;
    }
}

export interface TileData {
    gridX: number;
    gridY: number;
    tileType: string;
    variant?: number;
}

export class IsometricMap {
    private scene: Phaser.Scene;
    private tiles: Map<string, Phaser.GameObjects.Image>;
    private solidTiles: Map<string, Phaser.Physics.Arcade.Sprite>;
    private counterTiles: Map<string, Phaser.Physics.Arcade.Sprite>;
    private mapData: number[][];
    private tableTileManager?: TableTileManager;
    
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.tiles = new Map();
        this.solidTiles = new Map();
        this.counterTiles = new Map();
        this.mapData = [];
    }

    /**
     * Crée une carte à partir d'un tableau 2D
     * @param mapData Tableau 2D où chaque nombre représente un type de tile
     * @param tileTextures Object mappant les numéros aux textures
     * @param offsetX Décalage horizontal de la carte
     * @param offsetY Décalage vertical de la carte
     */
    createMap(mapData: number[][], tileTextures: { [key: number]: string }, offsetX: number = 0, offsetY: number = 0) {
        this.mapData = mapData;
        
        // Initialiser le gestionnaire de tables
        this.tableTileManager = new TableTileManager(mapData);
        const tableConfigs = this.tableTileManager.generateTableConfigurations();
        
        // Afficher les configurations pour débogage
        this.tableTileManager.debugConfigurations(tableConfigs);
        
        // Créer une map des configurations de tables pour accès rapide
        const tableConfigMap = new Map<string, string>();
        tableConfigs.forEach(config => {
            tableConfigMap.set(`${config.gridX},${config.gridY}`, config.texture);
        });
        
        // Créer les tiles
        for (let y = 0; y < mapData.length; y++) {
            for (let x = 0; x < mapData[y].length; x++) {
                const tileType = mapData[y][x];
                if (tileType !== 0) { // 0 = vide
                    const key = `${x},${y}`;
                    
                    // Si c'est une table (type 5), utiliser la configuration calculée
                    if (tileType === 5 && tableConfigMap.has(key)) {
                        const texture = tableConfigMap.get(key)!;
                        
                        // Créer la table (une seule couche maintenant)
                        this.createTile(x, y, texture, offsetX, offsetY, true);
                    } else {
                        // Autres tiles normales
                        // 4 = mur solide (impassable), 6,7,8 = tiles d'ingrédients (impassables mais interactifs), 9 = poubelle (impassable mais interactive), 10 = zone de livraison
                        this.createTile(x, y, tileTextures[tileType] || 'grass', offsetX, offsetY, tileType === 4 || tileType >= 6);
                    }
                }
            }
        }
    }

    /**
     * Crée un tile individuel
     */
    createTile(gridX: number, gridY: number, texture: string, offsetX: number = 0, offsetY: number = 0, isSolid: boolean = false): Phaser.GameObjects.Image | Phaser.Physics.Arcade.Sprite {
        const screenPos = IsometricUtils.gridToScreen(gridX, gridY);
        const key = `${gridX},${gridY}`;
        
        let tile: Phaser.GameObjects.Image | Phaser.Physics.Arcade.Sprite;
        
        if (isSolid) {
            // Créer un sprite avec physique pour les tiles solides
            tile = this.scene.physics.add.sprite(screenPos.x + offsetX, screenPos.y + offsetY, texture);
            tile.setOrigin(0.5, 0.5);
            
            // Configurer le body comme immobile
            const body = (tile as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.Body;
            body.setImmovable(true);
            body.setSize(IsometricUtils.TILE_WIDTH, IsometricUtils.TILE_HEIGHT);
            
            // Différencier les murs des plans de travail et des boîtes d'ingrédients
            if (texture.startsWith('table-')) {
                // Plan de travail (nouvelle gestion avec tuiles modulaires)
                console.log(`🔍 Création table avec pieds:`, {
                    position: `(${gridX}, ${gridY})`,
                    texture,
                    tileWidth: tile.width,
                    tileHeight: tile.height,
                    textureKey: tile.texture.key
                });
                
                // Ajuster la taille pour qu'elle remplisse complètement la tile
                const targetSize = Math.max(IsometricUtils.TILE_WIDTH, IsometricUtils.TILE_HEIGHT);
                const baseScale = targetSize / Math.max(tile.width, tile.height);
                
                // Agrandir les tables pour qu'elles remplissent mieux la tile (x2)
                const scale = baseScale * 1.01;
                
                // Vérifier si le scale est valide
                if (isNaN(scale) || !isFinite(scale) || scale === 0) {
                    console.error(`❌ Scale invalide pour ${texture}:`, scale);
                    tile.setScale(1);
                } else {
                    tile.setScale(scale);
                }
                
                // Hitbox ajustée pour une meilleure précision
                const hitboxSize = IsometricUtils.TILE_WIDTH * 0.7; // 70% de la taille de tile (33.6 pixels)
                body.setSize(hitboxSize, hitboxSize);
                
                this.counterTiles.set(key, tile as Phaser.Physics.Arcade.Sprite);
                
                console.log(`✅ Plan de travail créé à la position (${gridX}, ${gridY}): ${texture} (scale: ${scale.toFixed(2)}, hitbox: ${hitboxSize}, visible: ${tile.visible})`);
            } else if (texture === 'table-bottom') {
                // Ancien système (pour compatibilité)
                const targetSize = Math.max(IsometricUtils.TILE_WIDTH, IsometricUtils.TILE_HEIGHT);
                const baseScale = targetSize / Math.max(tile.width, tile.height);
                const scale = baseScale * 1.01; // Agrandir pour remplir la tile
                tile.setScale(scale);
                
                const hitboxSize = IsometricUtils.TILE_WIDTH * 0.7;
                body.setSize(hitboxSize, hitboxSize);
                
                this.counterTiles.set(key, tile as Phaser.Physics.Arcade.Sprite);
                console.log(`Plan de travail créé à la position (${gridX}, ${gridY}): ${texture} (scale: ${scale.toFixed(2)}, hitbox: ${hitboxSize})`);
            } else if (texture === 'choco_box' || texture === 'butter_box' || texture === 'flour_box') {
                // Boîtes d'ingrédients : impassables mais interactives
                // Ajuster la taille pour qu'elles prennent toute la place dans la tile
                const targetSize = Math.max(IsometricUtils.TILE_WIDTH, IsometricUtils.TILE_HEIGHT);
                const scale = targetSize / Math.max(tile.width, tile.height);
                tile.setScale(scale);
                
                // Hitbox ajustée pour une meilleure précision
                const hitboxSize = IsometricUtils.TILE_WIDTH * 0.7; // 70% de la taille de tile (33.6 pixels)
                body.setSize(hitboxSize, hitboxSize);
                
                console.log(`Boîte d'ingrédient créée à la position (${gridX}, ${gridY}): ${texture} (scale: ${scale.toFixed(2)}, hitbox: ${hitboxSize})`);
            } else if (texture === 'trash-bin') {
                // Poubelle : impassable mais interactive avec hitbox pleine taille
                // Ajuster la taille pour qu'elle prenne toute la place dans la tile
                const targetSize = Math.max(IsometricUtils.TILE_WIDTH, IsometricUtils.TILE_HEIGHT);
                const scale = targetSize / Math.max(tile.width, tile.height);
                tile.setScale(scale);
                
                // Hitbox pleine taille pour la poubelle
                body.setSize(IsometricUtils.TILE_WIDTH, IsometricUtils.TILE_HEIGHT);
                
                console.log(`Poubelle créée à la position (${gridX}, ${gridY}): ${texture} (scale: ${scale.toFixed(2)}, hitbox: ${IsometricUtils.TILE_WIDTH})`);
            }
            
            // Tous les tiles solides (murs + plans de travail + boîtes) vont dans solidTiles pour les collisions
            this.solidTiles.set(key, tile as Phaser.Physics.Arcade.Sprite);
        } else {
            // Créer une image normale pour les tiles traversables
            tile = this.scene.add.image(screenPos.x + offsetX, screenPos.y + offsetY, texture);
            tile.setOrigin(0.5, 0.5);
            
            // Pour la texture planks, s'assurer qu'elle remplit bien la tile
            if (texture === 'planks') {
                const targetSize = Math.max(IsometricUtils.TILE_WIDTH, IsometricUtils.TILE_HEIGHT);
                const scale = targetSize / Math.max(tile.width, tile.height);
                tile.setScale(scale);
                console.log(`Tile de sol créée à la position (${gridX}, ${gridY}): ${texture} (scale: ${scale.toFixed(2)})`);
            }
            
            this.tiles.set(key, tile as Phaser.GameObjects.Image);
        }
        
        // La profondeur est basée sur le bas du tile (pour cohérence avec le joueur)
        const tileBottom = tile.y + tile.height * (1 - tile.originY);
        tile.setDepth(tileBottom);
        
        return tile;
    }


    /**
     * Récupère un tile à une position de grille donnée
     */
    getTile(gridX: number, gridY: number): Phaser.GameObjects.Image | undefined {
        return this.tiles.get(`${gridX},${gridY}`);
    }

    /**
     * Supprime un tile
     */
    removeTile(gridX: number, gridY: number) {
        const tile = this.getTile(gridX, gridY);
        if (tile) {
            tile.destroy();
            this.tiles.delete(`${gridX},${gridY}`);
        }
    }

    /**
     * Déplace tous les tiles (pour centrer la caméra)
     */
    offsetMap(offsetX: number, offsetY: number) {
        this.tiles.forEach(tile => {
            tile.x += offsetX;
            tile.y += offsetY;
        });
    }

    /**
     * Détruit tous les tiles
     */
    destroy() {
        this.tiles.forEach(tile => tile.destroy());
        this.tiles.clear();
        
        this.solidTiles.forEach(tile => tile.destroy());
        this.solidTiles.clear();
        
        this.counterTiles.forEach(tile => tile.destroy());
        this.counterTiles.clear();
    }

    /**
     * Récupère tous les tiles solides pour les collisions
     */
    getSolidTiles(): Phaser.Physics.Arcade.Sprite[] {
        return Array.from(this.solidTiles.values());
    }

    /**
     * Récupère tous les plans de travail
     */
    getCounterTiles(): Phaser.Physics.Arcade.Sprite[] {
        return Array.from(this.counterTiles.values());
    }

    /**
     * Vérifie si une position de grille contient un plan de travail
     */
    isCounter(gridX: number, gridY: number): boolean {
        const key = `${gridX},${gridY}`;
        return this.counterTiles.has(key);
    }

    /**
     * Récupère un plan de travail à une position donnée
     */
    getCounter(gridX: number, gridY: number): Phaser.Physics.Arcade.Sprite | undefined {
        const key = `${gridX},${gridY}`;
        return this.counterTiles.get(key);
    }
}


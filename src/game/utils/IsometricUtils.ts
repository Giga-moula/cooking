/**
 * Utilitaires pour la conversion de coordonnées de grille
 */

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
        
        for (let y = 0; y < mapData.length; y++) {
            for (let x = 0; x < mapData[y].length; x++) {
                const tileType = mapData[y][x];
                if (tileType !== 0) { // 0 = vide
                    // 4 = mur solide (impassable), 5 = plan de travail (impassable mais interactif)
                    this.createTile(x, y, tileTextures[tileType] || 'grass', offsetX, offsetY, tileType === 4 || tileType === 5);
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
            
            // Différencier les murs des plans de travail
            if (texture === 'iso-counter') {
                // Plan de travail : impassable mais interactif
                this.counterTiles.set(key, tile as Phaser.Physics.Arcade.Sprite);
                console.log(`Plan de travail créé à la position (${gridX}, ${gridY})`);
            }
            
            // Tous les tiles solides (murs + plans de travail) vont dans solidTiles pour les collisions
            this.solidTiles.set(key, tile as Phaser.Physics.Arcade.Sprite);
        } else {
            // Créer une image normale pour les tiles traversables
            tile = this.scene.add.image(screenPos.x + offsetX, screenPos.y + offsetY, texture);
            tile.setOrigin(0.5, 0.5);
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


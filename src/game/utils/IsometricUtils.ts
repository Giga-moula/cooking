/**
 * Utilitaires pour la conversion de coordonnées de grille
 */

export class IsometricUtils {
    // Taille des tiles en pixels (carrés)
    static TILE_WIDTH = 64;  // Modifier ici pour changer la taille
    static TILE_HEIGHT = 64;

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

    /**
     * Calcule le scale nécessaire pour adapter une image à la taille des tiles
     */
    static calculateTileScale(imageWidth: number, imageHeight: number): number {
        // On utilise la plus petite dimension pour garder les proportions
        const scaleX = this.TILE_WIDTH / imageWidth; 
        const scaleY = this.TILE_HEIGHT / imageHeight;
        return Math.min(scaleX, scaleY);
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
                    // 4 = mur solide (impassable), 5 = plan de travail (impassable mais interactif), 6,7,8 = tiles d'ingrédients (impassables mais interactifs)
                    this.createTile(x, y, tileTextures[tileType] || 'grass', offsetX, offsetY, tileType === 4 || tileType === 5 || tileType >= 6, tileType === 5 || tileType >= 6);
                }
            }
        }
    }

    /**
     * Crée un tile individuel
     */
    createTile(gridX: number, gridY: number, texture: string, offsetX: number = 0, offsetY: number = 0, isSolid: boolean = false, isCounter: boolean = false): Phaser.GameObjects.Image | Phaser.Physics.Arcade.Sprite {
        const screenPos = IsometricUtils.gridToScreen(gridX, gridY);
        const key = `${gridX},${gridY}`;
        
        let tile: Phaser.GameObjects.Image | Phaser.Physics.Arcade.Sprite;
        
        if (isSolid) {
            // Créer un sprite avec physique pour les tiles solides
            tile = this.scene.physics.add.sprite(screenPos.x + offsetX, screenPos.y + offsetY, texture);
            tile.setOrigin(0.5, 0.5);
            
            // Appliquer le scale automatique pour les images (pas les tiles procédurales)
            this.applyAutoScale(tile, texture);
            
            // Configurer la physique APRÈS le scale pour que les collisions correspondent à la taille réelle du sprite
            const body = (tile as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.Body;
            body.setImmovable(true);
            
            // Pour les tiles procédurales (iso-*), utiliser la taille des tiles
            if (texture.startsWith('iso-')) {
                body.setSize(IsometricUtils.TILE_WIDTH, IsometricUtils.TILE_HEIGHT);
                body.setOffset(0, 0);
            } else {
                // Pour les images réelles (tables, etc.), utiliser la taille réelle du sprite après scale
                const scaledWidth = tile.width;
                const scaledHeight = tile.height;
                
                // Ajuster la zone de collision selon le type de texture
                let collisionRatio = 1; // Par défaut, 80% de la taille du sprite
                
                if (texture.startsWith('table-')) {
                    // Pour les tables, utiliser une zone de collision plus précise
                    collisionRatio = 1; // 70% pour les tables
                }
                
                const collisionWidth = Math.min(scaledWidth * collisionRatio, IsometricUtils.TILE_WIDTH);
                const collisionHeight = Math.min(scaledHeight * collisionRatio, IsometricUtils.TILE_HEIGHT);
                
                body.setSize(collisionWidth, collisionHeight);
                body.setOffset(
                    (scaledWidth - collisionWidth) / 2,
                    (scaledHeight - collisionHeight) / 2
                );
                
                console.log(`Zone de collision pour ${texture}: ${collisionWidth.toFixed(1)}x${collisionHeight.toFixed(1)} (sprite: ${scaledWidth.toFixed(1)}x${scaledHeight.toFixed(1)}, ratio: ${collisionRatio})`);
            }
            
            // Différencier les murs des plans de travail / tables
            if (texture === 'iso-counter' || texture.startsWith('table-') || isCounter) {
                // Plan de travail / Table : impassable mais interactif
                this.counterTiles.set(key, tile as Phaser.Physics.Arcade.Sprite);
                console.log(`Plan de travail/table créé à la position (${gridX}, ${gridY}) avec texture: ${texture}`);
            }
            
            // Tous les tiles solides (murs + plans de travail) vont dans solidTiles pour les collisions
            this.solidTiles.set(key, tile as Phaser.Physics.Arcade.Sprite);
        } else {
            // Créer une image normale pour les tiles traversables
            tile = this.scene.add.image(screenPos.x + offsetX, screenPos.y + offsetY, texture);
            tile.setOrigin(0.5, 0.5);
            this.tiles.set(key, tile as Phaser.GameObjects.Image);
            
            // Appliquer le scale automatique pour les images (pas les tiles procédurales)
            this.applyAutoScale(tile, texture);
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
     * Récupère un tile solide à une position de grille donnée
     */
    getSolidTile(gridX: number, gridY: number): Phaser.Physics.Arcade.Sprite | undefined {
        return this.solidTiles.get(`${gridX},${gridY}`);
    }

    /**
     * Applique un scale automatique aux images pour les adapter à la taille des tiles
     */
    private applyAutoScale(tile: Phaser.GameObjects.Image | Phaser.Physics.Arcade.Sprite, texture: string): void {
        // Ne pas appliquer de scale aux textures procédurales (qui commencent par "iso-")
        if (texture.startsWith('iso-')) {
            return;
        }

        try {
            // Récupérer la texture et ses dimensions
            const textureObj = this.scene.textures.get(texture);
            if (textureObj && textureObj.source.length > 0) {
                const source = textureObj.source[0] as unknown as HTMLImageElement;
                const imageWidth = source.width;
                const imageHeight = source.height;
                
                // Calculer et appliquer le scale
                const scale = IsometricUtils.calculateTileScale(imageWidth, imageHeight);
                tile.setScale(scale);
                
                console.log(`Scale appliqué à ${texture}: ${scale} (image: ${imageWidth}x${imageHeight}, tile: ${IsometricUtils.TILE_WIDTH}x${IsometricUtils.TILE_HEIGHT})`);
            }
        } catch (error) {
            console.warn(`Impossible de calculer le scale pour ${texture}:`, error);
        }
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
     * Supprime un tile solide
     */
    removeSolidTile(gridX: number, gridY: number) {
        const key = `${gridX},${gridY}`;
        const tile = this.getSolidTile(gridX, gridY);
        if (tile) {
            tile.destroy();
            this.solidTiles.delete(key);
            // Aussi retirer de counterTiles si c'est une table/comptoir
            this.counterTiles.delete(key);
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


/**
 * Gestionnaire de tuiles de comptoir/table
 * Détecte automatiquement les groupes de comptoirs et attribue les bons sprites
 */

export interface TableTileConfig {
    gridX: number;
    gridY: number;
    texture: string;  // Texture complète de la table
    isTransformationTable?: boolean; // True si c'est une table de transformation (type 10)
}

export class TableTileManager {
    private mapData: number[][];
    private tableValue: number = 5;        // Valeur qui représente une table normale dans mapData
    private transformationTableValue: number = 10; // Valeur qui représente une table de transformation dans mapData
    private allTableValues: number[] = [5, 10]; // Toutes les valeurs considérées comme "tables" pour les adjacences

    constructor(mapData: number[][]) {
        this.mapData = mapData;
    }

    /**
     * Analyse la carte et génère les configurations de tuiles pour tous les comptoirs
     */
    public generateTableConfigurations(): TableTileConfig[] {
        const configurations: TableTileConfig[] = [];

        for (let y = 0; y < this.mapData.length; y++) {
            for (let x = 0; x < this.mapData[y].length; x++) {
                // Vérifier si c'est une table normale ou spéciale
                if (this.allTableValues.includes(this.mapData[y][x])) {
                    const config = this.getTableConfiguration(x, y);
                    configurations.push(config);
                }
            }
        }

        return configurations;
    }

    /**
     * Détermine la configuration d'un comptoir à une position donnée
     */
    private getTableConfiguration(gridX: number, gridY: number): TableTileConfig {
        const currentValue = this.mapData[gridY][gridX];
        const isTransformationTable = currentValue === this.transformationTableValue;
        
        // Vérifier les comptoirs adjacents dans les 4 directions
        // Les tables de transformation et normales se comptent mutuellement pour les adjacences
        const hasTop = this.isTable(gridX, gridY - 1);
        const hasBottom = this.isTable(gridX, gridY + 1);
        const hasLeft = this.isTable(gridX - 1, gridY);
        const hasRight = this.isTable(gridX + 1, gridY);

        // Générer le nom de texture selon les adjacences
        const texture = this.getTableTexture(hasTop, hasBottom, hasLeft, hasRight, isTransformationTable);

        return {
            gridX,
            gridY,
            texture,
            isTransformationTable,
        };
    }

    /**
     * Vérifie si une position contient un comptoir (table normale ou table de transformation)
     */
    private isTable(gridX: number, gridY: number): boolean {
        // Vérifier les limites de la carte
        if (gridY < 0 || gridY >= this.mapData.length) return false;
        if (gridX < 0 || gridX >= this.mapData[gridY].length) return false;

        // Accepter toutes les valeurs de tables pour les adjacences
        return this.allTableValues.includes(this.mapData[gridY][gridX]);
    }

    /**
     * Génère le nom de texture selon les adjacences
     * Fichiers disponibles :
     * - table-mono / iso-transformation-table (texture de base)
     * - table-open-[right|left|right-left]-[top]-[bottom] (pour les tables normales avec adjacences)
     * - iso-transformation-table (pour les tables de transformation, texture procédurale temporaire)
     */
    private getTableTexture(
        hasTop: boolean,
        hasBottom: boolean,
        hasLeft: boolean,
        hasRight: boolean,
        isTransformationTable: boolean = false
    ): string {
        // Pour les tables de transformation, utiliser la texture procédurale pour l'instant
        // Plus tard, on pourra créer des textures spéciales comme les tables
        if (isTransformationTable) {
            return "iso-transformation-table";
        }
        
        // Pour les tables normales
        // Si aucune table adjacente, c'est une table isolée
        if (!hasTop && !hasBottom && !hasLeft && !hasRight) {
            return "table-mono";
        }

        // Construire le nom de la texture selon les adjacences
        // Format: table-open-[directions]
        const parts: string[] = [];

        // Gérer left/right (ordre: right-left si les deux)
        if (hasRight && hasLeft) {
            parts.push("right-left");
        } else if (hasRight) {
            parts.push("right");
        } else if (hasLeft) {
            parts.push("left");
        }

        // Ajouter top si présent
        if (hasTop) {
            parts.push("top");
        }

        // Ajouter bottom si présent
        if (hasBottom) {
            parts.push("bottom");
        }

        if (parts.length === 0) {
            return "table-mono";
        }

        return `table-open-${parts.join("-")}`;
    }

    /**
     * Affiche un résumé des configurations pour débogage
     */
}


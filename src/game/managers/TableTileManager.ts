/**
 * Gestionnaire de tuiles de table
 * Détecte automatiquement les groupes de tables et attribue les bons sprites
 */

export interface TableTileConfig {
    gridX: number;
    gridY: number;
    texture: string;  // Texture complète de la table
}

export class TableTileManager {
    private mapData: number[][];
    private tableValue: number = 5; // Valeur qui représente une table dans mapData

    constructor(mapData: number[][]) {
        this.mapData = mapData;
    }

    /**
     * Analyse la carte et génère les configurations de tuiles pour toutes les tables
     */
    public generateTableConfigurations(): TableTileConfig[] {
        const configurations: TableTileConfig[] = [];

        for (let y = 0; y < this.mapData.length; y++) {
            for (let x = 0; x < this.mapData[y].length; x++) {
                if (this.mapData[y][x] === this.tableValue) {
                    const config = this.getTableConfiguration(x, y);
                    configurations.push(config);
                }
            }
        }

        return configurations;
    }

    /**
     * Détermine la configuration d'une table à une position donnée
     */
    private getTableConfiguration(gridX: number, gridY: number): TableTileConfig {
        // Vérifier les tables adjacentes dans les 4 directions
        const hasTop = this.isTable(gridX, gridY - 1);
        const hasBottom = this.isTable(gridX, gridY + 1);
        const hasLeft = this.isTable(gridX - 1, gridY);
        const hasRight = this.isTable(gridX + 1, gridY);

        // Générer le nom de texture selon les adjacences
        const texture = this.getTableTexture(hasTop, hasBottom, hasLeft, hasRight);

        return {
            gridX,
            gridY,
            texture,
        };
    }

    /**
     * Vérifie si une position contient une table
     */
    private isTable(gridX: number, gridY: number): boolean {
        // Vérifier les limites de la carte
        if (gridY < 0 || gridY >= this.mapData.length) return false;
        if (gridX < 0 || gridX >= this.mapData[gridY].length) return false;

        return this.mapData[gridY][gridX] === this.tableValue;
    }

    /**
     * Génère le nom de texture selon les adjacences
     * Fichiers disponibles :
     * - table-mono
     * - table-open-[right|left|right-left]-[top]-[bottom]
     */
    private getTableTexture(
        hasTop: boolean,
        hasBottom: boolean,
        hasLeft: boolean,
        hasRight: boolean
    ): string {
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
    public debugConfigurations(configurations: TableTileConfig[]): void {
        console.log("=== Configuration des tables ===");
        configurations.forEach((config) => {
            console.log(
                `Position (${config.gridX}, ${config.gridY}): ${config.texture}`
            );
        });
        console.log("================================");
    }
}


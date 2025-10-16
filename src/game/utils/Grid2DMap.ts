/**
 * Map 2D optimisée pour stocker des valeurs avec des coordonnées de grille
 * Plus performant que Map<string, T> avec des clés "x,y"
 */
export class Grid2DMap<T> {
    private map: Map<number, Map<number, T>> = new Map();
    private _size: number = 0;

    /**
     * Définit une valeur à la position (x, y)
     */
    set(x: number, y: number, value: T): void {
        if (!this.map.has(x)) {
            this.map.set(x, new Map());
        }
        const yMap = this.map.get(x)!;
        if (!yMap.has(y)) {
            this._size++;
        }
        yMap.set(y, value);
    }

    /**
     * Récupère une valeur à la position (x, y)
     */
    get(x: number, y: number): T | undefined {
        return this.map.get(x)?.get(y);
    }

    /**
     * Vérifie si une position (x, y) existe dans la map
     */
    has(x: number, y: number): boolean {
        return this.map.get(x)?.has(y) ?? false;
    }

    /**
     * Supprime une valeur à la position (x, y)
     */
    delete(x: number, y: number): boolean {
        const yMap = this.map.get(x);
        if (!yMap) return false;
        
        const deleted = yMap.delete(y);
        if (deleted) {
            this._size--;
            // Nettoyer la map X si elle est vide
            if (yMap.size === 0) {
                this.map.delete(x);
            }
        }
        return deleted;
    }

    /**
     * Vide complètement la map
     */
    clear(): void {
        this.map.clear();
        this._size = 0;
    }

    /**
     * Retourne le nombre d'éléments dans la map
     */
    get size(): number {
        return this._size;
    }

    /**
     * Exécute une fonction pour chaque élément de la map
     */
    forEach(callback: (value: T, x: number, y: number) => void): void {
        this.map.forEach((yMap, x) => {
            yMap.forEach((value, y) => {
                callback(value, x, y);
            });
        });
    }

    /**
     * Retourne toutes les entrées sous forme de tableau
     */
    entries(): Array<{ x: number; y: number; value: T }> {
        const result: Array<{ x: number; y: number; value: T }> = [];
        this.forEach((value, x, y) => {
            result.push({ x, y, value });
        });
        return result;
    }

    /**
     * Retourne toutes les valeurs
     */
    values(): T[] {
        const result: T[] = [];
        this.forEach((value) => {
            result.push(value);
        });
        return result;
    }
}


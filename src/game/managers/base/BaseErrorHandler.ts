/**
 * Classe de base pour la gestion des erreurs dans le jeu
 */
export abstract class BaseErrorHandler {
    protected scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * Log une erreur avec contexte
     */
    protected logError(error: string, context?: any): void {
        console.error(`❌ ${this.constructor.name}: ${error}`, context || '');
    }

    /**
     * Log un avertissement avec contexte
     */
    protected logWarning(warning: string, context?: any): void {
        console.warn(`⚠️ ${this.constructor.name}: ${warning}`, context || '');
    }

    /**
     * Log une information avec contexte
     */
    protected logInfo(info: string, context?: any): void {
        console.log(`ℹ️ ${this.constructor.name}: ${info}`, context || '');
    }

    /**
     * Vérifie si une condition est remplie, sinon log une erreur
     */
    protected assert(condition: boolean, errorMessage: string): void {
        if (!condition) {
            this.logError(errorMessage);
        }
    }

    /**
     * Vérifie si un objet existe, sinon log une erreur
     */
    protected assertExists<T>(obj: T | null | undefined, objectName: string): obj is T {
        if (!obj) {
            this.logError(`${objectName} is null or undefined`);
            return false;
        }
        return true;
    }

    /**
     * Gère une erreur de manière sécurisée
     */
    protected handleError(error: Error, context: string): void {
        this.logError(`Error in ${context}: ${error.message}`);
        // Ici on pourrait ajouter d'autres actions comme sauvegarder l'erreur, etc.
    }
}

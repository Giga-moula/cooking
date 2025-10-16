/**
 * Système de logging conditionnel pour le développement et la production
 * Les logs de debug sont désactivés en production pour améliorer les performances
 */
export class Logger {
    private static DEBUG = process.env.NODE_ENV !== 'production';
    
    /**
     * Log général (désactivé en production)
     */
    static log(...args: any[]): void {
        if (this.DEBUG) {
            console.log(...args);
        }
    }
    
    /**
     * Warning (désactivé en production)
     */
    static warn(...args: any[]): void {
        if (this.DEBUG) {
            console.warn(...args);
        }
    }
    
    /**
     * Erreur (toujours affiché, même en production)
     */
    static error(...args: any[]): void {
        console.error(...args);
    }
    
    /**
     * Info (toujours affiché)
     */
    static info(...args: any[]): void {
        console.info(...args);
    }
    
    /**
     * Active ou désactive le mode debug manuellement
     */
    static setDebugMode(enabled: boolean): void {
        this.DEBUG = enabled;
    }
    
    /**
     * Vérifie si le mode debug est actif
     */
    static isDebugMode(): boolean {
        return this.DEBUG;
    }
}


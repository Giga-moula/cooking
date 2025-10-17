import Phaser from "phaser";

/**
 * Gestionnaire des sons d'actions
 * Gère la lecture des sons pour les actions spécifiques du jeu
 */
export class ActionSoundManager {
    private scene: Phaser.Scene;
    private currentInputIndex: number = 0;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * Joue le son de récupération réussie d'un ingrédient mergé
     */
    playRecupSuccess(): void {
        console.log("🎵 Jouer son de récupération réussie");
        this.playSoundWithCut("recup_success", 0.1); // Volume réduit à 20%
    }

    /**
     * Joue le son de dash
     */
    playDash(): void {
        console.log("🎵 Jouer son de dash");
        this.playSound("dash");
    }

    /**
     * Joue le son d'échec d'input
     */
    playFailedInput(): void {
        console.log("🎵 Jouer son d'échec d'input");
        this.playSound("failedInput");
    }

    /**
     * Joue un son de bon input dans l'ordre séquentiel (1, 2, 3, 4)
     */
    playGoodInput(): void {
        const goodInputs = [
            "goodInput1",
            "goodInput2",
            "goodInput3",
            "goodInput4",
        ];

        // Utiliser l'index actuel et l'incrémenter
        const selectedSound =
            goodInputs[this.currentInputIndex % goodInputs.length];
        this.currentInputIndex++;

        console.log(
            `🎵 Jouer son de bon input: ${selectedSound} (index: ${
                this.currentInputIndex - 1
            })`
        );
        this.playSound(selectedSound);
    }

    /**
     * Joue un son en coupant le précédent s'il est en cours
     */
    private playSoundWithCut(soundKey: string, volume: number = 0.7): void {
        // Arrêter le son s'il est déjà en cours
        const existingSound = this.scene.sound.get(soundKey);
        if (existingSound && existingSound.isPlaying) {
            console.log(`🔇 Arrêt du son précédent: ${soundKey}`);
            existingSound.stop();
        }

        // Jouer le nouveau son
        this.playSound(soundKey, volume);
    }

    /**
     * Joue un son avec gestion des conflits
     */
    private playSound(soundKey: string, volume: number = 0.7): void {
        console.log(`🔊 Tentative de jouer le son: ${soundKey}`);

        // Créer une nouvelle instance du son pour permettre la lecture simultanée
        const sound = this.scene.sound.add(soundKey, {
            volume: volume,
        });

        if (sound) {
            console.log(`🔊 Lancement du son: ${soundKey} (volume: ${volume})`);
            try {
                sound.play();
                console.log(`✅ Son joué avec succès: ${soundKey}`);

                // Nettoyer le son après la lecture pour éviter l'accumulation
                sound.on("complete", () => {
                    sound.destroy();
                });
            } catch (error) {
                console.error(
                    `❌ Erreur lors de la lecture du son ${soundKey}:`,
                    error
                );
            }
        } else {
            console.warn(`🔊 Impossible de créer le son: ${soundKey}`);
            const sounds = (this.scene.sound as any).sounds || {};
            console.log("🔍 Sons disponibles:", Object.keys(sounds));
        }
    }

    /**
     * Réinitialise l'index des inputs pour une nouvelle séquence
     */
    resetInputSequence(): void {
        this.currentInputIndex = 0;
        console.log("🎵 ActionSoundManager: Séquence d'inputs réinitialisée");
    }

    /**
     * Nettoie les ressources du ActionSoundManager
     */
    cleanup(): void {
        // Pas de timers à nettoyer pour l'instant
    }
}


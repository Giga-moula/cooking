import Phaser from "phaser";
import { Logger } from "../utils/Logger";

/**
 * Gestionnaire des sons d'actions
 * Gère la lecture des sons pour les actions spécifiques du jeu
 */
export class ActionSoundManager {
    private scene: Phaser.Scene;
    private currentInputIndex: number = 0;
    private activeSounds: Set<Phaser.Sound.BaseSound> = new Set();

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * Joue le son de récupération réussie d'un ingrédient mergé
     */
    playRecupSuccess(): void {
        Logger.log("🎵 Jouer son de récupération réussie");
        this.playSoundWithCut("recup_success", 0.1); // Volume réduit à 20%
    }

    /**
     * Joue le son de dash
     */
    playDash(): void {
        Logger.log("🎵 Jouer son de dash");
        this.playSound("dash");
    }

    /**
     * Joue le son d'échec d'input
     */
    playFailedInput(): void {
        Logger.log("🎵 Jouer son d'échec d'input");
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

        Logger.log(
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
            Logger.log(`🔇 Arrêt du son précédent: ${soundKey}`);
            existingSound.stop();
        }

        // Jouer le nouveau son
        this.playSound(soundKey, volume);
    }

    /**
     * Joue un son avec gestion des conflits
     */
    private playSound(soundKey: string, volume: number = 0.7): void {
        Logger.log(`🔊 Tentative de jouer le son: ${soundKey}`);

        // Créer une nouvelle instance du son pour permettre la lecture simultanée
        const sound = this.scene.sound.add(soundKey, {
            volume: volume,
        });

        if (sound) {
            Logger.log(`🔊 Lancement du son: ${soundKey} (volume: ${volume})`);
            try {
                this.activeSounds.add(sound);
                sound.play();
                Logger.log(`✅ Son joué avec succès: ${soundKey}`);

                // Nettoyer le son après la lecture pour éviter l'accumulation
                sound.on("complete", () => {
                    this.activeSounds.delete(sound);
                    sound.destroy();
                });
            } catch (error) {
                Logger.error(
                    `❌ Erreur lors de la lecture du son ${soundKey}:`,
                    error
                );
            }
        } else {
            Logger.warn(`🔊 Impossible de créer le son: ${soundKey}`);
            const sounds = (this.scene.sound as any).sounds || {};
            Logger.log("🔍 Sons disponibles:", Object.keys(sounds));
        }
    }

    /**
     * Réinitialise l'index des inputs pour une nouvelle séquence
     */
    resetInputSequence(): void {
        this.currentInputIndex = 0;
        Logger.log("🎵 ActionSoundManager: Séquence d'inputs réinitialisée");
    }

    /**
     * Nettoie les ressources du ActionSoundManager
     */
    cleanup(): void {
        for (const sound of this.activeSounds) {
            sound.stop();
            sound.destroy();
        }
        this.activeSounds.clear();
    }
}


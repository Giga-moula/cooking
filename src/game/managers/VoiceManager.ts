import Phaser from "phaser";
import { DEFAULT_VOICE_CONFIGS, VoiceConfig } from "../config/VoiceConfig";
import { Logger } from "../utils/Logger";

/**
 * Gestionnaire des voix des personnages
 * Gère la lecture des sons avec des pourcentages de chance
 */
export class VoiceManager {
    private scene: Phaser.Scene;
    private voiceConfigs: Map<string, VoiceConfig> = new Map();
    private randomVoiceTimer?: Phaser.Time.TimerEvent;
    private readonly RANDOM_VOICE_INTERVAL = 30000; // 30 secondes

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.initializeVoiceConfigs();
        this.startRandomVoiceTimer();
    }

    /**
     * Initialise le VoiceManager après le chargement complet des sons
     */
    initializeAfterLoad(): void {
        // Log des sons disponibles pour debug
        const sounds = (this.scene.sound as any).sounds || {};
        Logger.log("🔍 Sons disponibles dans la scène:", Object.keys(sounds));
    }

    /**
     * Initialise les configurations des voix
     */
    private initializeVoiceConfigs(): void {
        // Charger les configurations par défaut
        for (const [voiceId, config] of DEFAULT_VOICE_CONFIGS) {
            this.voiceConfigs.set(voiceId, { ...config });
        }
    }

    /**
     * Démarre le timer pour les voix aléatoires
     */
    private startRandomVoiceTimer(): void {
        this.randomVoiceTimer = this.scene.time.addEvent({
            delay: this.RANDOM_VOICE_INTERVAL,
            callback: () => {
                this.playRandomVoice();
                // Redémarrer le timer
                this.startRandomVoiceTimer();
            },
            loop: false,
        });
    }

    /**
     * Joue une voix aléatoire parmi les voix marquées comme "random"
     */
    private playRandomVoice(): void {
        Logger.log("🎲 Déclenchement d'une voix aléatoire...");

        // Récupérer toutes les voix aléatoires (tous joueurs)
        const randomVoices: string[] = [];
        for (const [voiceId, config] of this.voiceConfigs) {
            if (config.ingredient === "random") {
                randomVoices.push(voiceId);
            }
        }

        if (randomVoices.length === 0) {
            Logger.log("🎲 Aucune voix aléatoire trouvée");
            return;
        }

        // Sélectionner une voix aléatoire
        const randomIndex = Math.floor(Math.random() * randomVoices.length);
        const selectedVoiceId = randomVoices[randomIndex];
        const selectedConfig = this.voiceConfigs.get(selectedVoiceId);

        Logger.log(
            `🎲 Voix aléatoire sélectionnée: ${selectedVoiceId} (Joueur ${selectedConfig?.playerNumber})`
        );
        this.tryPlayVoice(selectedVoiceId);
    }

    /**
     * Joue une voix aléatoire basée sur l'ingrédient et le joueur
     */
    playVoiceForIngredient(ingredient: string, playerNumber: number): void {
        Logger.log(
            `🎤 Tentative de jouer une voix pour ${ingredient} (Joueur ${playerNumber})`
        );

        // Chercher une voix correspondante
        for (const [voiceId, config] of this.voiceConfigs) {
            if (
                config.ingredient === ingredient &&
                config.playerNumber === playerNumber
            ) {
                Logger.log(
                    `🎤 Voix trouvée: ${voiceId} (probabilité: ${config.probability}%)`
                );
                this.tryPlayVoice(voiceId);
                return;
            }
        }

        Logger.log(
            `🎤 Aucune voix trouvée pour ${ingredient} (Joueur ${playerNumber})`
        );
    }

    /**
     * Joue une voix spécifique par son ID
     */
    playVoice(voiceId: string): void {
        this.tryPlayVoice(voiceId);
    }

    /**
     * Joue une voix pour l'utilisation de la casserole
     */
    playVoiceForCasserole(playerNumber: number): void {
        Logger.log(
            `🎤 Tentative de jouer une voix pour casserole (Joueur ${playerNumber})`
        );

        // Chercher une voix correspondante pour la casserole
        for (const [voiceId, config] of this.voiceConfigs) {
            if (
                config.ingredient === "casserole" &&
                config.playerNumber === playerNumber
            ) {
                Logger.log(
                    `🎤 Voix de casserole trouvée: ${voiceId} (probabilité: ${config.probability}%)`
                );
                this.tryPlayVoice(voiceId);
                return;
            }
        }

        Logger.log(
            `🎤 Aucune voix de casserole trouvée pour le Joueur ${playerNumber}`
        );
    }

    /**
     * Joue une voix pour l'utilisation du four
     */
    playVoiceForOven(playerNumber: number): void {
        Logger.log(
            `🎤 Tentative de jouer une voix pour four (Joueur ${playerNumber})`
        );

        // Chercher une voix correspondante pour le four
        for (const [voiceId, config] of this.voiceConfigs) {
            if (
                config.ingredient === "oven" &&
                config.playerNumber === playerNumber
            ) {
                Logger.log(
                    `🎤 Voix de four trouvée: ${voiceId} (probabilité: ${config.probability}%)`
                );
                this.tryPlayVoice(voiceId);
                return;
            }
        }

        Logger.log(
            `🎤 Aucune voix de four trouvée pour le Joueur ${playerNumber}`
        );
    }

    /**
     * Joue une voix pour les transformations simples (1 ingrédient → 1 autre)
     */
    playVoiceForTransformation(playerNumber: number): void {
        Logger.log(
            `🎤 Tentative de jouer une voix pour transformation simple (Joueur ${playerNumber})`
        );

        // Chercher une voix correspondante pour les transformations simples
        for (const [voiceId, config] of this.voiceConfigs) {
            if (
                config.ingredient === "transform" &&
                config.playerNumber === playerNumber
            ) {
                Logger.log(
                    `🎤 Voix de transformation trouvée: ${voiceId} (probabilité: ${config.probability}%)`
                );
                this.tryPlayVoice(voiceId);
                return;
            }
        }

        Logger.log(
            `🎤 Aucune voix de transformation simple trouvée pour le Joueur ${playerNumber}`
        );
    }

    /**
     * Tente de jouer une voix selon sa probabilité
     */
    private tryPlayVoice(voiceId: string): void {
        const config = this.voiceConfigs.get(voiceId);
        if (!config) {
            Logger.warn(`Configuration de voix non trouvée: ${voiceId}`);
            return;
        }

        // Créer le son s'il n'existe pas déjà
        let sound = this.scene.sound.get(config.soundKey);
        if (!sound) {
            // Essayer de créer le son depuis le cache de chargement
            sound = this.scene.sound.add(config.soundKey, {
                volume: 0.7,
            });
            if (!sound) {
                Logger.warn(`Son non trouvé: ${config.soundKey}`);
                const sounds = (this.scene.sound as any).sounds || {};
                Logger.log("🔍 Sons disponibles:", Object.keys(sounds));
                return;
            }
        }

        // Calculer si la voix doit être jouée selon la probabilité
        const randomValue = Math.random() * 100;
        Logger.log(
            `🎲 Valeur aléatoire: ${randomValue.toFixed(2)}% (seuil: ${
                config.probability
            }%)`
        );

        if (randomValue <= config.probability) {
            Logger.log(`🎵 Jouer le son: ${config.soundKey}`);
            this.playSound(config.soundKey);
        } else {
            Logger.log(`🎵 Son non joué (probabilité insuffisante)`);
        }
    }

    /**
     * Joue un son avec gestion des conflits
     */
    private playSound(soundKey: string): void {
        let sound = this.scene.sound.get(soundKey);
        if (!sound) {
            // Essayer de créer le son depuis le cache de chargement
            sound = this.scene.sound.add(soundKey, {
                volume: 0.7,
            });
        }

        if (sound && !sound.isPlaying) {
            Logger.log(`🔊 Lancement du son: ${soundKey}`);
            try {
                sound.play();
                Logger.log(`✅ Son joué avec succès: ${soundKey}`);
            } catch (error) {
                Logger.error(
                    `❌ Erreur lors de la lecture du son ${soundKey}:`,
                    error
                );
            }
        } else if (sound && sound.isPlaying) {
            Logger.log(`🔊 Son déjà en cours: ${soundKey}`);
        } else {
            Logger.warn(`🔊 Impossible de jouer le son: ${soundKey}`);
            const sounds = (this.scene.sound as any).sounds || {};
            Logger.log("🔍 Sons disponibles:", Object.keys(sounds));
        }
    }

    /**
     * Ajoute une nouvelle configuration de voix
     */
    addVoiceConfig(voiceId: string, config: VoiceConfig): void {
        this.voiceConfigs.set(voiceId, config);
    }

    /**
     * Met à jour la probabilité d'une voix existante
     */
    updateVoiceProbability(voiceId: string, newProbability: number): void {
        const config = this.voiceConfigs.get(voiceId);
        if (config) {
            config.probability = Math.max(0, Math.min(100, newProbability));
        }
    }

    /**
     * Obtient la configuration d'une voix
     */
    getVoiceConfig(voiceId: string): VoiceConfig | undefined {
        return this.voiceConfigs.get(voiceId);
    }

    /**
     * Obtient toutes les configurations de voix
     */
    getAllVoiceConfigs(): Map<string, VoiceConfig> {
        return new Map(this.voiceConfigs);
    }

    /**
     * Nettoie les ressources du VoiceManager
     */
    cleanup(): void {
        if (this.randomVoiceTimer) {
            this.randomVoiceTimer.destroy();
            this.randomVoiceTimer = undefined;
        }
    }
}


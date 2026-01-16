import Phaser from "phaser";
import { Logger } from "./Logger";

/**
 * Plays a sound with automatic cleanup and error handling
 * @param scene - The Phaser scene to play the sound in
 * @param key - The sound key to play
 * @param volume - Volume level (default 1)
 * @param onComplete - Optional callback when sound finishes
 * @returns The created sound instance, or null if creation failed
 */
export function playSound(
    scene: Phaser.Scene,
    key: string,
    volume: number = 1,
    onComplete?: () => void
): Phaser.Sound.BaseSound | null {
    try {
        const sound = scene.sound.add(key, { volume });

        if (!sound) {
            Logger.error(`Failed to create sound: ${key}`);
            return null;
        }

        sound.on("complete", () => {
            if (onComplete) {
                onComplete();
            }
            sound.destroy();
        });

        sound.play();
        return sound;
    } catch (error) {
        Logger.error(`Error playing sound ${key}:`, error);
        return null;
    }
}

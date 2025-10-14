import Phaser from "phaser";

/**
 * Gestionnaire du timer de jeu
 */
export class TimerManager {
    private scene: Phaser.Scene;
    private timeRemaining: number; // En secondes
    private timerText?: Phaser.GameObjects.Text;
    private isActive: boolean = false;
    private onTimeUp?: () => void;

    constructor(scene: Phaser.Scene, duration: number = 120) {
        // 120 secondes = 2 minutes
        this.scene = scene;
        this.timeRemaining = duration;
    }

    /**
     * Initialise l'affichage du timer
     */
    initializeTimerDisplay(x: number = 20, y: number = 20): void {
        this.timerText = this.scene.add.text(
            x,
            y,
            this.formatTime(this.timeRemaining),
            {
                fontFamily: "Arial",
                fontSize: "32px",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 4,
            }
        );
        this.timerText.setScrollFactor(0);
        this.timerText.setDepth(2000);
    }

    /**
     * Démarre le timer
     */
    start(onTimeUpCallback?: () => void): void {
        this.isActive = true;
        this.onTimeUp = onTimeUpCallback;

        // Créer un événement qui se répète chaque seconde
        this.scene.time.addEvent({
            delay: 1000, // 1 seconde
            callback: this.tick,
            callbackScope: this,
            loop: true,
        });
    }

    /**
     * Appelé chaque seconde pour décrémenter le timer
     */
    private tick(): void {
        if (!this.isActive) return;

        this.timeRemaining--;

        // Mettre à jour l'affichage
        this.updateDisplay();

        // Changer la couleur quand il reste peu de temps
        if (this.timeRemaining <= 30 && this.timerText) {
            // Rouge pour les 30 dernières secondes
            this.timerText.setColor("#FF0000");

            // Effet de pulsation
            if (this.timeRemaining <= 10) {
                this.scene.tweens.add({
                    targets: this.timerText,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 200,
                    yoyo: true,
                    ease: "Cubic.easeInOut",
                });
            }
        } else if (this.timeRemaining <= 60 && this.timerText) {
            // Orange pour la dernière minute
            this.timerText.setColor("#FFA500");
        }

        // Temps écoulé
        if (this.timeRemaining <= 0) {
            this.stop();
            if (this.onTimeUp) {
                this.onTimeUp();
            }
        }
    }

    /**
     * Arrête le timer
     */
    stop(): void {
        this.isActive = false;
    }

    /**
     * Met à jour l'affichage du timer
     */
    private updateDisplay(): void {
        if (this.timerText) {
            this.timerText.setText(this.formatTime(this.timeRemaining));
        }
    }

    /**
     * Formate le temps en MM:SS
     */
    private formatTime(seconds: number): string {
        const minutes = Math.floor(Math.max(0, seconds) / 60);
        const secs = Math.max(0, seconds) % 60;
        return `⏱️ ${minutes.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    }

    /**
     * Retourne le temps restant en secondes
     */
    getTimeRemaining(): number {
        return this.timeRemaining;
    }

    /**
     * Retourne si le timer est actif
     */
    isTimerActive(): boolean {
        return this.isActive;
    }

    /**
     * Ajoute du temps au timer (bonus)
     */
    addTime(seconds: number): void {
        this.timeRemaining += seconds;
        this.updateDisplay();

        // Effet visuel pour le bonus de temps
        if (this.timerText) {
            const bonusText = this.scene.add.text(
                this.timerText.x + 150,
                this.timerText.y,
                `+${seconds}s`,
                {
                    fontFamily: "Arial",
                    fontSize: "24px",
                    color: "#00FF00",
                    stroke: "#000000",
                    strokeThickness: 3,
                }
            );
            bonusText.setScrollFactor(0);
            bonusText.setDepth(3000);

            this.scene.tweens.add({
                targets: bonusText,
                y: bonusText.y - 30,
                alpha: 0,
                duration: 1500,
                ease: "Cubic.easeOut",
                onComplete: () => bonusText.destroy(),
            });
        }
    }
}


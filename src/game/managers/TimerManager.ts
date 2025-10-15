import Phaser from "phaser";

/**
 * Gestionnaire du timer de jeu
 * Gère le compte à rebours et affiche le temps restant
 */
export class TimerManager {
    private scene: Phaser.Scene;
    private timerText?: Phaser.GameObjects.Text;
    private timeRemaining: number = 0; // En secondes
    private timerEvent?: Phaser.Time.TimerEvent;
    private isRunning: boolean = false;
    private onTimeUp?: () => void;
    private bonusTimePerDelivery: number = 0; // Bonus de temps par livraison (upgrade)

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * Initialise l'affichage du timer
     */
    public initializeTimerDisplay(x: number = 512, y: number = 20): void {
        this.timerText = this.scene.add.text(x, y, "⏱️ 5:00", {
            fontFamily: "Arial Black",
            fontSize: "32px",
            color: "#FFFFFF",
            stroke: "#000000",
            strokeThickness: 4,
        });
        this.timerText.setOrigin(0.5, 0);
        this.timerText.setScrollFactor(0);
        this.timerText.setDepth(2000);
    }

    /**
     * Démarre le timer
     */
    public start(durationInSeconds: number, onTimeUp?: () => void): void {
        this.timeRemaining = durationInSeconds;
        this.onTimeUp = onTimeUp;
        this.isRunning = true;

        // Créer un événement de timer qui se déclenche toutes les secondes
        this.timerEvent = this.scene.time.addEvent({
            delay: 1000, // 1 seconde
            callback: this.tick,
            callbackScope: this,
            loop: true,
        });

        this.updateTimerDisplay();
    }

    /**
     * Appelé chaque seconde
     */
    private tick(): void {
        if (!this.isRunning) return;

        this.timeRemaining--;
        this.updateTimerDisplay();

        // Changer la couleur quand il reste moins de 30 secondes
        if (this.timeRemaining <= 30 && this.timeRemaining > 10) {
            this.timerText?.setColor("#FFA500"); // Orange
        } else if (this.timeRemaining <= 10) {
            this.timerText?.setColor("#FF0000"); // Rouge

            // Animation de pulsation dans les 10 dernières secondes
            if (this.timerText) {
                this.scene.tweens.add({
                    targets: this.timerText,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 200,
                    yoyo: true,
                    ease: "Cubic.easeInOut",
                });
            }
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
     * Met à jour l'affichage du timer
     */
    private updateTimerDisplay(): void {
        if (!this.timerText) return;

        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

        this.timerText.setText(`⏱️ ${formattedTime}`);
    }

    /**
     * Arrête le timer
     */
    public stop(): void {
        this.isRunning = false;
        if (this.timerEvent) {
            this.timerEvent.remove();
            this.timerEvent = undefined;
        }
    }

    /**
     * Met le timer en pause
     */
    public pause(): void {
        this.isRunning = false;
    }

    /**
     * Reprend le timer
     */
    public resume(): void {
        this.isRunning = true;
    }

    /**
     * Ajoute du temps au timer
     */
    public addTime(seconds: number): void {
        this.timeRemaining += seconds;
        this.updateTimerDisplay();

        // Effet visuel pour montrer l'ajout de temps
        if (this.timerText) {
            // Créer un texte flottant
            const bonusText = this.scene.add.text(
                this.timerText.x,
                this.timerText.y + 40,
                `+${seconds}s`,
                {
                    fontFamily: "Arial",
                    fontSize: "24px",
                    color: "#00FF00",
                    stroke: "#000000",
                    strokeThickness: 3,
                }
            );
            bonusText.setOrigin(0.5);
            bonusText.setScrollFactor(0);
            bonusText.setDepth(3000);

            // Animation de montée et disparition
            this.scene.tweens.add({
                targets: bonusText,
                y: bonusText.y - 30,
                alpha: 0,
                duration: 1500,
                ease: "Cubic.easeOut",
                onComplete: () => bonusText.destroy(),
            });

            // Animation de pulsation du timer
            this.scene.tweens.add({
                targets: this.timerText,
                scaleX: 1.3,
                scaleY: 1.3,
                duration: 200,
                yoyo: true,
                ease: "Cubic.easeInOut",
            });
        }
    }

    // Getters
    public getTimeRemaining(): number {
        return this.timeRemaining;
    }

    public isTimerRunning(): boolean {
        return this.isRunning;
    }

    /**
     * Définit le bonus de temps par livraison (depuis les upgrades)
     */
    public setBonusTimePerDelivery(bonus: number): void {
        this.bonusTimePerDelivery = bonus;
    }

    /**
     * Ajoute le bonus de temps pour une livraison
     */
    public addDeliveryBonus(): void {
        if (this.bonusTimePerDelivery > 0 && this.isRunning) {
            this.addTime(this.bonusTimePerDelivery);
        }
    }
}


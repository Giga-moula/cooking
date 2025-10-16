import Phaser from "phaser";
import { CurrencyManager } from "../managers/CurrencyManager";
import {
    UpgradeManager,
    Upgrade,
    UpgradeType,
} from "../managers/UpgradeManager";

/**
 * Scène Shop - Apparaît entre les vagues
 */
export default class Shop extends Phaser.Scene {
    private currencyManager?: CurrencyManager;
    private upgradeManager?: UpgradeManager;
    private coinsEarned: number = 0;
    private waveNumber: number = 1;
    private onClose?: () => void;

    private upgradeButtons: Phaser.GameObjects.Container[] = [];

    constructor() {
        super("Shop");
    }

    init(data: {
        currencyManager: CurrencyManager;
        upgradeManager: UpgradeManager;
        coinsEarned: number;
        waveNumber: number;
        onClose: () => void;
    }) {
        this.currencyManager = data.currencyManager;
        this.upgradeManager = data.upgradeManager;
        this.coinsEarned = data.coinsEarned;
        this.waveNumber = data.waveNumber;
        this.onClose = data.onClose;
    }

    create() {
        // Fond semi-transparent
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.85);
        overlay.fillRect(0, 0, 1024, 768);
        overlay.setDepth(5000);
        overlay.setScrollFactor(0);

        // Calculer les dimensions dynamiques
        const { containerHeight, containerWidth } =
            this.calculateContainerSize();

        // Conteneur principal
        const container = this.add.container(512, 384);
        container.setDepth(5001);
        container.setScrollFactor(0);

        // Fond du shop avec dimensions adaptatives
        const shopBg = this.add.graphics();
        shopBg.fillStyle(0x2c3e50, 1);
        shopBg.fillRoundedRect(
            -containerWidth / 2,
            -containerHeight / 2,
            containerWidth,
            containerHeight,
            20
        );
        shopBg.lineStyle(6, 0xffd700, 1);
        shopBg.strokeRoundedRect(
            -containerWidth / 2,
            -containerHeight / 2,
            containerWidth,
            containerHeight,
            20
        );
        container.add(shopBg);

        // Titre
        const titleText = this.add.text(
            0,
            -containerHeight / 2 + 40,
            `🏪 BOUTIQUE - Vague ${this.waveNumber} Terminée !`,
            {
                fontFamily: "Arial Black",
                fontSize: "36px",
                color: "#FFD700",
                stroke: "#8B4513",
                strokeThickness: 6,
            }
        );
        titleText.setOrigin(0.5);
        container.add(titleText);

        // Affichage des gains
        const earningsText = this.add.text(
            0,
            -containerHeight / 2 + 80,
            `💰 Vous avez gagné ${this.coinsEarned} coins !`,
            {
                fontFamily: "Arial",
                fontSize: "24px",
                color: "#00FF00",
                stroke: "#004400",
                strokeThickness: 3,
            }
        );
        earningsText.setOrigin(0.5);
        container.add(earningsText);

        // Solde actuel
        const balanceText = this.add.text(
            0,
            -containerHeight / 2 + 110,
            `Solde: ${this.currencyManager?.getTotalCoins() || 0} coins`,
            {
                fontFamily: "Arial Black",
                fontSize: "20px",
                color: "#FFFFFF",
            }
        );
        balanceText.setOrigin(0.5);
        container.add(balanceText);

        // Afficher les upgrades
        this.displayUpgrades(container);

        // Bouton continuer
        this.createContinueButton(container, containerHeight);
    }

    /**
     * Affiche tous les upgrades disponibles
     */
    private displayUpgrades(container: Phaser.GameObjects.Container): void {
        if (!this.upgradeManager) return;

        const upgrades = this.upgradeManager.getAllUpgrades();
        const upgradesPerRow = 3;
        const cardWidth = 250;
        const cardHeight = 220;
        const spacingX = 260;
        const spacingY = 230;

        // Calculer le nombre de rangées nécessaires
        const totalRows = Math.ceil(upgrades.length / upgradesPerRow);

        // Centrer horizontalement et verticalement
        const totalWidth = (upgradesPerRow - 1) * spacingX;
        const totalHeight = (totalRows - 1) * spacingY;
        const startX = -totalWidth / 2;
        const startY = -totalHeight / 2 + 30; // Position ajustée pour plus d'espace avec les textes du haut

        upgrades.forEach((upgrade, index) => {
            const row = Math.floor(index / upgradesPerRow);
            const col = index % upgradesPerRow;
            const x = startX + col * spacingX;
            const y = startY + row * spacingY;

            this.createUpgradeCard(
                container,
                upgrade,
                x,
                y,
                cardWidth,
                cardHeight
            );
        });
    }

    /**
     * Crée une carte d'upgrade
     */
    private createUpgradeCard(
        parentContainer: Phaser.GameObjects.Container,
        upgrade: Upgrade,
        x: number,
        y: number,
        width: number,
        height: number
    ): void {
        const cardContainer = this.add.container(x, y);
        parentContainer.add(cardContainer);

        const canAfford =
            this.currencyManager?.canAfford(upgrade.cost) || false;
        const canPurchase =
            this.upgradeManager?.canPurchase(upgrade.id) || false;
        const isMaxed = upgrade.currentLevel >= upgrade.maxLevel;

        // Fond de la carte
        const cardBg = this.add.graphics();
        if (isMaxed) {
            cardBg.fillStyle(0x27ae60, 0.3); // Vert si acheté
        } else if (canAfford && canPurchase) {
            cardBg.fillStyle(0x34495e, 1);
        } else {
            cardBg.fillStyle(0x7f8c8d, 0.5); // Grisé si pas assez de coins
        }
        cardBg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
        cardBg.lineStyle(3, canAfford && canPurchase ? 0xffd700 : 0x95a5a6, 1);
        cardBg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
        cardContainer.add(cardBg);

        // Icône
        const icon = this.add.text(0, -60, upgrade.icon, {
            fontSize: "48px",
        });
        icon.setOrigin(0.5);
        cardContainer.add(icon);

        // Nom
        const nameText = this.add.text(0, -10, upgrade.name, {
            fontFamily: "Arial Black",
            fontSize: "16px",
            color: isMaxed ? "#27ae60" : "#FFFFFF",
            align: "center",
            wordWrap: { width: width - 20 },
        });
        nameText.setOrigin(0.5);
        cardContainer.add(nameText);

        // Description
        const descText = this.add.text(0, 20, upgrade.description, {
            fontFamily: "Arial",
            fontSize: "12px",
            color: "#CCCCCC",
            align: "center",
            wordWrap: { width: width - 20 },
        });
        descText.setOrigin(0.5);
        cardContainer.add(descText);

        // Niveau actuel
        if (upgrade.maxLevel > 1) {
            const levelText = this.add.text(
                0,
                50,
                `Niveau ${upgrade.currentLevel}/${upgrade.maxLevel}`,
                {
                    fontFamily: "Arial",
                    fontSize: "12px",
                    color: "#FFD700",
                }
            );
            levelText.setOrigin(0.5);
            cardContainer.add(levelText);
        }

        // Bouton acheter ou status
        if (isMaxed) {
            const maxedText = this.add.text(0, 75, "✅ ACHETÉ", {
                fontFamily: "Arial Black",
                fontSize: "14px",
                color: "#27ae60",
            });
            maxedText.setOrigin(0.5);
            cardContainer.add(maxedText);
        } else {
            const buyButton = this.createBuyButton(
                upgrade,
                canAfford && canPurchase
            );
            buyButton.setPosition(0, 75);
            cardContainer.add(buyButton);
        }

        this.upgradeButtons.push(cardContainer);
    }

    /**
     * Crée un bouton d'achat
     */
    private createBuyButton(
        upgrade: Upgrade,
        enabled: boolean
    ): Phaser.GameObjects.Container {
        const buttonContainer = this.add.container(0, 0);

        // Fond du bouton
        const buttonBg = this.add.graphics();
        if (enabled) {
            buttonBg.fillStyle(0x27ae60, 1);
        } else {
            buttonBg.fillStyle(0x7f8c8d, 0.5);
        }
        buttonBg.fillRoundedRect(-60, -15, 120, 30, 5);
        buttonContainer.add(buttonBg);

        // Texte du prix
        const priceText = this.add.text(0, 0, `${upgrade.cost} 💰`, {
            fontFamily: "Arial Black",
            fontSize: "14px",
            color: enabled ? "#FFFFFF" : "#999999",
        });
        priceText.setOrigin(0.5);
        buttonContainer.add(priceText);

        if (enabled) {
            buttonContainer.setSize(120, 30);
            buttonContainer.setInteractive({ useHandCursor: true });

            buttonContainer.on("pointerover", () => {
                buttonBg.clear();
                buttonBg.fillStyle(0x2ecc71, 1);
                buttonBg.fillRoundedRect(-60, -15, 120, 30, 5);
            });

            buttonContainer.on("pointerout", () => {
                buttonBg.clear();
                buttonBg.fillStyle(0x27ae60, 1);
                buttonBg.fillRoundedRect(-60, -15, 120, 30, 5);
            });

            buttonContainer.on("pointerdown", () => {
                this.purchaseUpgrade(upgrade);
            });
        }

        return buttonContainer;
    }

    /**
     * Achète un upgrade
     */
    private purchaseUpgrade(upgrade: Upgrade): void {
        if (!this.currencyManager || !this.upgradeManager) return;

        if (this.currencyManager.spendCoins(upgrade.cost)) {
            this.upgradeManager.purchaseUpgrade(upgrade.id);

            // Rafraîchir l'affichage
            this.scene.restart({
                currencyManager: this.currencyManager,
                upgradeManager: this.upgradeManager,
                coinsEarned: 0,
                waveNumber: this.waveNumber,
                onClose: this.onClose,
            });
        }
    }

    /**
     * Crée le bouton continuer
     */
    private createContinueButton(
        container: Phaser.GameObjects.Container,
        containerHeight: number
    ): void {
        const buttonContainer = this.add.container(0, containerHeight / 2 - 40);
        container.add(buttonContainer);

        // Fond du bouton
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0xffd700, 1);
        buttonBg.fillRoundedRect(-120, -25, 240, 50, 10);
        buttonBg.lineStyle(4, 0x8b4513, 1);
        buttonBg.strokeRoundedRect(-120, -25, 240, 50, 10);
        buttonContainer.add(buttonBg);

        // Texte
        const buttonText = this.add.text(0, 0, "CONTINUER ➜", {
            fontFamily: "Arial Black",
            fontSize: "24px",
            color: "#8B4513",
        });
        buttonText.setOrigin(0.5);
        buttonContainer.add(buttonText);

        // Interactivité
        buttonContainer.setSize(240, 50);
        buttonContainer.setInteractive({ useHandCursor: true });

        buttonContainer.on("pointerover", () => {
            this.tweens.add({
                targets: buttonContainer,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 100,
            });
        });

        buttonContainer.on("pointerout", () => {
            this.tweens.add({
                targets: buttonContainer,
                scaleX: 1,
                scaleY: 1,
                duration: 100,
            });
        });

        buttonContainer.on("pointerdown", () => {
            this.closeShop();
        });
    }

    /**
     * Calcule la taille du container en fonction du contenu
     */
    private calculateContainerSize(): {
        containerWidth: number;
        containerHeight: number;
    } {
        if (!this.upgradeManager) {
            return { containerWidth: 900, containerHeight: 640 };
        }

        const upgrades = this.upgradeManager.getAllUpgrades();
        const upgradesPerRow = 3;
        const cardWidth = 250;
        const cardHeight = 220;
        const spacingX = 260;
        const spacingY = 230;

        // Calculer le nombre de rangées
        const totalRows = Math.ceil(upgrades.length / upgradesPerRow);

        // Calculer les dimensions du contenu
        const upgradesWidth =
            Math.min(upgrades.length, upgradesPerRow) * cardWidth +
            (Math.min(upgrades.length, upgradesPerRow) - 1) *
                (spacingX - cardWidth);
        const upgradesHeight =
            totalRows * cardHeight + (totalRows - 1) * (spacingY - cardHeight);

        // Marges et espaces pour les autres éléments
        const topMargin = 180; // Espace pour titre, gains, solde (augmenté)
        const bottomMargin = 80; // Espace pour le bouton continuer
        const sideMargin = 60; // Marges latérales

        const containerWidth = Math.max(600, upgradesWidth + sideMargin * 2);
        const containerHeight = topMargin + upgradesHeight + bottomMargin;

        return { containerWidth, containerHeight };
    }

    /**
     * Ferme le shop et continue le jeu
     */
    private closeShop(): void {
        // Appeler le callback pour reprendre le jeu
        if (this.onClose) {
            this.onClose();
        }

        // Fermer la scène
        this.scene.stop("Shop");
    }
}

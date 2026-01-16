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
    private continueButton?: Phaser.GameObjects.Container;
    
    // Navigation au clavier
    private selectedIndex: number = 0; // -1 pour le bouton continuer, 0+ pour les upgrades
    private selectionIndicator?: Phaser.GameObjects.Graphics;
    private upgradesPerRow: number = 3;

    // Keyboard keys for cleanup
    private keyZ?: Phaser.Input.Keyboard.Key;
    private keyQ?: Phaser.Input.Keyboard.Key;
    private keyS?: Phaser.Input.Keyboard.Key;
    private keyD?: Phaser.Input.Keyboard.Key;
    private keyE?: Phaser.Input.Keyboard.Key;
    private keyZHandler?: () => void;
    private keyQHandler?: () => void;
    private keySHandler?: () => void;
    private keyDHandler?: () => void;
    private keyEHandler?: () => void;

    constructor() {
        super("Shop");
    }

    init(data: {
        currencyManager: CurrencyManager;
        upgradeManager: UpgradeManager;
        coinsEarned: number;
        waveNumber: number;
        onClose: () => void;
        selectedIndex?: number;
    }) {
        this.currencyManager = data.currencyManager;
        this.upgradeManager = data.upgradeManager;
        this.coinsEarned = data.coinsEarned;
        this.waveNumber = data.waveNumber;
        this.onClose = data.onClose;
        // Restaurer la sélection précédente si elle existe
        if (data.selectedIndex !== undefined) {
            this.selectedIndex = data.selectedIndex;
        }
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

        // Créer l'indicateur de sélection
        this.selectionIndicator = this.add.graphics();
        this.selectionIndicator.setDepth(5002);
        this.selectionIndicator.setScrollFactor(0);
        container.add(this.selectionIndicator);

        // Initialiser la sélection sur le premier upgrade (si pas déjà défini dans init)
        // selectedIndex est déjà défini si on vient d'un restart après achat
        this.updateSelectionIndicator();

        // Configurer les contrôles clavier
        this.setupKeyboardControls();
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

            // Rafraîchir l'affichage en gardant la sélection actuelle
            this.scene.restart({
                currencyManager: this.currencyManager,
                upgradeManager: this.upgradeManager,
                coinsEarned: 0,
                waveNumber: this.waveNumber,
                onClose: this.onClose,
                selectedIndex: this.selectedIndex,
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
        this.continueButton = buttonContainer;
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

    /**
     * Configure les contrôles clavier pour la navigation
     */
    private setupKeyboardControls(): void {
        // Touches de navigation
        this.keyZ = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.keyQ = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        this.keyS = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyE = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        // Store handlers for cleanup
        this.keyZHandler = () => this.moveSelection(0, -1);
        this.keySHandler = () => this.moveSelection(0, 1);
        this.keyQHandler = () => this.moveSelection(-1, 0);
        this.keyDHandler = () => this.moveSelection(1, 0);
        this.keyEHandler = () => this.selectCurrentItem();

        // Haut (Z)
        this.keyZ?.on('down', this.keyZHandler);

        // Bas (S)
        this.keyS?.on('down', this.keySHandler);

        // Gauche (Q)
        this.keyQ?.on('down', this.keyQHandler);

        // Droite (D)
        this.keyD?.on('down', this.keyDHandler);

        // Sélection (E)
        this.keyE?.on('down', this.keyEHandler);
    }

    /**
     * Déplace la sélection dans la direction donnée
     */
    private moveSelection(dx: number, dy: number): void {
        const totalUpgrades = this.upgradeButtons.length;
        
        // Si on est sur le bouton continuer
        if (this.selectedIndex === -1) {
            if (dy < 0) {
                // Monter vers la dernière ligne d'upgrades
                const lastRow = Math.floor((totalUpgrades - 1) / this.upgradesPerRow);
                const lastCol = (totalUpgrades - 1) % this.upgradesPerRow;
                this.selectedIndex = lastRow * this.upgradesPerRow + Math.min(lastCol, this.upgradesPerRow - 1);
                this.updateSelectionIndicator();
            }
            return;
        }

        // Calculer la position actuelle dans la grille
        const currentRow = Math.floor(this.selectedIndex / this.upgradesPerRow);
        const currentCol = this.selectedIndex % this.upgradesPerRow;

        // Calculer la nouvelle position
        let newRow = currentRow + dy;
        let newCol = currentCol + dx;

        // Gérer les déplacements horizontaux
        if (dx !== 0) {
            // Limiter les colonnes
            if (newCol < 0) newCol = 0;
            if (newCol >= this.upgradesPerRow) newCol = this.upgradesPerRow - 1;
        }

        // Calculer le nouvel index
        let newIndex = newRow * this.upgradesPerRow + newCol;

        // Si on monte au-dessus de la première rangée, ne rien faire
        if (newRow < 0) {
            return;
        }

        // Si on descend en dessous de la dernière rangée, aller au bouton continuer
        const lastRow = Math.floor((totalUpgrades - 1) / this.upgradesPerRow);
        if (newRow > lastRow) {
            this.selectedIndex = -1;
            this.updateSelectionIndicator();
            return;
        }

        // Vérifier que le nouvel index est valide
        if (newIndex >= 0 && newIndex < totalUpgrades) {
            this.selectedIndex = newIndex;
            this.updateSelectionIndicator();
        }
    }

    /**
     * Sélectionne l'élément actuellement en surbrillance
     */
    private selectCurrentItem(): void {
        if (this.selectedIndex === -1) {
            // Fermer le shop
            this.closeShop();
        } else if (this.selectedIndex >= 0 && this.selectedIndex < this.upgradeButtons.length) {
            // Acheter l'upgrade sélectionné
            const upgrade = this.upgradeManager?.getAllUpgrades()[this.selectedIndex];
            if (upgrade) {
                const canAfford = this.currencyManager?.canAfford(upgrade.cost) || false;
                const canPurchase = this.upgradeManager?.canPurchase(upgrade.id) || false;
                const isMaxed = upgrade.currentLevel >= upgrade.maxLevel;

                if (!isMaxed && canAfford && canPurchase) {
                    this.purchaseUpgrade(upgrade);
                }
            }
        }
    }

    /**
     * Met à jour l'indicateur visuel de sélection
     */
    private updateSelectionIndicator(): void {
        if (!this.selectionIndicator) return;

        this.selectionIndicator.clear();

        if (this.selectedIndex === -1) {
            // Sélection sur le bouton continuer
            if (this.continueButton) {
                this.selectionIndicator.lineStyle(4, 0x00ffff, 1);
                this.selectionIndicator.strokeRoundedRect(
                    this.continueButton.x - 125,
                    this.continueButton.y - 30,
                    250,
                    60,
                    10
                );
            }
        } else if (this.selectedIndex >= 0 && this.selectedIndex < this.upgradeButtons.length) {
            // Sélection sur un upgrade
            const selectedButton = this.upgradeButtons[this.selectedIndex];
            if (selectedButton) {
                this.selectionIndicator.lineStyle(4, 0x00ffff, 1);
                this.selectionIndicator.strokeRoundedRect(
                    selectedButton.x - 130,
                    selectedButton.y - 115,
                    260,
                    230,
                    10
                );
            }
        }
    }

    /**
     * Cleanup keyboard listeners when scene shuts down
     */
    shutdown(): void {
        if (this.keyZ && this.keyZHandler) {
            this.keyZ.off('down', this.keyZHandler);
        }
        if (this.keyS && this.keySHandler) {
            this.keyS.off('down', this.keySHandler);
        }
        if (this.keyQ && this.keyQHandler) {
            this.keyQ.off('down', this.keyQHandler);
        }
        if (this.keyD && this.keyDHandler) {
            this.keyD.off('down', this.keyDHandler);
        }
        if (this.keyE && this.keyEHandler) {
            this.keyE.off('down', this.keyEHandler);
        }
    }
}


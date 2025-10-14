/*
 * FICHIER D'EXEMPLE - Intégration du système d'ingrédients
 * Copiez les parties dont vous avez besoin dans votre Game.ts
 */

import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { IngredientInteractionManager } from "../managers/IngredientInteractionManager";
import { IsometricMap } from "../utils/IsometricUtils";

export default class GameExample extends Phaser.Scene {
    // ... vos propriétés existantes ...
    private isoMap?: IsometricMap;
    private player?: Phaser.Physics.Arcade.Sprite;
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

    // NOUVEAU : Gestionnaire d'ingrédients
    private ingredientManager?: IngredientInteractionManager;

    constructor() {
        super("GameExample");
    }

    create() {
        // Fond de couleur
        this.cameras.main.setBackgroundColor(0x87ceeb); // Bleu ciel

        // ========================================
        // NOUVEAU : Initialiser le système d'ingrédients
        // ========================================
        this.ingredientManager = new IngredientInteractionManager(this);
        this.ingredientManager.enableDragAndDrop();

        // Créer quelques ingrédients de test sur des plans de travail
        // (Remplacez ces positions par les positions réelles de vos plans de travail)
        this.createTestIngredients();

        // Afficher les recettes disponibles en console
        this.displayAvailableRecipes();

        EventBus.emit("current-scene-ready", this);
    }

    /**
     * NOUVEAU : Crée des ingrédients de test
     * À remplacer par votre logique de spawn sur les plans de travail
     */
    private createTestIngredients() {
        if (!this.ingredientManager) return;

        // Recette 1 : Beurre + Farine = Pâte
        const butter = this.ingredientManager.createIngredient(
            150,
            300,
            "butter"
        );
        const flour = this.ingredientManager.createIngredient(
            350,
            300,
            "flour"
        );

        // Recette 2 : Chocolat (pour plus tard)
        const chocolate = this.ingredientManager.createIngredient(
            550,
            300,
            "chocolate"
        );

        // Texte d'aide avec les recettes
        const helpText = this.add.text(
            512,
            100,
            "🧈 Beurre + 🌾 Farine = 🥖 Pâte\n" +
                "🍫 Chocolat + 🥖 Pâte = 🍪 Cookie\n\n" +
                "Glisse les ingrédients pour les combiner !",
            {
                fontFamily: "Arial",
                fontSize: "18px",
                color: "#ffffff",
                backgroundColor: "#000000",
                padding: { x: 15, y: 10 },
                align: "center",
            }
        );
        helpText.setOrigin(0.5);
        helpText.setScrollFactor(0);
        helpText.setDepth(1000);

        // Légendes sous les ingrédients
        this.add
            .text(150, 370, "Beurre", {
                fontSize: "14px",
                color: "#ffffff",
                backgroundColor: "#000000",
                padding: { x: 5, y: 3 },
            })
            .setOrigin(0.5);

        this.add
            .text(350, 370, "Farine", {
                fontSize: "14px",
                color: "#ffffff",
                backgroundColor: "#000000",
                padding: { x: 5, y: 3 },
            })
            .setOrigin(0.5);

        this.add
            .text(550, 370, "Chocolat", {
                fontSize: "14px",
                color: "#ffffff",
                backgroundColor: "#000000",
                padding: { x: 5, y: 3 },
            })
            .setOrigin(0.5);
    }

    /**
     * NOUVEAU : Affiche les recettes disponibles en console
     * Utile pour le debug
     */
    private displayAvailableRecipes() {
        if (!this.ingredientManager) return;

        const recipes = this.ingredientManager
            .getRecipeManager()
            .getAllRecipes();
        console.log("📖 Recettes disponibles :");
        recipes.forEach((recipe) => {
            console.log(
                `  - ${recipe.name}: ${recipe.ingredients[0]} + ${recipe.ingredients[1]} = ${recipe.result}`
            );
        });
    }

    /**
     * EXEMPLE : Méthode pour spawner un ingrédient sur un plan de travail
     * Appelez cette méthode depuis votre système de plans de travail
     */
    public spawnIngredientOnWorkbench(
        workbenchX: number,
        workbenchY: number,
        ingredientId: string
    ) {
        if (!this.ingredientManager) return;

        this.ingredientManager.createIngredient(
            workbenchX,
            workbenchY,
            ingredientId
        );
    }

    /**
     * EXEMPLE : Récupérer tous les ingrédients présents
     * Utile si vous voulez sauvegarder l'état du jeu
     */
    public getCurrentIngredients() {
        if (!this.ingredientManager) return [];

        return this.ingredientManager.getIngredients().map((sprite) => ({
            id: sprite.ingredientId,
            x: sprite.x,
            y: sprite.y,
        }));
    }

    update(time: number, delta: number) {
        // ... votre code d'update existant ...
    }

    /**
     * Nettoyage quand on quitte la scène
     */
    shutdown() {
        // Nettoyer les ingrédients
        if (this.ingredientManager) {
            this.ingredientManager.cleanup();
        }
    }
}


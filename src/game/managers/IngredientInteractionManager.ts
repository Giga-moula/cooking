/**
 * Gestionnaire d'interactions entre ingrédients
 * Ce manager gère la logique de drag & drop et de fusion des ingrédients
 */

import { IngredientSprite } from "../types/Ingredient";
import { RecipeManager } from "./RecipeManager";

export class IngredientInteractionManager {
    private scene: Phaser.Scene;
    private recipeManager: RecipeManager;
    private draggedIngredient: IngredientSprite | null = null;
    private ingredients: IngredientSprite[] = [];

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.recipeManager = new RecipeManager();
    }

    /**
     * Crée un sprite d'ingrédient à une position donnée
     * @param x Position X
     * @param y Position Y
     * @param ingredientId ID de l'ingrédient
     * @returns Le sprite créé
     */
    public createIngredient(
        x: number,
        y: number,
        ingredientId: string
    ): IngredientSprite | null {
        const ingredientData = this.recipeManager.getIngredient(ingredientId);

        if (!ingredientData) {
            console.error(`Ingrédient ${ingredientId} introuvable`);
            return null;
        }

        // Créer le sprite avec physique
        const sprite = this.scene.physics.add.sprite(
            x,
            y,
            ingredientData.texture
        ) as IngredientSprite;
        sprite.ingredientId = ingredientId;

        // Rendre l'ingrédient interactif
        sprite.setInteractive({ draggable: true });

        // Ajouter à la liste
        this.ingredients.push(sprite);

        return sprite;
    }

    /**
     * Active le système de drag & drop pour les ingrédients
     */
    public enableDragAndDrop(): void {
        // Événement quand on commence à glisser
        this.scene.input.on(
            "dragstart",
            (pointer: Phaser.Input.Pointer, gameObject: IngredientSprite) => {
                this.draggedIngredient = gameObject;
                gameObject.setTint(0xffff00); // Surbrillance jaune
                gameObject.setDepth(1000); // Mettre au premier plan
            }
        );

        // Événement pendant le glissement
        this.scene.input.on(
            "drag",
            (
                pointer: Phaser.Input.Pointer,
                gameObject: IngredientSprite,
                dragX: number,
                dragY: number
            ) => {
                gameObject.x = dragX;
                gameObject.y = dragY;
            }
        );

        // Événement quand on lâche l'ingrédient
        this.scene.input.on(
            "dragend",
            (pointer: Phaser.Input.Pointer, gameObject: IngredientSprite) => {
                gameObject.clearTint();
                gameObject.setDepth(0);

                // Vérifier s'il y a collision avec un autre ingrédient
                this.checkIngredientCombination(gameObject);

                this.draggedIngredient = null;
            }
        );
    }

    /**
     * Vérifie si un ingrédient peut être combiné avec un autre à proximité
     * @param ingredient L'ingrédient qui a été déposé
     */
    private checkIngredientCombination(ingredient: IngredientSprite): void {
        // Distance maximale pour considérer une combinaison (en pixels)
        const COMBINE_DISTANCE = 80;

        // Chercher un autre ingrédient proche
        for (const otherIngredient of this.ingredients) {
            if (otherIngredient === ingredient) continue;

            const distance = Phaser.Math.Distance.Between(
                ingredient.x,
                ingredient.y,
                otherIngredient.x,
                otherIngredient.y
            );

            if (distance < COMBINE_DISTANCE) {
                // Tentative de combinaison
                this.attemptCombination(ingredient, otherIngredient);
                return; // Une seule combinaison à la fois
            }
        }
    }

    /**
     * Tente de combiner deux ingrédients
     * @param ingredient1 Premier ingrédient
     * @param ingredient2 Deuxième ingrédient
     */
    private attemptCombination(
        ingredient1: IngredientSprite,
        ingredient2: IngredientSprite
    ): void {
        const resultId = this.recipeManager.combineIngredients(
            ingredient1.ingredientId,
            ingredient2.ingredientId
        );

        if (resultId) {
            // Combinaison réussie !
            this.onCombinationSuccess(ingredient1, ingredient2, resultId);
        } else {
            // Pas de recette trouvée
            this.onCombinationFailed(ingredient1, ingredient2);
        }
    }

    /**
     * Appelé quand une combinaison réussit
     */
    private onCombinationSuccess(
        ingredient1: IngredientSprite,
        ingredient2: IngredientSprite,
        resultId: string
    ): void {
        // Position au milieu des deux ingrédients
        const x = (ingredient1.x + ingredient2.x) / 2;
        const y = (ingredient1.y + ingredient2.y) / 2;

        // Effet visuel de fusion
        this.playFusionEffect(x, y);

        // Supprimer les deux ingrédients
        this.removeIngredient(ingredient1);
        this.removeIngredient(ingredient2);

        // Créer le nouvel ingrédient
        const newIngredient = this.createIngredient(x, y, resultId);

        if (newIngredient) {
            // Animation d'apparition
            newIngredient.setScale(0);
            this.scene.tweens.add({
                targets: newIngredient,
                scale: 1,
                duration: 300,
                ease: "Back.easeOut",
            });
        }

        // Afficher un message de succès
        const ingredient = this.recipeManager.getIngredient(resultId);
        if (ingredient) {
            this.showMessage(`✨ ${ingredient.name} créé !`, x, y - 50);
        }
    }

    /**
     * Appelé quand une combinaison échoue
     */
    private onCombinationFailed(
        ingredient1: IngredientSprite,
        ingredient2: IngredientSprite
    ): void {
        // Faire rebondir les ingrédients
        const angle = Phaser.Math.Angle.Between(
            ingredient1.x,
            ingredient1.y,
            ingredient2.x,
            ingredient2.y
        );

        this.scene.tweens.add({
            targets: ingredient1,
            x: ingredient1.x - Math.cos(angle) * 20,
            y: ingredient1.y - Math.sin(angle) * 20,
            duration: 100,
            yoyo: true,
        });

        this.scene.tweens.add({
            targets: ingredient2,
            x: ingredient2.x + Math.cos(angle) * 20,
            y: ingredient2.y + Math.sin(angle) * 20,
            duration: 100,
            yoyo: true,
        });

        // Message d'échec
        const x = (ingredient1.x + ingredient2.x) / 2;
        const y = (ingredient1.y + ingredient2.y) / 2;
        this.showMessage("❌ Pas de recette", x, y - 50);
    }

    /**
     * Effet visuel de fusion
     */
    private playFusionEffect(x: number, y: number): void {
        // Créer des particules scintillantes
        const particles = this.scene.add.particles(x, y, "star", {
            speed: { min: -100, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            lifespan: 600,
            quantity: 15,
            blendMode: "ADD",
        });

        // Détruire l'émetteur après l'animation
        this.scene.time.delayedCall(600, () => {
            particles.destroy();
        });
    }

    /**
     * Affiche un message temporaire
     */
    private showMessage(text: string, x: number, y: number): void {
        const message = this.scene.add.text(x, y, text, {
            fontFamily: "Arial",
            fontSize: "24px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4,
        });
        message.setOrigin(0.5);

        // Animation de montée et disparition
        this.scene.tweens.add({
            targets: message,
            y: y - 30,
            alpha: 0,
            duration: 1000,
            ease: "Cubic.easeOut",
            onComplete: () => message.destroy(),
        });
    }

    /**
     * Retire un ingrédient du jeu
     */
    private removeIngredient(ingredient: IngredientSprite): void {
        const index = this.ingredients.indexOf(ingredient);
        if (index > -1) {
            this.ingredients.splice(index, 1);
        }
        ingredient.destroy();
    }

    /**
     * Récupère tous les ingrédients actifs
     */
    public getIngredients(): IngredientSprite[] {
        return [...this.ingredients];
    }

    /**
     * Récupère le gestionnaire de recettes
     */
    public getRecipeManager(): RecipeManager {
        return this.recipeManager;
    }

    /**
     * Nettoie tous les ingrédients
     */
    public cleanup(): void {
        this.ingredients.forEach((ingredient) => ingredient.destroy());
        this.ingredients = [];
        this.draggedIngredient = null;
    }
}


/**
 * EXEMPLE DE TEST pour le RecipeManager
 * Ce fichier montre comment tester le système de recettes
 * Vous pouvez le copier et l'adapter pour vos propres tests
 */

import { RecipeManager } from "./RecipeManager";

export function testRecipeManager() {
    console.log("🧪 Tests du RecipeManager\n");

    const manager = new RecipeManager();

    // Test 1 : Trouver une recette valide
    console.log("Test 1 : Cookie + Star");
    const recipe1 = manager.findRecipe("cookie", "star");
    if (recipe1) {
        console.log(`  ✅ Recette trouvée : ${recipe1.name}`);
        console.log(`  ✅ Résultat : ${recipe1.result}`);
    } else {
        console.log("  ❌ Recette non trouvée");
    }

    // Test 2 : L'ordre ne devrait pas avoir d'importance
    console.log("\nTest 2 : Star + Cookie (ordre inversé)");
    const recipe2 = manager.findRecipe("star", "cookie");
    if (recipe2) {
        console.log(`  ✅ Recette trouvée : ${recipe2.name}`);
    } else {
        console.log("  ❌ Recette non trouvée");
    }

    // Test 3 : Combinaison invalide
    console.log("\nTest 3 : Cookie + Cookie (invalide)");
    const recipe3 = manager.findRecipe("cookie", "cookie");
    if (recipe3) {
        console.log(
            `  ❌ Recette trouvée alors qu'elle ne devrait pas exister`
        );
    } else {
        console.log("  ✅ Aucune recette (comportement attendu)");
    }

    // Test 4 : Combiner des ingrédients
    console.log("\nTest 4 : Combinaison Cookie + Star");
    const result = manager.combineIngredients("cookie", "star");
    if (result === "favicon") {
        console.log(`  ✅ Résultat correct : ${result}`);
    } else {
        console.log(`  ❌ Résultat incorrect : ${result}`);
    }

    // Test 5 : Récupérer un ingrédient
    console.log('\nTest 5 : Récupérer l\'ingrédient "favicon"');
    const favicon = manager.getIngredient("favicon");
    if (favicon) {
        console.log(`  ✅ Ingrédient trouvé : ${favicon.name}`);
        console.log(`  ✅ Type : ${favicon.type}`);
    } else {
        console.log("  ❌ Ingrédient non trouvé");
    }

    // Test 6 : Ajouter une recette dynamiquement
    console.log("\nTest 6 : Ajouter une nouvelle recette");
    manager.addRecipe({
        name: "Test Recette",
        ingredients: ["cookie", "favicon"],
        result: "super_cookie",
    });
    const newRecipe = manager.findRecipe("cookie", "favicon");
    if (newRecipe) {
        console.log(`  ✅ Nouvelle recette ajoutée : ${newRecipe.name}`);
    } else {
        console.log("  ❌ Échec de l'ajout de la recette");
    }

    // Test 7 : Lister toutes les recettes
    console.log("\nTest 7 : Lister toutes les recettes");
    const allRecipes = manager.getAllRecipes();
    console.log(`  ✅ Nombre de recettes : ${allRecipes.length}`);
    allRecipes.forEach((recipe, index) => {
        console.log(
            `     ${index + 1}. ${recipe.name}: ${recipe.ingredients[0]} + ${
                recipe.ingredients[1]
            } = ${recipe.result}`
        );
    });

    console.log("\n✅ Tous les tests terminés !\n");
}

// Pour exécuter les tests, appelez cette fonction dans votre scène :
// testRecipeManager();


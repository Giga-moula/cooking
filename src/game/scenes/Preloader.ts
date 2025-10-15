// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Preloader extends Phaser.Scene {
    constructor() {
        super("Preloader");

        /* START-USER-CTR-CODE */
        // Write your code here.
        /* END-USER-CTR-CODE */
    }

    editorCreate(): void {
        // background
        this.add.image(512, 384, "background");

        // progressBar
        const progressBar = this.add.rectangle(512, 384, 468, 32);
        progressBar.isFilled = true;
        progressBar.fillColor = 14737632;
        progressBar.isStroked = true;

        this.progressBar = progressBar;

        this.events.emit("scene-awake");
    }

    private progressBar!: Phaser.GameObjects.Rectangle;

    /* START-USER-CODE */

    // Write your code here
    init() {
        this.editorCreate();

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(
            this.progressBar.x - this.progressBar.width / 2 + 4,
            this.progressBar.y,
            4,
            28,
            0xffffff
        );

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on("progress", (progress: number) => {
            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + 460 * progress;
        });
    }

    preload() {
        // Use the 'pack' file to load in any assets you need for this scene
        this.load.pack("preload", "assets/preload-asset-pack.json");

        // Charger les ingrédients
        this.load.image("butter", "assets/ingredients/butter.png");
        this.load.image("chocolate", "assets/ingredients/chocolate.png");
        this.load.image("flour", "assets/ingredients/flour.png");
        this.load.image("sugar", "assets/ingredients/sugar.png");

        //Charger les objets mélangers
        this.load.image("caramel", "assets/crafted/caramel.png");
        this.load.image(
            "chocolate-chunks",
            "assets/crafted/chocolate-chunks.png"
        );
        this.load.image(
            "cookie-mix-cara",
            "assets/crafted/cookie-mix-cara.png"
        );
        this.load.image(
            "cookie-mix-choco-cara",
            "assets/crafted/cookie-mix-choco-cara.png"
        );
        this.load.image(
            "cookie-mix-choco",
            "assets/crafted/cookie-mix-choco.png"
        );
        this.load.image("dough", "assets/crafted/dough.png");
        this.load.image("molten_butter", "assets/crafted/molten_butter.png");

        //Charger les cookies
        this.load.image("cookie", "assets/meal/cookie.png");
        this.load.image("cookie-cara", "assets/meal/cookie-cara.png");
        this.load.image("cookie-choco", "assets/meal/cookie-choco.png");
        this.load.image(
            "cookie-choco-cara",
            "assets/meal/cookie-choco-cara.png"
        );
        this.load.image("cookie-dead", "assets/meal/cookie-dead.png");

        // Charger les objets du jeu
        this.load.image("oven", "assets/oven.png");
        this.load.image("craft_plan", "assets/craft_plan.png");

        // Charger les caisses d'ingrédients pour la récupération
        this.load.image("butter_box", "assets/butter_box.png");
        this.load.image("flour_box", "assets/flour_box.png");
        this.load.image("choco_box", "assets/choco_box.png");

        // Charger les sprites de grand-mère
        this.load.image(
            "blue-grandma-front",
            "assets/grandma/blue/grandma_blue_front.png"
        );
        this.load.image(
            "blue-grandma-back",
            "assets/grandma/blue/grandma_blue_back.png"
        );
        this.load.image(
            "blue-grandma-side",
            "assets/grandma/blue/grandma_blue_side.png"
        );
        this.load.image(
            "red-grandma-front",
            "assets/grandma/red/grandma_red_front.png"
        );
        this.load.image(
            "red-grandma-back",
            "assets/grandma/red/grandma_red_back.png"
        );
        this.load.image(
            "red-grandma-side",
            "assets/grandma/red/grandma_red_side.png"
        );

        // Charger les tuiles de table
        this.load.image("table-mono", "assets/table/table-mono.png");
        this.load.image("table-open-left", "assets/table/table-open-left.png");
        this.load.image(
            "table-open-right",
            "assets/table/table-open-right.png"
        );
        this.load.image(
            "table-open-left-top",
            "assets/table/table-open-left-top.png"
        );
        this.load.image(
            "table-open-right-left",
            "assets/table/table-open-right-left.png"
        );
        this.load.image(
            "table-open-right-left-top",
            "assets/table/table-open-right-left-top.png"
        );
        this.load.image(
            "table-open-right-top",
            "assets/table/table-open-right-top.png"
        );
        this.load.image(
            "table-open-bottom",
            "assets/table/table-open-bottom.png"
        );
        this.load.image(
            "table-open-left-bottom",
            "assets/table/table-open-left-bottom.png"
        );
        this.load.image(
            "table-open-right-bottom",
            "assets/table/table-open-right-bottom.png"
        );
        this.load.image(
            "table-open-left-top-bottom",
            "assets/table/table-open-left-top-bottom.png"
        );
        this.load.image(
            "table-open-right-top-bottom",
            "assets/table/table-open-right-top-bottom.png"
        );
        this.load.image(
            "table-open-right-left-top-bottom",
            "assets/table/table-open-right-left-top-bottom.png"
        );
        this.load.image(
            "table-open-top-bottom",
            "assets/table/table-open-top-bottom.png"
        );

        // Charger les textures de sol
        this.load.image("planks", "assets/planks.png");
        // 🎵 Charger la musique de grand-mère
        this.load.audio("grandma-song", "assets/musics/grandma_song.mp3");
    }

    create() {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start("MainMenu");
    }
    /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here


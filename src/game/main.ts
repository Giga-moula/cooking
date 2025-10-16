import { AUTO, Game } from "phaser";
import Boot from "./scenes/Boot";
import MainGame from "./scenes/Game"; // Importer la scène Game
import GameOver from "./scenes/GameOver";
import Leaderboard from "./scenes/Leaderboard";
import MainMenu from "./scenes/MainMenu";
import Preloader from "./scenes/Preloader";
import Shop from "./scenes/Shop";
import Tutorial from "./scenes/Tutorial";
import TutorialGame from "./scenes/TutorialGame";

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: "game-container",
    backgroundColor: "#028af8",
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 1440,
            height: 778,
        },
        max: {
            width: 1920,
            height: 1440,
        },
    },
    physics: {
        default: "arcade",
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false, // Affiche les hitboxes avec des bordures
        },
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        Tutorial,
        TutorialGame,
        MainGame,
        Shop,
        GameOver,
        Leaderboard,
    ],
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
};

export default StartGame;


export interface PlayerControls {
    upKey: Phaser.Input.Keyboard.Key;
    downKey: Phaser.Input.Keyboard.Key;
    leftKey: Phaser.Input.Keyboard.Key;
    rightKey: Phaser.Input.Keyboard.Key;
    interactKey: Phaser.Input.Keyboard.Key;
    craftKey: Phaser.Input.Keyboard.Key;
    craftUpKey: Phaser.Input.Keyboard.Key;
    craftDownKey: Phaser.Input.Keyboard.Key;
    craftLeftKey: Phaser.Input.Keyboard.Key;
    craftRightKey: Phaser.Input.Keyboard.Key;
}

export class ControlsManager {
    private scene: Phaser.Scene;
    private player1Controls: PlayerControls;
    private player2Controls: PlayerControls;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        
        // Contrôles Joueur 1 : ZQSD + E/SPACE + Flèches
        this.player1Controls = {
            upKey: this.scene.input.keyboard!.addKey('Z'),
            downKey: this.scene.input.keyboard!.addKey('S'),
            leftKey: this.scene.input.keyboard!.addKey('Q'),
            rightKey: this.scene.input.keyboard!.addKey('D'),
            interactKey: this.scene.input.keyboard!.addKey('E'),
            craftKey: this.scene.input.keyboard!.addKey('R'),
            craftUpKey: this.scene.input.keyboard!.addKey('UP'),
            craftDownKey: this.scene.input.keyboard!.addKey('DOWN'),
            craftLeftKey: this.scene.input.keyboard!.addKey('LEFT'),
            craftRightKey: this.scene.input.keyboard!.addKey('RIGHT')
        };

        // Contrôles Joueur 2 : IJKL + O/P + Pavé numérique
        this.player2Controls = {
            upKey: this.scene.input.keyboard!.addKey('I'),
            downKey: this.scene.input.keyboard!.addKey('K'),
            leftKey: this.scene.input.keyboard!.addKey('J'),
            rightKey: this.scene.input.keyboard!.addKey('L'),
            interactKey: this.scene.input.keyboard!.addKey('O'),
            craftKey: this.scene.input.keyboard!.addKey('P'),
            craftUpKey: this.scene.input.keyboard!.addKey('NUMPAD_EIGHT'),
            craftDownKey: this.scene.input.keyboard!.addKey('NUMPAD_TWO'),
            craftLeftKey: this.scene.input.keyboard!.addKey('NUMPAD_FOUR'),
            craftRightKey: this.scene.input.keyboard!.addKey('NUMPAD_SIX')
        };
    }

    public getPlayer1Controls(): PlayerControls {
        return this.player1Controls;
    }

    public getPlayer2Controls(): PlayerControls {
        return this.player2Controls;
    }
}
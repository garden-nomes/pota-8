const keyMap = {
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  z: "z",
  x: "x",
  c: "c",
  space: " "
};

const keyState = new (class {
  keys: { [key: string]: boolean } = {};
  pressed: { [key: string]: boolean } = {};
  released: { [key: string]: boolean } = {};

  constructor() {
    window.addEventListener("keydown", event => {
      this.keys[event.key] = true;
      this.pressed[event.key] = true;

      // prevent scrolling
      if (
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight"
      ) {
        event.preventDefault();
      }
    });

    window.addEventListener("keyup", event => {
      this.keys[event.key] = false;
      this.released[event.key] = true;
    });
  }

  endFrame() {
    this.pressed = {};
    this.released = {};
  }
})();

export interface InputMethods {
  keyDown(key: keyof typeof keyMap): boolean;
  keyPressed(key: keyof typeof keyMap): boolean;
  keyReleased(key: keyof typeof keyMap): boolean;
}

export default class Input implements InputMethods {
  get methods(): InputMethods {
    return {
      keyDown: this.keyDown.bind(this),
      keyPressed: this.keyPressed.bind(this),
      keyReleased: this.keyReleased.bind(this)
    };
  }

  keyDown(key: keyof typeof keyMap) {
    return !!keyState.keys[keyMap[key]];
  }

  keyPressed(key: keyof typeof keyMap) {
    return !!keyState.pressed[keyMap[key]];
  }

  keyReleased(key: keyof typeof keyMap) {
    return !!keyState.released[keyMap[key]];
  }

  endFrame() {
    keyState.endFrame();
  }
}

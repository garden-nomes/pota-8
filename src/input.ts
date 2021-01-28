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

  constructor() {
    window.addEventListener("keydown", event => {
      this.keys[event.key] = true;
    });

    window.addEventListener("keyup", event => {
      this.keys[event.key] = false;
    });
  }

  isDown(key: string) {
    return !!this.keys[key];
  }
})();

export interface InputMethods {
  isDown(key: keyof typeof keyMap): boolean;
}

export default class Input implements InputMethods {
  get methods(): InputMethods {
    return {
      isDown: this.isDown.bind(this)
    };
  }

  isDown(key: keyof typeof keyMap) {
    return keyState.isDown(keyMap[key]);
  }
}

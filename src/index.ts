import Input, { InputMethods } from "./input";
import Renderer, { RendererMethods } from "./renderer";
import { loadImage } from "./util";

interface SpudsContext extends RendererMethods, InputMethods {
  width: number;
  height: number;
  deltaTime: number;
  elapsed: number;
}

declare global {
  const s: SpudsContext;

  interface Window {
    s: SpudsContext;
  }
}

interface InitOptions {
  /**
   * Used to pick a resolution. Minimum number of screen pixels along smallest
   * dimension, defaults to 196.
   */
  pixels: number;
  showFps: boolean;
  setup(): void;
  loop(): void;
  spritesheet?: string;
}

const defaultOptions: InitOptions = {
  pixels: 196,
  showFps: false,
  setup: () => {},
  loop: () => {}
};

export async function init(opt: Partial<InitOptions> = {}) {
  const options: InitOptions = { ...defaultOptions, ...opt };

  // create canvas
  const canvas = document.createElement("canvas");
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.imageRendering = "crisp-edges";
  document.body.append(canvas);

  // create renderer
  let spritesheet;

  if (opt.spritesheet) {
    spritesheet = await loadImage(opt.spritesheet);
  }

  const renderer = new Renderer(canvas, spritesheet);
  const input = new Input();

  // instantiate global context
  window.s = {
    width: 0,
    height: 0,
    deltaTime: 0,
    elapsed: 0,
    ...renderer.methods,
    ...input.methods
  };

  // handle window resizing
  const resize = () => {
    const scale = Math.min(
      Math.floor(window.innerWidth / options.pixels),
      Math.floor(window.innerHeight / options.pixels)
    );

    s.width = window.innerWidth / scale;
    s.height = window.innerHeight / scale;

    canvas.width = s.width;
    canvas.height = s.height;

    renderer.resize();
  };

  resize();
  window.addEventListener("resize", resize);

  // user setup
  options.setup();
  renderer.update();

  // show fps
  let fpsNode: HTMLDivElement | null = null;
  if (options.showFps) {
    fpsNode = document.createElement("div");
    fpsNode.style.position = "absolute";
    fpsNode.style.top = "0";
    fpsNode.style.left = "0";
    fpsNode.style.padding = "4px";
    fpsNode.style.background = "rgba(0,0,0,0.5)";
    fpsNode.style.color = "white";
    fpsNode.style.fontFamily = "sans-serif";
    document.body.append(fpsNode);
  }

  // main loop
  let t = performance.now();
  const frame = () => {
    const now = performance.now();
    s.deltaTime = (now - t) * 0.001;
    s.elapsed += s.deltaTime;
    t = now;

    if (fpsNode !== null) {
      fpsNode.textContent = `fps: ${(1 / s.deltaTime).toFixed(0)}`;
    }

    options.loop();
    renderer.update();

    window.requestAnimationFrame(frame);
  };

  window.requestAnimationFrame(frame);
}

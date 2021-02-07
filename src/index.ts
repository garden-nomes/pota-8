import Font from "./Font";
import Input, { InputMethods } from "./input";
import Renderer, { PostprocessFunction, RendererMethods } from "./renderer";
import Sounds, { SoundsMethods } from "./sounds";
import { loadImage } from "./util";
export * from "./vector2";
export { TextAlign, VerticalAlign } from "./renderer";

// the context object contains all exposed global variables/methods
interface Context extends RendererMethods, InputMethods, SoundsMethods {
  width: number;
  height: number;
  deltaTime: number;
  elapsed: number;
  frame: number;
}

declare global {
  const p: Context;

  interface Window {
    p: Context;
  }
}

interface InitOptions {
  /**
   * Used to pick a resolution. Minimum number of screen pixels along smallest
   * dimension, defaults to 196.
   */
  dimensions: number | [number, number];
  crop: boolean;
  maxScale?: number;
  showFps: boolean;
  setup(): void;
  loop(): void;
  spritesheet?: string;
  audiosprite?: string;
  postprocess?: PostprocessFunction;
  font?: {
    src: string;
    letters: string;
    w: number;
    h: number;
  };
}

const defaultOptions: InitOptions = {
  dimensions: 196,
  crop: false,
  showFps: false,
  setup: () => {},
  loop: () => {}
};

export async function init(opt: Partial<InitOptions> = {}) {
  const options: InitOptions = { ...defaultOptions, ...opt };

  // create canvas
  const canvas = document.createElement("canvas");
  canvas.style.position = "absolute";
  canvas.style.imageRendering = "crisp-edges";
  canvas.style.imageRendering = "pixelated";
  document.body.append(canvas);

  // create renderer
  let spritesheet;

  if (opt.spritesheet) {
    spritesheet = await loadImage(opt.spritesheet);
  }

  const renderer = new Renderer(canvas, spritesheet);
  const sounds = new Sounds();
  const input = new Input();

  if (opt.postprocess) {
    renderer.postprocess = opt.postprocess;
  }

  if (opt.audiosprite) {
    await sounds.loadAudioSprite(opt.audiosprite);
  }

  if (opt.font) {
    const { src, letters, w, h } = opt.font;
    renderer.font = new Font(src, w, h, letters);
    await renderer.font.load();
  }

  // instantiate global context
  window.p = {
    width: 0,
    height: 0,
    deltaTime: 0,
    elapsed: 0,
    frame: 0,
    ...renderer.methods,
    ...input.methods,
    ...sounds.methods
  };

  // handle window resizing
  const resize = () => {
    const d = options.dimensions;
    const [w, h] = Array.isArray(d) ? d : [d, d];

    let scale = Math.min(
      Math.floor(window.innerWidth / w),
      Math.floor(window.innerHeight / h)
    );

    if (options.maxScale) {
      scale = Math.min(scale, options.maxScale);
    }

    if (options.crop) {
      p.width = w;
      p.height = h;
    } else {
      p.width = window.innerWidth / scale;
      p.height = window.innerHeight / scale;
    }

    canvas.width = p.width;
    canvas.height = p.height;
    canvas.style.left = `${(window.innerWidth - p.width * scale) / 2}px`;
    canvas.style.top = `${(window.innerHeight - p.height * scale) / 2}px`;
    canvas.style.width = `${p.width * scale}px`;
    canvas.style.height = `${p.height * scale}px`;

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
  const loop = (now: DOMHighResTimeStamp) => {
    p.deltaTime = (now - t) * 0.001;
    p.elapsed += p.deltaTime;
    t = now;

    if (fpsNode !== null) {
      fpsNode.textContent = `fps: ${(1 / p.deltaTime).toFixed(0)}`;
    }

    options.loop();
    renderer.update();
    input.endFrame();

    p.frame++;
    window.requestAnimationFrame(loop);
  };

  window.requestAnimationFrame(loop);
}

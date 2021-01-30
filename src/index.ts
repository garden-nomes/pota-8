import Input, { InputMethods } from "./input";
import Renderer, { RendererMethods } from "./renderer";
import Sounds, { SoundsMethods } from "./sounds";
import { loadImage } from "./util";
export * from "./vector2";

interface SpudsContext extends RendererMethods, InputMethods, SoundsMethods {
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
  dimensions: number | [number, number];
  crop: boolean;
  showFps: boolean;
  setup(): void;
  loop(): void;
  spritesheet?: string;
  audiosprite?: string;
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
  document.body.append(canvas);

  // create renderer
  let spritesheet;

  if (opt.spritesheet) {
    spritesheet = await loadImage(opt.spritesheet);
  }

  const renderer = new Renderer(canvas, spritesheet);
  const sounds = new Sounds();
  const input = new Input();

  if (opt.audiosprite) {
    await sounds.loadAudioSprite(opt.audiosprite);
  }

  // instantiate global context
  window.s = {
    width: 0,
    height: 0,
    deltaTime: 0,
    elapsed: 0,
    ...renderer.methods,
    ...input.methods,
    ...sounds.methods
  };

  // handle window resizing
  const resize = () => {
    const d = options.dimensions;
    const [w, h] = Array.isArray(d) ? d : [d, d];

    const scale = Math.min(
      Math.floor(window.innerWidth / w),
      Math.floor(window.innerHeight / h)
    );

    if (options.crop) {
      s.width = w;
      s.height = h;
    } else {
      s.width = window.innerWidth / scale;
      s.height = window.innerHeight / scale;
    }

    canvas.width = s.width;
    canvas.height = s.height;
    canvas.style.left = `${(window.innerWidth - s.width * scale) / 2}px`;
    canvas.style.top = `${(window.innerHeight - s.height * scale) / 2}px`;
    canvas.style.width = `${s.width * scale}px`;
    canvas.style.height = `${s.height * scale}px`;

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
  const frame = (now: DOMHighResTimeStamp) => {
    s.deltaTime = (now - t) * 0.001;
    s.elapsed += s.deltaTime;
    t = now;

    if (fpsNode !== null) {
      fpsNode.textContent = `fps: ${(1 / s.deltaTime).toFixed(0)}`;
    }

    options.loop();
    renderer.update();
    input.endFrame();

    window.requestAnimationFrame(frame);
  };

  window.requestAnimationFrame(frame);
}

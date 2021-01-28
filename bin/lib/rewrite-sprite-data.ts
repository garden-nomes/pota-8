import fs from "fs";
import colorNamer from "color-namer";
import { PNG } from "pngjs";
import { camelCase } from "change-case";

const nameRegex = /^(.*)\.aseprite$/;
const nameAndNumberRegex = /^(.*) (\d+).aseprite$/;

export interface RawSpriteData {
  frames: { [key: string]: FrameValue };
  meta: Meta;
}

export interface FrameValue {
  frame: SpriteSourceSizeClass;
  rotated: boolean;
  trimmed: boolean;
  spriteSourceSize: SpriteSourceSizeClass;
  sourceSize: Size;
  duration: number;
}

export interface SpriteSourceSizeClass {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Size {
  w: number;
  h: number;
}

export interface Meta {
  app: string;
  version: string;
  image: string;
  format: string;
  size: Size;
  scale: string;
}

function buildPalette(spriteData: RawSpriteData) {
  if (!spriteData.frames["palette.aseprite"]) {
    return null;
  }

  const { frame } = spriteData.frames["palette.aseprite"];
  const data = fs.readFileSync(spriteData.meta.image);
  const png = PNG.sync.read(data);

  const paletteList: {
    [name: string]: {
      color: [number, number, number];
      names: colorNamer.Color[];
    }[];
  } = {};

  for (let y = frame.y; y < frame.y + frame.h; y++) {
    for (let x = frame.x; x < frame.x + frame.w; x++) {
      const i = (y * png.width + x) * 4;

      if (png.data[i + 3] > 0) {
        const r = png.data[i];
        const g = png.data[i + 1];
        const b = png.data[i + 2];
        const color = `rgb(${r},${g},${b})`;
        const names = colorNamer(color);
        const name = names.pantone[0].name;

        if (typeof paletteList[name] === "undefined") {
          paletteList[name] = [];
        }

        paletteList[name].push({
          color: [r, g, b],
          names: names.pantone
        });
      }
    }
  }

  const palette: { [name: string]: [number, number, number] } = {};

  for (const colorName in paletteList) {
    if (paletteList[colorName].length === 1) {
      palette[camelCase(colorName)] = paletteList[colorName][0].color;
    } else {
      const remaining = paletteList[colorName];

      while (remaining.length > 0) {
        const options = remaining.map(({ color, names }, index) => {
          const { name, distance } = names.find(
            ({ name }) => typeof palette[camelCase(name)] === "undefined"
          ) || { name: "unnamed", distance: Number.POSITIVE_INFINITY };

          return { color, name, distance, index };
        });

        options.sort((a, b) => a.distance - b.distance);
        palette[camelCase(options[0].name)] = options[0].color;
        remaining.splice(options[0].index, 1);
      }
    }
  }

  return palette;
}

function transformSpriteData(spriteData: RawSpriteData) {
  const sprites: { [name: string]: any } = {};

  for (const filename in spriteData.frames) {
    if (filename === "palette.aseprite") {
      continue;
    }

    const nameAndNumberResult = filename.match(nameAndNumberRegex);
    const nameResult = filename.match(nameRegex);

    if (nameAndNumberResult) {
      const [_, name, frameStr] = nameAndNumberResult;
      const frame = Number.parseInt(frameStr);

      if (typeof sprites[name] === "undefined") {
        sprites[name] = [];
      }

      sprites[name].splice(frame, 0, spriteData.frames[filename].frame);
    } else if (nameResult) {
      const name = nameResult[1];
      sprites[name] = [spriteData.frames[filename].frame];
    } else {
      console.error("unable to parse filename: " + filename);
    }
  }

  return sprites;
}

export default async function rewriteSpriteData(dataPath: string) {
  const spriteData: RawSpriteData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  const palette = buildPalette(spriteData);
  const sprites = transformSpriteData(spriteData);
  const result = palette ? { sprites, palette } : { sprites };

  await new Promise<void>((resolve, reject) => {
    fs.writeFile(dataPath, JSON.stringify(result, null, "  "), err => {
      if (err) return reject(err);
      resolve();
    });
  });
}

#!/usr/bin/env node
import { exec } from "child_process";
import cac from "cac";
import tmp from "tmp";
import path from "path";
import fs from "fs";
// @ts-ignore
import serialize from "serialize-to-js";
import audiosprite from "audiosprite";
import { AsepriteData, Rect } from "./aseprite-data";

const ASEPRITE_PATH = process.env["ASEPRITE"];

const audioRegex = /\.(wav|mp3|webm|ogg|flac|aac|webm)$/;
const asepriteRegex = /\.(ase|aseprite)$/;

function isAudioFile(filename: string) {
  return audioRegex.test(filename);
}

function isAsepriteFile(filename: string) {
  return asepriteRegex.test(filename);
}

const cli = cac("spuds");

cli
  .command(
    "bundle-assets [...files]",
    "Bundle .aseprite files into a spritesheet, and audio files into an audiosprite"
  )
  .option("--out-dir", "Directory to output to", { default: "spuds-assets" })
  .option("--no-sounds", "Ignore audio files")
  .option("--no-aseprite", "Ignore .aseprite files")
  .option("-a, --aseprite [path]", "Path to Aseprite binary (leave blank to skip)", {
    default: ASEPRITE_PATH || false
  })
  .action(async (files: string[], options) => {
    if (!fs.existsSync(options.outDir)) {
      fs.mkdirSync(options.outDir);
    }

    let context = {};

    if (options.aseprite) {
      const asepriteFiles = files.filter(isAsepriteFile);
      const result = await handleAsepriteFiles(
        options.aseprite,
        asepriteFiles,
        options.outDir
      );
      context = { ...context, ...result };
    }

    if (options.sounds) {
      const audioFiles = files.filter(isAudioFile);
      const result = await handleSoundFiles(audioFiles, options.outDir);
      context = { ...context, ...result };
    }

    const indexJs = writeIndexJs(options.outDir, context);
    fs.writeFileSync(path.join(options.outDir, "index.js"), indexJs);
  });

cli.help();
cli.parse(process.argv);

function writeIndexJs(
  outDir: string,
  { sprites, spritesheetPath, sounds, soundspritePath }: any
) {
  spritesheetPath = `./${path.relative(outDir, spritesheetPath)}`;
  soundspritePath = `./${path.relative(outDir, soundspritePath)}`;

  let result = [
    ["spritesheet", spritesheetPath],
    ["soundsprite", soundspritePath]
  ]
    .filter(([_, path]) => !!path)
    .map(([name, path]) => `export { default as ${name} } from '${path}';`)
    .join("\n");

  if (sprites) {
    result += `\nexport const sprites = ${serialize(sprites)};`;
  }

  if (sounds) {
    result += `\nexport const sounds = ${serialize(sounds)};`;
  }

  return result;
}

function execAseprite(asepritePath: string, files: string[], sheetFilename: string) {
  return new Promise<AsepriteData>((resolve, reject) => {
    tmp.file((err, dataFilename, _, cleanup) => {
      if (err) return reject(err);

      const filesArgs = files.join(" ");

      // build command (see: https://www.aseprite.org/docs/cli/)
      const command = `${asepritePath} -b ${filesArgs} --sheet ${sheetFilename} --data ${dataFilename}`;

      exec(command, err => {
        if (err) return reject(err);

        // read and then delete the generated JSON
        fs.readFile(dataFilename, "utf-8", (err, data) => {
          if (err) return reject(err);
          cleanup();

          const spriteData: AsepriteData = JSON.parse(data);
          resolve(spriteData);
        });
      });
    });
  });
}

async function handleAsepriteFiles(
  asepritePath: string,
  files: string[],
  outDir: string
) {
  const spritesheetPath = path.join(outDir, "spritesheet.png");

  const rawSpriteData = await execAseprite(
    asepritePath,
    files,
    path.join(outDir, "spritesheet.png")
  );

  const sprites = transformSpriteData(rawSpriteData);

  return {
    spritesheetPath,
    sprites
  };
}

const nameRegex = /^(.*)\.(ase|aseprite)$/;
const nameAndNumberRegex = /^(.*) (\d+).(ase|aseprite)$/;
function transformSpriteData(spriteData: AsepriteData) {
  const sprites: { [name: string]: Rect[] } = {};

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
      sprites[filename] = [spriteData.frames[filename].frame];
    }
  }

  return sprites;
}

export default function handleSoundFiles(files: string[], outputDir: string) {
  return new Promise<{
    sounds: { [name: string]: [number, number] };
    soundspritePath: string;
  }>((resolve, reject) => {
    audiosprite(files, { output: "soundsprite" }, (err, data) => {
      if (err) return reject(err);

      let soundspritePath = "";

      // move/cleanup output files (they're always generated in the current working directory?)
      for (const filename of data.resources) {
        // TODO: allow for multiple audio formats
        if (filename.endsWith(".mp3")) {
          soundspritePath = path.join(outputDir, filename);
          fs.renameSync(filename, soundspritePath);
        } else {
          fs.unlinkSync(filename);
        }
      }

      // transform { start, end, loop } into [start, end]
      const sounds: { [key: string]: [number, number] } = {};
      for (const spriteName in data.spritemap) {
        const { start, end } = data.spritemap[spriteName];
        sounds[spriteName] = [start, end];
      }

      resolve({ sounds, soundspritePath });
    });
  });
}

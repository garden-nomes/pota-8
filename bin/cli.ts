#!/usr/bin/env node
import { exec } from "child_process";
import yargs from "yargs";
import generateSoundSprite from "./lib/generate-sound-sprite";
import rewriteSpriteData from "./lib/rewrite-sprite-data";

const ASEPRITE_PATH = process.env["ASEPRITE_PATH"];

yargs
  .scriptName("spuds")
  .usage("$0 <cmd> [args]")
  .help()
  .command(
    "build-sounds <dir> [flags]",
    "compile directory of sounds into sound sprite",
    yargs => {
      yargs.positional("dir", {
        type: "string",
        default: "./",
        describe: "directory of audio files"
      });
    },
    async argv => {
      const data = await generateSoundSprite(argv.dir as string);
      console.dir(data);
    }
  )
  .command(
    "build-aseprite <dir> [flags]",
    "build directory of .aseprite files for use with SPUDS",
    yargs => {
      yargs.positional("dir", {
        type: "string",
        default: "./",
        describe: "directory of .aseprite files"
      });

      yargs.option("a", {
        alias: "aseprite",
        default: ASEPRITE_PATH,
        demandOption: true,
        describe: "path to aseprite executable"
      });
    },
    async argv => {
      process.chdir(argv.dir as string);

      await new Promise<void>((resolve, reject) => {
        exec(
          `${argv.a} -b *.aseprite --sheet spritesheet.png --data spritedata.json`,
          err => {
            if (err) return reject(err);
            resolve();
          }
        );
      });

      await rewriteSpriteData("./spritedata.json");
    }
  ).argv;

import audiosprite from "audiosprite";
import fs from "fs";
import path from "path";

const audioFileRegex = /\.(wav|mp3|webm|ogg|flac|aac)/;

export default function generateSoundSprite(dir: string) {
  return new Promise<void>((resolve, reject) => {
    // find all audio files in directory
    const files = fs
      .readdirSync(dir)
      .filter(
        filename => audioFileRegex.test(filename) && !filename.startsWith("soundsprite")
      )
      .map(filename => path.join(dir, filename));

    if (!files.length) {
      return reject(new Error("No audio files found"));
    }

    audiosprite(files, { output: "soundsprite" }, (err, data) => {
      if (err) return reject(err);

      // move/cleanup output files (they're always generated in the current working directory?)
      for (const filename of data.resources) {
        // TODO: allow for multiple audio formats
        if (filename.endsWith(".mp3")) {
          fs.renameSync(filename, path.join(dir, filename));
        } else {
          fs.unlinkSync(filename);
        }
      }

      // transform { start, end, loop } into [start, end]
      const sprites: { [key: string]: [number, number] } = {};
      for (const spriteName in data.spritemap) {
        const { start, end } = data.spritemap[spriteName];
        sprites[spriteName] = [start, end];
      }

      // write output data
      fs.writeFileSync(
        path.join(dir, "soundsprite.json"),
        JSON.stringify(sprites, null, "  ")
      );

      resolve();
    });
  });
}

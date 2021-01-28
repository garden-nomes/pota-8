export type Sound = number[];

export interface PlayOpt {
  loop?: boolean;
  volume?: number;
}

export interface StopOpt {
  immediate?: boolean;
}
export type SoundId = number;

export interface SoundsMethods {
  play(sound: Sound, opt?: PlayOpt): SoundId;
  stop(id: SoundId, opt?: StopOpt): void;
  volume(volume: number): void;
}

export default class Sounds implements SoundsMethods {
  private ctx: AudioContext;
  private gain: GainNode;
  private audioBuffer: AudioBuffer | null = null;
  private audioSources: { [id: number]: AudioBufferSourceNode } = {};
  private currentId = 1;

  constructor() {
    this.ctx = new AudioContext();
    this.gain = this.ctx.createGain();
    this.gain.connect(this.ctx.destination);
  }

  async loadAudioSprite(src: string) {
    this.audioBuffer = await fetch(src)
      .then(response => response.arrayBuffer())
      .then(buffer => this.ctx.decodeAudioData(buffer));
  }

  private getId(): number {
    return this.currentId++;
  }

  get methods(): SoundsMethods {
    return {
      play: this.play.bind(this),
      stop: this.stop.bind(this),
      volume: this.volume.bind(this)
    };
  }

  play(sound: Sound, opt: PlayOpt = {}): SoundId {
    const source = this.ctx.createBufferSource();
    source.buffer = this.audioBuffer;

    if (typeof opt.volume !== "undefined") {
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(opt.volume, this.ctx.currentTime);
      gain.connect(this.gain);
      source.connect(gain);
    } else {
      source.connect(this.gain);
    }

    if (opt.loop) {
      source.loop = true;
      source.loopStart = sound[0];
      source.loopEnd = sound[1];
      source.start(0, sound[0]);
    } else {
      source.start(0, sound[0], sound[1] - sound[0]);
    }

    const id = this.getId();
    this.audioSources[id] = source;
    return id;
  }

  stop(id: SoundId, opt: StopOpt = {}) {
    opt = { immediate: true, ...opt };

    if (this.audioSources[id]) {
      const source = this.audioSources[id];

      if (opt.immediate) {
        source.stop();
      } else {
        // todo: stop sound after loop ends
        source.stop();
      }
    }
  }

  volume(volume: number): void {
    this.gain.gain.setValueAtTime(volume, this.ctx.currentTime);
  }
}

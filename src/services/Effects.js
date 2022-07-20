import * as Tone from "tone";

export const fxParam = {
  //units
  eq: {
    name: "EQ3",
    lowFrequency: [0, 800, 10],
    low: [-24, 24, 0.1],
    mid: [-24, 24, 0.1],
    highFrequency: [1000, 20000, 10],
    high: [-24, 24, 0.1],
  },
  cp: {
    name: "Compressor",
    attack: [0, 1, 0.01],
    ratio: [1, 20, 1],
    knee: [0, 40, 1],
    threshold: [-100, 0, 1],
    release: [0, 1, 0.01],
  },
  rv: {
    name: "Reverb",
    decay: [0.01, 4, 0.01],
    preDelay: [0, 0.065, 0.001],
    wet: [0, 1, 0.01],
  },
  dl: {
    name: "FeedbackDelay",
    feedback: [0, 1, 0.01],
    delayTime: [0, 2000, 10],
    //maxDelay: [0, 2000, 10],
    wet: [0, 1, 0.01],
  },
  ch: {
    name: "Chorus",
    feedback: [0, 1, 0.01],
    frequency: [0, 10, 0.5],
    delayTime: [0, 20, 1],
    depth: [0, 1, 0.01],
    spread: [0, 360, 1],
    wet: [0, 1, 0.01],
  },
  ph: {
    name: "Phaser",
    frequency: [0, 10, 0.5],
    octaves: [0, 4, 1],
    stages: [0, 8, 1],
    Q: [0, 20, 1],
    wet: [0, 1, 0.01],
    baseFrequency: [0, 2000, 10],
  },
  dt: {
    name: "Distortion",
    distortion: [0, 1, 0.01],
    //oversample: [0, 4, 1],
    wet: [0, 1, 0.01],
  },
  bc: {
    name: "BitCrusher",
    bits: [1, 16, 1],
    wet: [0, 1, 0.01],
  },
};

export const loadEffects = (instrument, track, index, setEffects) => {
  let effects = track.fx.map((fx, i) => new Tone[fxParam[fx.ty].name](fx));
  instrument.disconnect();
  instrument.chain(
    ...effects.filter((fx, i) => !track.fx[i].bp),
    Tone.Destination
  );
  setEffects((prev) => ({ ...prev, [track.id]: effects }));
};

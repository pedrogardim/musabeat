//const instrcategories = ["Drums", "Keys", "Synth"];

export const instruments = [
  {
    name: "Musa Electric Piano",
    base: "FM",
    categ: 1,
    gain: -6,
    options: {
      harmonicity: 50,
      modulationIndex: 20,
      oscillator: {
        type: "sine2",
      },
      envelope: {
        attack: 0.001,
        decay: 2,
        sustain: 0.0,
        release: 0.2,
      },
      modulation: {
        type: "sine",
      },
      modulationEnvelope: {
        attack: 0.001,
        decay: 0.5,
        sustain: 0,
        release: 0.0,
      },
    },
  },
  {
    name: "Square Lead",
    base: "AM",
    categ: 2,
    gain: -6,
    options: {
      harmonicity: 3.999,
      oscillator: {
        type: "square",
      },
      envelope: {
        attack: 0.03,
        decay: 0.3,
        sustain: 0.7,
        release: 0.1,
      },
      modulation: {
        volume: 12,
        type: "square6",
      },
      modulationEnvelope: {
        attack: 2,
        decay: 3,
        sustain: 0.8,
        release: 0.1,
      },
    },
  },
  {
    name: "Organ",
    base: "Mono",
    type: 2,
    gain: -12,
    options: {
      oscillator: {
        type: "sine6",
      },
      envelope: {
        attack: 0.01,
        decay: 0.0,
        sustain: 1,
        release: 0.01,
      },
      filter:{
        gain:-12,
        type:"lowpass",
        Q:2,
      },

      filterEnvelope: {
        attack: 0,
        decay: 0,
        sustain: 1,
        release: 0,

      }
    },
    fx: [
      ["vib", 6, 0.05],
      ["trem", 2, 0.2],
    ],
  },
  {
    name: "Deep Bass",
    base: "Mono",
    type: 2,
    gain: -12,
    options: {
      oscillator: {
        type: "sawtooth",
      },
      filter : {
        Q : 6 ,
        type : "lowpass" ,
        rolloff : -24
        } ,
        envelope : {
        attack : 0.005 ,
        decay : 0.1 ,
        sustain : 0.9 ,
        release : 0,
        } ,
        filterEnvelope : {
        attack : 0.1 ,
        decay : 0.05 ,
        sustain : 0.5 ,
        release : 0 ,
        octaves:0
        }
    },
  },
  {
    name: "String Pad",
    base: "Mono",
    type: 2,
    gain: -18,
    options: {
      oscillator: {
        type: "fatsawtooth2",
      },
      envelope: {
        attack: 0.4,
        decay: 0.0,
        sustain: 1,
        release: 0.5,
      },
    },
    fx: [["vib", 5, 0.1]],
  },
  {
    name: "Grand Piano",
    base: "Sampler",
    type: 2,
    gain: -18,
    urls: {
      68: "Ab4.wav",
      51: "Eb3.wav",
      80: "Ab5.wav",
      43: "G2.wav",
      85: "Db6.wav",
      36: "C2.wav",
      71: "B4.wav",
      54: "Gb3.wav",
      62: "D4.wav",
      40: "E2.wav",
    },
    baseUrl: "assets/samples/instruments/piano1/",

    fx: [["dly", "16n", 0.6, 0.2]],
    asdr: [0, 0.5],
  },
  /* {
    name: "Pizzicato",
    base: "Sampler",
    type: 2,
    gain: -18,
    urls: {
      47: "B2.wav",
      54: "Gb3.wav",
      64: "E4.wav",
      43: "G2.wav",
      74: "D5.wav",
      60: "C4.wav",
      45: "A2.wav",
      71: "B4.wav",
      57: "A3.wav",
      67: "G4.wav",
      50: "D3.wav",
    },

    baseUrl: "assets/samples/instruments/vlnpzz/",

    asdr: [0, 0.5],
  }, */
];

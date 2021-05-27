import * as MUIcolors from "@material-ui/core/colors";

import { instrumentContructor } from "./musicutils";
import { loadDrumPatch } from "./musicutils";

import * as Tone from "tone";

const colors = [
  MUIcolors.red,
  MUIcolors.deepPurple,
  MUIcolors.indigo,
  MUIcolors.blue,
  MUIcolors.cyan,
  MUIcolors.teal,
  MUIcolors.lightGreen,
  MUIcolors.lime,
  MUIcolors.amber,
  MUIcolors.orange,
];

export const starterSession = {
  name: "",
  bpm: 90,
  modules: [
    {
      id: 0,
      name: "Sequencer",
      type: 0,
      steps: 16,
      patch: 0,
      instrument: loadDrumPatch(0),
      color: colors[1],
      score: [
        [
          [0, 3],
          [],
          [3],
          [],
          [1, 3],
          [],
          [3],
          [],
          [0, 3],
          [],
          [3],
          [],
          [1, 3],
          [],
          [3],
          [],
        ],
      ],
    },
    {
      id: 1,
      name: "Melody",
      type: 1,
      steps: 16,
      root: 0,
      scale: 1,
      range: [3, 4],
      instrument: instrumentContructor(2),
      color: colors[2],
      score: [
        [
          ["C3"],
          [],
          ["D3"],
          [],
          ["E3"],
          ["A3"],
          ["C4"],
          [],
          [],
          ["A3"],
          [],
          [],
          ["A3"],
          [],
          ["D3"],
          ["C3"],
        ],
        [
          ["A3"],
          [],
          [],
          ["G3"],
          [],
          [],
          ["E3"],
          [],
          ["G3"],
          ["E3"],
          ["D3"],
          ["E3"],
          ["A3"],
          [],
          ["D3"],
          ["G3"],
        ],
      ],
    },
    {
      id: 2,
      name: "Chords",
      type: 2,
      instrument: instrumentContructor(0),
      root: 0,
      scale: 0,
      complexity: 3,
      color: colors[9],
      score: [
        {
          notes: ["E4", "G4", "B4"],
          duration: 0.5,
          time: 0,
          measure: 0,
          rhythm: [1,0,1,1],
        },
        {
          notes: ["C4", "E4", "G4", "D5"],
          duration: 0.5,
          time: 0.5,
          measure: 0,
          rhythm: [0,1,0,1],
        },
        {
          notes: ["A4", "C4", "E4"],
          duration: 0.5,
          time: 1,
          rhythm: [1,1,0,1],
        },
        {
          notes: ["G4", "B4", "D5"],
          duration: 0.5,
          time: 1.5,
          rhythm: [1,0],
        },
      ],
    },
    {
      id: 3,
      name: "Player",
      type: 3,
      length: 1,
      instrument: new Tone.GrainPlayer(
        "https://raw.githubusercontent.com/pedrogardim/musa_loops_old/master/assets/samples/drums/808/9.wav"
      ).toDestination(),
      color: colors[6],
      score: [{ time: 0, duration: 1 }],
    },
  ],
};
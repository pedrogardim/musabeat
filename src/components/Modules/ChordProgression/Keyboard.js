import React from "react";
import * as Tone from "tone";

import { colors } from "../../../utils/materialPalette";

import "./Keyboard.css";

function Keyboard(props) {
  const handleKeyClick = (key) => {
    let note = Tone.Frequency(key + 24, "midi").toNote();
    console.log(note, props.activeChord);
    props.setChords((prev) => {
      let newChords = [...prev];
      let chordNotes = newChords[props.activeChord]
        ? newChords[props.activeChord].notes.includes(note)
          ? newChords[props.activeChord].notes.filter((e) => e !== note)
          : [...newChords[props.activeChord].notes, note]
        : [note];
      console.log(chordNotes);
      newChords[props.activeChord].notes = chordNotes.sort(
        (a, b) =>
          Tone.Frequency(a).toFrequency() - Tone.Frequency(b).toFrequency()
      );
      return newChords;
    });
    props.playChordPreview();
  };
  return (
    <div className="keyboard">
      {Array(84)
        .fill(1)
        .map((e, i) => (
          <div
            onClick={() => handleKeyClick(i)}
            style={{
              left: (i * 100) / 84 + "%",
              backgroundColor:
                !!props.notes.length &&
                props.notes
                  .map((note) => Tone.Frequency(note).toMidi() - 24)
                  .includes(i)
                  ? colors[props.color]["A700"]
                  : i % 12 === 1 ||
                    i % 12 === 3 ||
                    i % 12 === 6 ||
                    i % 12 === 8 ||
                    i % 12 === 10
                  ? colors[props.color][900]
                  : colors[props.color][100],
              outline: `solid 1px ${colors[props.color][900]}`,
            }}
            className={`keyboard-key ${
              i % 12 === 1 ||
              i % 12 === 3 ||
              i % 12 === 6 ||
              i % 12 === 8 ||
              i % 12 === 10
                ? "keyboard-black-key"
                : "keyboard-white-key"
            } ${
              !!props.notes.length &&
              props.notes
                .map((e) => Tone.Frequency(e).toMidi() - 24)
                .includes(i) &&
              "keyboard-key-active"
            }`}
          />
        ))}
    </div>
  );
}

export default Keyboard;

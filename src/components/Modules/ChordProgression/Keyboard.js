import React from "react";
import * as Tone from "tone";

import { colors } from "../../../utils/materialPalette";

import "./Keyboard.css";

function Keyboard(props) {
  const handleKeyClick = (key) => {
    let note = Tone.Frequency(key + 24, "midi").toNote();
    props.onKeyClick(note);
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
                !!props.activeNotes.length &&
                props.activeNotes
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
              !!props.activeNotes.length &&
              props.activeNotes
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

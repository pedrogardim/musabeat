import React, { useState, Fragment, useEffect } from "react";
import * as Tone from "tone";

import { colors } from "../../../utils/materialPalette";

import "./Keyboard.css";

import { Typography, IconButton, Icon } from "@material-ui/core";

function Keyboard(props) {
  const [octaveState, setOctaveState] = useState(
    props.initialOctave ? props.initialOctave : props.octave ? props.octave : 0
  );

  const handleKeyClick = (key) => {
    let note = key + 24 + octave * 12;
    props.onKeyClick && props.onKeyClick(note);
    props.setPressedKeys &&
      props.setPressedKeys((prev) =>
        !prev.includes(note) ? [...prev, note] : prev
      );
  };
  const handleKeyUp = (key) => {
    let note = key + 24 + octave * 12;
    props.onKeyUp && props.onKeyUp(note);
    props.setPressedKeys &&
      props.setPressedKeys((prev) =>
        prev.includes(note) ? prev.filter((e) => e !== note) : prev
      );
  };

  const color = colors[props.color ? props.color : 2];

  const octaves = props.octaves ? props.octaves : 7;

  const octave = props.octave !== undefined ? props.octave : octaveState;

  useEffect(() => {
    //console.log(props.setPlayingOctave);
    if (props.setPlayingOctave) props.setPlayingOctave(octave);
  }, [octaveState]);

  return (
    <div className="keyboard" style={{ ...props.style }}>
      {Array(Math.floor(octaves * 12))
        .fill(1)
        .map((e, i) => (
          <div
            onMouseDown={() => handleKeyClick(i)}
            onMouseUp={() => handleKeyUp(i)}
            onMouseLeave={() => handleKeyUp(i)}
            style={{
              left: (i * 100) / (octaves * 12) + "%",
              backgroundColor:
                !!props.activeNotes.length &&
                props.activeNotes
                  .map((note) => Tone.Frequency(note, "midi").toMidi() - 24)
                  .includes(i + octave * 12)
                  ? color["A700"]
                  : i % 12 === 1 ||
                    i % 12 === 3 ||
                    i % 12 === 6 ||
                    i % 12 === 8 ||
                    i % 12 === 10
                  ? color[900]
                  : color[100],
              outline: `solid 1px ${color[900]}`,
              width:
                i % 12 === 1 ||
                i % 12 === 3 ||
                i % 12 === 6 ||
                i % 12 === 8 ||
                i % 12 === 10
                  ? 100 / ((78 / 7) * octaves) + "%"
                  : 100 / ((49 / 7) * octaves) + "%",
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
          >
            <span>{props.notesLabel && props.notesLabel[i]}</span>
          </div>
        ))}
      {props.variableOctave && (
        <Fragment>
          {octave < 6 && (
            <IconButton
              style={{
                position: "absolute",
                right: 0,
                marginRight: -48,
                top: "50%",
                marginTop: -24,
              }}
              onClick={() => setOctaveState((prev) => prev + 1)}
            >
              <Icon>chevron_right</Icon>
            </IconButton>
          )}
          {octave > 0 && (
            <IconButton
              style={{
                position: "absolute",
                left: 0,
                marginLeft: -48,
                top: "50%",
                marginTop: -24,
              }}
              onClick={() => setOctaveState((prev) => prev - 1)}
            >
              <Icon>chevron_left</Icon>
            </IconButton>
          )}
          <Typography
            variant="overline"
            style={{
              position: "absolute",
              bottom: 0,
              marginBottom: -36,
            }}
          >
            Octave: {octave + 1}
          </Typography>
        </Fragment>
      )}
    </div>
  );
}

export default Keyboard;

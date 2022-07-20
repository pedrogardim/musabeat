import React, { useState, useEffect } from "react";
import * as Tone from "tone";

import { colors } from "../../utils/Pallete";

import "./style.css";

import { Typography, IconButton, Icon, Paper } from "@mui/material";

import { detectTouchOut } from "../../services/Control";

function Keyboard(props) {
  const [octaveState, setOctaveState] = useState(
    props.initialOctave
      ? props.initialOctave
      : !isNaN(props.octave)
      ? props.octave
      : 0
  );
  const [isMouseDown, setIsMouseDown] = useState(false);

  const handleKeyClick = (key) => {
    let note = key + 24;
    props.playFn && props.playFn.current[0](null, note);
  };
  const handleKeyUp = (key) => {
    let note = key + 24;
    props.playFn && props.playFn.current[1](null, note);
  };

  const handleTouch = (e) => {
    let touchedKeys = [
      ...new Set(
        Array(e.touches.length)
          .fill(0)
          .map((t, ti) =>
            parseInt(
              document
                .elementFromPoint(
                  e.touches.item(ti).clientX,
                  e.touches.item(ti).clientY
                )
                .getAttribute("data-keyIndex")
            )
          )
          .filter((e) => e !== null && e !== NaN)
      ),
    ];

    let activeKeys =
      props.activeNotes.length > 0
        ? [
            ...new Set(
              props.activeNotes.map(
                (n) => Tone.Frequency(n, "midi").toMidi() - 24 - octave * 12
              )
            ),
          ]
        : [];

    let toPlay = [
      ...new Set(touchedKeys.filter((obj) => activeKeys.indexOf(obj) == -1)),
    ];
    let toRelease = [
      ...new Set(activeKeys.filter((obj) => touchedKeys.indexOf(obj) == -1)),
    ];

    toPlay.forEach((e) => handleKeyClick(e));
    toRelease.forEach((e) => handleKeyUp(e));
  };

  const color = colors[typeof props.color === "number" ? props.color : 2];

  const octaves = props.octaves ? props.octaves : 7;

  const octave = !isNaN(props.octave) ? props.octave : octaveState;

  useEffect(() => {
    //console.log(props.setPlayingOctave);
    if (props.setPlayingOctave) props.setPlayingOctave(octave);
  }, [octaveState]);

  useEffect(() => {
    if (!isMouseDown && props.playFn & props.playFn.current)
      props.playFn.current[2]();
  }, [isMouseDown]);

  return (
    <Paper
      className="keyboard"
      style={{ ...props.style }}
      onMouseDown={() => setIsMouseDown(true)}
      onMouseUp={() => setIsMouseDown(false)}
      onMouseLeave={() => setIsMouseDown(false)}
      //onTouchStart={(e) => handleTouch(e)}
      onTouchEnd={handleTouch}
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
    >
      {Array(Math.floor(octaves * 12))
        .fill(1)
        .map((e, i) => {
          let isBlackKey =
            i % 12 === 1 ||
            i % 12 === 3 ||
            i % 12 === 6 ||
            i % 12 === 8 ||
            i % 12 === 10;
          let isActive =
            props.activeNotes.length > 0 &&
            props.activeNotes
              .map((note) => Tone.Frequency(note, "midi").toMidi() - 24)
              .includes(i + octave * 12);
          return (
            <Paper
              onMouseDown={() => handleKeyClick(i)}
              onMouseLeave={() => handleKeyUp(i)}
              onMouseUp={() => handleKeyUp(i)}
              onMouseEnter={() => isMouseDown && handleKeyClick(i)}
              elevation={isBlackKey ? 24 : 8}
              key={i}
              data-keyIndex={i}
              sx={(theme) => {
                let dark = theme.palette.mode === "dark";
                return {
                  boxShadow: dark ? 4 : 0,
                  left: (i * 100) / (octaves * 12) + "%",
                  borderRadius: 0,
                  bgcolor: isActive
                    ? color[dark ? 900 : "A700"]
                    : dark
                    ? "background.default"
                    : isBlackKey
                    ? color[900]
                    : color[100],
                  outline: !dark && `solid 1px ${color[900]}`,
                  width: isBlackKey
                    ? 100 / ((78 / 7) * octaves) + "%"
                    : 100 / ((49 / 7) * octaves) + "%",
                };
              }}
              className={`keyboard-key ${
                isBlackKey ? "keyboard-black-key" : "keyboard-white-key"
              } ${"keyboard-key-active"}`}
            >
              <Typography
                sx={{
                  color: isBlackKey ? "background.default" : "text.primary",
                }}
              >
                {props.notesLabel && props.notesLabel[i]}
              </Typography>
              <Typography
                sx={{
                  color: isBlackKey ? "background.default" : "text.primary",
                }}
                style={{ opacity: 0.5 }}
              >
                {Tone.Frequency(i + octave * 12 + 24, "midi").toNote()}
              </Typography>
            </Paper>
          );
        })}
    </Paper>
  );
}

export default Keyboard;

import React, { useState, useEffect, useContext } from "react";

import * as Tone from "tone";

import { Paper, IconButton, Typography, Icon, Box } from "@mui/material";

import "./style.css";

import {
  drumMapping,
  keySamplerMapping,
  keyboardMapping,
} from "../../../services/MiscData";

import { SessionWorkspaceContext } from "../../../context/SessionWorkspaceContext";

import Keyboard from "../../../components/Keyboard";

function PlayInterface(props) {
  const [keyPage, setKeyPage] = useState(0);
  const handleClick = (event, i) => {
    props.playNoteFunction[0](i);
    setPressedKeys((prev) => [...prev, i]);
  };

  const {
    params,
    instruments,
    tracks,
    setPressedKeys,
    paramSetter,
    setTracks,
  } = useContext(SessionWorkspaceContext);

  const { setPlayFn } = props;

  const {
    expanded,
    pressedKeys,
    selectedTrack,
    trackRows,
    gridSize,
    isRecording,
  } = params;

  const instrument = instruments[selectedTrack];
  const track = tracks[selectedTrack];

  const keyMapping =
    selectedTrack !== null && track.type === 0
      ? keySamplerMapping
      : keyboardMapping;

  const playNote = (e) => {
    let sampleIndex = keyMapping[e.code];

    if (sampleIndex === undefined || params.selectedTrack === null) return;

    let note =
      sampleIndex +
      (tracks[params.selectedTrack].type === 1 ? params.playingOctave * 12 : 0);

    if (params.pressedKeys.includes(note)) return;

    paramSetter("pressedKeys", (prev) => [...prev, note]);

    if (track.type === 0) {
      if (
        trackRows[note] === undefined ||
        trackRows[note] === null ||
        !instrument.has(trackRows[note].note)
      )
        return;
      instrument.player(trackRows[note].note).start();
    } else {
      instrument.triggerAttack(Tone.Frequency(note, "midi"));
    }

    if (!isRecording) return;

    if (track.type === 0) {
      let newNote = {
        note: trackRows[note].note,
        time: Tone.Time(
          Tone.Time(Tone.Transport.seconds).quantize(`${gridSize}n`)
        ).toBarsBeatsSixteenths(),
      };

      setTracks((prev) => {
        let newTracks = [...prev];
        let find = newTracks[selectedTrack].score.findIndex(
          (e) => e.note === newNote.note && e.time === newNote.time
        );
        //console.log(find);
        if (find !== -1) return prev;
        newTracks[selectedTrack].score = [...newTracks[0].score, newNote];
        return newTracks;
      });
    } else {
      let drawingNote = {
        note: note,
        time: Tone.Time(Tone.Transport.seconds).quantize(`${gridSize}n`),
      };

      //setDrawingNote(drawingNote);
    }
  };

  const releaseNote = (e) => {
    let sampleIndex = keyMapping[e.code];

    if (sampleIndex === undefined || params.selectedTrack === null) return;

    let note =
      sampleIndex +
      (tracks[params.selectedTrack].type === 1 ? params.playingOctave * 12 : 0);

    if (!params.pressedKeys.includes(note)) return;

    paramSetter("pressedKeys", (prev) => prev.filter((e) => e !== note));

    if (track.type === 1) {
      instrument.triggerRelease(Tone.Frequency(note, "midi"));
    }
  };

  useEffect(() => {
    setPlayFn([playNote, releaseNote]);
  }, [instrument, trackRows]);

  return (
    <Box
      className="ws-note-input"
      sx={(theme) => ({
        [theme.breakpoints.down("md")]: {
          position: !expanded.instr && "fixed",
          bottom: !expanded.instr && "-128px",

          margin: "4px 0 0 0",
        },
      })}
    >
      <Box
        className="ws-note-input-key-cont"
        sx={(theme) => ({
          [theme.breakpoints.down("md")]: {
            height: 64,
          },
        })}
      >
        {track &&
          instrument &&
          trackRows.length > 0 &&
          (props.track.type === 0 ? (
            /* Array(instrument._buffers._buffers.size) */
            Object.keys(props.keyMapping)
              .filter((e, i) => (!keyPage ? i < 10 : i >= 10))
              .map((e) => e.replace("Key", "").replace("Semicolon", ":"))
              .map((e, i) => (
                <>
                  <Paper
                    className="ws-note-input-key"
                    onMouseDown={(event) => handleClick(event, i)}
                    onMouseLeave={() =>
                      setPressedKeys((prev) =>
                        prev.filter((note) => note !== i)
                      )
                    }
                    onMouseLeave={() =>
                      setPressedKeys((prev) =>
                        prev.filter((note) => note !== i)
                      )
                    }
                    onClick={() =>
                      setPressedKeys((prev) =>
                        prev.filter((note) => note !== i)
                      )
                    }
                    elevation={
                      trackRows[i] && !instrument.has(trackRows[i].note) ? 1 : 4
                    }
                    sx={(theme) => ({
                      bgcolor: pressedKeys.includes(i)
                        ? "darkgray"
                        : theme.palette.mode !== "dark" &&
                          trackRows[i] &&
                          !instrument.has(trackRows[i].note) &&
                          "lightgray",
                    })}
                  >
                    <Typography
                      variant="body1"
                      style={{
                        position: "absolute",
                        left: 4,
                        top: 4,
                        lineHeight: 1,
                      }}
                    >
                      {e}
                    </Typography>
                    <Typography variant="body1" color={"textSecondary"}>
                      {trackRows[i] && drumMapping[trackRows[i].note]}
                    </Typography>
                  </Paper>
                  {i === 9 && <div className="break" />}
                </>
              ))
          ) : (
            <>
              <div
                style={{
                  width: 48,
                  height: "100%",
                  left: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <IconButton
                  onClick={() =>
                    props.setPlayingOctave((prev) =>
                      prev < 6 ? prev + 1 : prev
                    )
                  }
                >
                  <Icon>navigate_next</Icon>
                </IconButton>
                <IconButton
                  onClick={() =>
                    props.setPlayingOctave((prev) =>
                      prev > 0 ? prev - 1 : prev
                    )
                  }
                >
                  <Icon>navigate_before</Icon>
                </IconButton>
              </div>
              <Keyboard
                activeNotes={pressedKeys}
                style={{
                  height: "100%",
                  zIndex: 0,
                }}
                color={props.track.color}
                octaves={1.42}
                notesLabel={Object.keys(props.keyMapping).map((e) =>
                  e.replace("Key", "").replace("Semicolon", ":")
                )}
                octave={props.playingOctave}
                onKeyClick={props.playNoteFunction[0]}
                onKeyUp={props.playNoteFunction[1]}
                setPressedKeys={setPressedKeys}
                isMouseDown={props.isMouseDown}
              />
            </>
          ))}
      </Box>
    </Box>
  );
}

const drawWave = (wavearray, setWavePath) => {
  if (!wavearray.length) {
    return;
  }

  let pathstring = "M 0 16 ";

  let wave = wavearray;
  let scale = wave.length / 64;

  let yZoom = 2;

  for (let x = 0; x < 64; x++) {
    if (Math.abs(wave[Math.floor(x * scale)]) > 0.02) {
      pathstring +=
        "L " +
        x +
        " " +
        (wave[Math.floor(x * scale)] * 16 + 16 / yZoom) * yZoom +
        " ";
    }
  }

  return pathstring;
};

export default PlayInterface;

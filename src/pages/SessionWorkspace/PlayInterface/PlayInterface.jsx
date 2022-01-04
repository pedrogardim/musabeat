import React, { useState, useEffect, useContext } from "react";

import * as Tone from "tone";

import { Paper, IconButton, Typography, Icon, Box } from "@mui/material";

import "./style.css";

import {
  drumMapping,
  keySamplerMapping,
  keyboardMapping,
} from "../../../services/MiscData";

import wsCtx from "../../../context/SessionWorkspaceContext";

import Keyboard from "../../../components/Keyboard";

function PlayInterface(props) {
  const [keyPage, setKeyPage] = useState(0);
  const [playingOctave, setPlayingOctave] = useState(3);
  const [pressedKeys, setPressedKeys] = useState([]);

  const { params, instruments, tracks, setTracks } = useContext(wsCtx);

  const { playFn } = props;

  const { expanded, selectedTrack, trackRows, gridSize, isRecording } = params;

  const instrument = instruments[selectedTrack];
  const track = tracks[selectedTrack];

  const keyMapping =
    selectedTrack !== null && track.type === 0
      ? keySamplerMapping
      : keyboardMapping;

  const playNote = (ev, index) => {
    let sampleIndex = index !== undefined ? index : keyMapping[ev.code];

    if (sampleIndex === undefined || selectedTrack === null) return;

    let note =
      sampleIndex + (tracks[selectedTrack].type === 1 ? playingOctave * 12 : 0);

    if (pressedKeys.includes(note)) return;

    setPressedKeys((prev) => [...prev, note]);

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

  const releaseNote = (ev, index) => {
    let sampleIndex = index !== undefined ? index : keyMapping[ev.code];

    if (sampleIndex === undefined || selectedTrack === null) return;

    let note =
      sampleIndex + (tracks[selectedTrack].type === 1 ? playingOctave * 12 : 0);

    if (!pressedKeys.includes(note)) return;

    setPressedKeys((prev) => prev.filter((e) => e !== note));

    if (track.type === 1) {
      instrument.triggerRelease(Tone.Frequency(note, "midi"));
    }
  };

  const releaseAll = () => {
    if (track.type === 0) instrument.stopAll();
    else instrument.releaseAll();
    setPressedKeys([]);
  };

  useEffect(() => {
    playFn.current = [playNote, releaseNote, releaseAll];
  }, [pressedKeys, playingOctave]);

  useEffect(() => {
    console.log(pressedKeys);
  }, [pressedKeys]);

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
          (track.type === 0 ? (
            /* Array(instrument._buffers._buffers.size) */
            Object.keys(keyMapping)
              .filter((e, i) => (!keyPage ? i < 10 : i >= 10))
              .map((e) => e.replace("Key", "").replace("Semicolon", ":"))
              .map((e, i) => (
                <>
                  <Paper
                    className="ws-note-input-key"
                    onMouseDown={() => playNote(null, i)}
                    onMouseLeave={() => releaseNote(null, i)}
                    onMouseLeave={() => releaseNote(null, i)}
                    onClick={() => releaseNote(null, i)}
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
                    setPlayingOctave((prev) => (prev < 6 ? prev + 1 : prev))
                  }
                >
                  <Icon>navigate_next</Icon>
                </IconButton>
                <IconButton
                  onClick={() =>
                    setPlayingOctave((prev) => (prev > 0 ? prev - 1 : prev))
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
                color={track.color}
                octaves={1.42}
                notesLabel={Object.keys(keyMapping).map((e) =>
                  e.replace("Key", "").replace("Semicolon", ":")
                )}
                octave={playingOctave}
                onKeyClick={playNote}
                onKeyUp={releaseNote}
                setPressedKeys={setPressedKeys}
                playFn={playFn}
              />
            </>
          ))}
      </Box>
    </Box>
  );
}

export default PlayInterface;

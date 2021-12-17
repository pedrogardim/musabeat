import React, { useState, useEffect, Fragment } from "react";

import * as Tone from "tone";

import { Paper, IconButton, Typography, Icon, Box } from "@mui/material";

import "./NotesInput.css";

import { drumMapping } from "../../../assets/musicutils";

import Keyboard from "./Keyboard";

function NotesInput(props) {
  const [keyPage, setKeyPage] = useState(0);
  const handleClick = (event, i) => {
    props.playNoteFunction[0](i);
    props.setPressedKeys((prev) => [...prev, i]);
  };

  useEffect(() => {
    //getFilesName();
    /* setFilesLine(
      Array(props.instrument._buffers._buffers.size)
        .fill(0)
        .map((e, i) =>
          drawWave(props.instrument.player(JSON.stringify(i)).buffer.toArray())
        )
    ); */
  }, [props.track, props.instrument]);

  useEffect(() => {}, [props.pressedKeys]);

  return (
    <Box
      className="ws-note-input-key-cont"
      sx={(theme) => ({
        [theme.breakpoints.down("md")]: {
          height: 64,
        },
      })}
    >
      {props.track &&
        props.instrument &&
        props.trackRows.length > 0 &&
        (props.track.type === 0 ? (
          /* Array(props.instrument._buffers._buffers.size) */
          Object.keys(props.keyMapping)
            .filter((e, i) => (!keyPage ? i < 10 : i >= 10))
            .map((e) => e.replace("Key", "").replace("Semicolon", ":"))
            .map((e, i) => (
              <>
                <Paper
                  className="ws-note-input-key"
                  onMouseDown={(event) => handleClick(event, i)}
                  onMouseLeave={() =>
                    props.setPressedKeys((prev) =>
                      prev.filter((note) => note !== i)
                    )
                  }
                  onMouseLeave={() =>
                    props.setPressedKeys((prev) =>
                      prev.filter((note) => note !== i)
                    )
                  }
                  onClick={() =>
                    props.setPressedKeys((prev) =>
                      prev.filter((note) => note !== i)
                    )
                  }
                  elevation={
                    props.trackRows[i] &&
                    !props.instrument.has(props.trackRows[i].note)
                      ? 1
                      : 4
                  }
                  sx={(theme) => ({
                    bgcolor: props.pressedKeys.includes(i)
                      ? "darkgray"
                      : theme.palette.mode !== "dark" &&
                        props.trackRows[i] &&
                        !props.instrument.has(props.trackRows[i].note) &&
                        "lightgray",
                  })}
                >
                  {/* <Tooltip title={filesName && filesName[i]}>
                <svg
                  viewBox="0 0 64 32"
                  preserveAspectRatio="none"
                  width="64px"
                  height="32px"
                  style={{
                    width: "80%",
                    height: "20%",
                    viewBox: "auto",
                  }}
                  onClick={(e) => props.handlePageNav("file", filesId[i], e)}
                >
                  {filesLine[i] && (
                    <path
                      d={filesLine[i]}
                      stroke={colors[props.track.color][300]}
                      strokeWidth={1}
                      fill="none"
                    />
                  )}
                </svg> 
              </Tooltip> */}
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
                    {props.trackRows[i] && drumMapping[props.trackRows[i].note]}
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
                  props.setPlayingOctave((prev) => (prev < 6 ? prev + 1 : prev))
                }
              >
                <Icon>navigate_next</Icon>
              </IconButton>
              <IconButton
                onClick={() =>
                  props.setPlayingOctave((prev) => (prev > 0 ? prev - 1 : prev))
                }
              >
                <Icon>navigate_before</Icon>
              </IconButton>
            </div>
            <Keyboard
              activeNotes={props.pressedKeys}
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
              setPressedKeys={props.setPressedKeys}
              isMouseDown={props.isMouseDown}
            />
          </>
        ))}
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

export default NotesInput;

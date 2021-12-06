import React, { useState, useEffect, Fragment } from "react";

import * as Tone from "tone";

import { Paper, IconButton, Typography } from "@material-ui/core";

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
  }, [props.module, props.instrument]);

  useEffect(() => {}, [props.pressedKeys]);

  return (
    <div className="ws-note-input-key-cont">
      {props.module &&
      props.instrument &&
      props.moduleRows.length > 0 &&
      props.module.type === 0 ? (
        /* Array(props.instrument._buffers._buffers.size) */
        Object.keys(props.keyMapping)
          .filter((e, i) => (!keyPage ? i < 10 : i >= 10))
          .map((e) => e.replace("Key", "").replace("Semicolon", ":"))
          .map((e, i) => (
            <>
              <Paper
                className="ws-note-input-key"
                onMouseDown={(event) => handleClick(event, i)}
                onMouseOut={() =>
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
                style={{
                  backgroundColor: props.pressedKeys.includes(i)
                    ? "darkgray"
                    : !props.instrument.has(props.moduleRows[i].note) &&
                      "lightgray",
                }}
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
                      stroke={colors[props.module.color][300]}
                      strokeWidth={1}
                      fill="none"
                    />
                  )}
                </svg> 
              </Tooltip> */}
                <span
                  variant="overline"
                  style={{
                    position: "absolute",
                    left: 4,
                    top: 4,
                    lineHeight: 1,
                  }}
                >
                  {e}
                </span>
                <span style={{ lineHeight: 1.3 }}>
                  {props.instrumentInfo &&
                    drumMapping[props.moduleRows[i].note]}
                </span>
              </Paper>
              {i === 9 && <div className="break" />}
            </>
          ))
      ) : (
        <Keyboard
          activeNotes={props.pressedKeys}
          style={{
            minWidth: 400,
            height: 72,
            zIndex: 0,
          }}
          color={props.module.color}
          octaves={1.42}
          notesLabel={Object.keys(props.keyMapping).map((e) =>
            e.replace("Key", "").replace("Semicolon", ":")
          )}
          octave={props.playingOctave}
          onKeyClick={props.playNoteFunction[0]}
          onKeyUp={props.playNoteFunction[1]}
          setPressedKeys={props.setPressedKeys}
        />
      )}
    </div>
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

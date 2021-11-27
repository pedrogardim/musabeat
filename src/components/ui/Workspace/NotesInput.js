import React, { useState, useEffect, Fragment } from "react";
import { Helmet } from "react-helmet";

import firebase from "firebase";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";

import * as Tone from "tone";

import {
  Icon,
  IconButton,
  Typography,
  Tooltip,
  Avatar,
  Chip,
  Button,
  MenuItem,
  Select,
} from "@material-ui/core";

import { Skeleton } from "@material-ui/lab";

import { colors } from "../../../utils/materialPalette";

import {
  detectPitch,
  fileTypes,
  fileExtentions,
} from "../../../assets/musicutils";

import "./NotesInput.css";

function NotesInput(props) {
  const [keyPage, setKeyPage] = useState(0);
  const [filesName, setFilesName] = useState(null);
  const [filesId, setFilesId] = useState(null);
  const [filesLine, setFilesLine] = useState([]);

  const handleClick = (event, i) => {
    if (!props.instrument.has(i)) return;
    props.instrument.player(i).start();
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

  return (
    <div className="ws-note-input-key-cont">
      {props.module &&
        props.module.type === 0 &&
        props.instrument &&
        /* Array(props.instrument._buffers._buffers.size) */
        Object.keys(props.keyMapping)
          //.filter((e, i) => (!keyPage ? i < 10 : i >= 10))
          .map((e) => e.replace("Key", "").replace("Semicolon", ":"))
          .map((e, i) => (
            <Fragment>
              <div
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
                    : !props.instrument.has(i) && "lightgray",
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
                <Typography
                  variant="overline"
                  style={{
                    position: "absolute",
                    left: 4,
                    top: 4,
                    lineHeight: 1,
                  }}
                >
                  {e}
                </Typography>
                <Typography variant="overline" style={{ lineHeight: 1.3 }}>
                  {props.module.lbls && props.module.lbls[i]}
                </Typography>
              </div>
              {i === 9 && <div className="break" />}
            </Fragment>
          ))}
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

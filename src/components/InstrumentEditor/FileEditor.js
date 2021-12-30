import React, { useEffect, useState } from "react";
import { labels } from "../../assets/drumkits";

import {
  drumMapping,
  fileExtentions,
  fileTags,
  soundChannels,
} from "../../assets/musicutils";

import * as Tone from "tone";

import "./FileEditor.css";

import {
  IconButton,
  Icon,
  Typography,
  Tooltip,
  Grid,
  Button,
  Box,
  Dialog,
  Divider,
} from "@mui/material";

import { useTranslation } from "react-i18next";

import FileExplorer from "../ui/FileExplorer/FileExplorer";

import cymImg from "../../../src/assets/img/cym.svg";
import kdImg from "../../../src/assets/img/kd.svg";
import sdImg from "../../../src/assets/img/sd.svg";
import percImg from "../../../src/assets/img/perc.svg";
import chhImg from "../../../src/assets/img/chh.svg";
import ohhImg from "../../../src/assets/img/ohh.svg";
import tambImg from "../../../src/assets/img/tamb.svg";
import tomImg from "../../../src/assets/img/tom.svg";
import clapImg from "../../../src/assets/img/clap.svg";

const drumImgMag = [
  kdImg,
  kdImg,
  sdImg,
  sdImg,
  sdImg,
  clapImg,
  chhImg,
  ohhImg,
  chhImg,
  tomImg,
  tomImg,
  tomImg,
  tomImg,
  cymImg,
  cymImg,
  cymImg,
  cymImg,
  cymImg,
  tambImg,
  percImg,
];

const tagTypeMapping = {
  0: 5,
  1: 5,
  2: 6,
  3: 6,
  4: 6,
  5: 7,
  6: 8,
  7: 9,
  8: 10,
  9: 11,
  10: 12,
  11: 13,
  12: 14,
  13: 15,
  14: 15,
  15: 16,
  16: 16,
  17: 17,
  18: 18,
  19: 19,
};

function FileEditor(props) {
  const { t } = useTranslation();

  const [wavePath, setWavePath] = useState("");

  const handleClick = (e) => {
    if (props.exists) props.instrument.player(props.index).start();
    /* if (
      e.target.className.includes &&
      !e.target.className.includes("Typography")
    ) {
      if (props.exists) props.instrument.player(props.index).start();
    } */
  };

  useEffect(
    () => props.buffer && drawWave(props.buffer.toArray(), setWavePath),
    [props.buffer, props.exists, props.instrument]
  );

  //console.log("props.exists", props.exists);

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      PaperProps={{
        style: {
          display: "flex",
          flexWrap: "nowrap",
          flexDirection: "row",
          height: "60%",
        },
      }}
      maxWidth="lg"
      fullWidth
    >
      {!(props.exists && props.instrument.name === "Sampler") && (
        <>
          <Box className="file-editor-column">
            <FileExplorer
              compact
              fileEditor
              setInstrumentLoaded={props.setInstrumentLoaded}
              handlePageNav={props.handlePageNav}
              tags={
                !props.instrument.name === "Sampler" && props.isDrum
                  ? [fileTags[tagTypeMapping[props.index]]]
                  : []
              }
              instrument={props.instrument}
              onFileClick={props.onFileClick}
              onClose={props.onClose}
              item={props.index}
            />
          </Box>
          <Divider flexItem orientation="vertical" />
        </>
      )}
      <Box className="file-editor-column">
        {props.exists && (
          <>
            <Box
              className="drum-component-waveform"
              style={{
                minHeight: 128,
                maxHeight: 128,
                height: 128,
                width: 256,
              }}
            >
              <svg
                className="dc-audio-file-item-waveform"
                style={{
                  minHeight: 128,
                  maxHeight: 128,
                  height: 128,
                  width: 256,
                }}
                height={128}
                width={256}
                preserveAspectRatio="none"
              >
                <path d={wavePath} stroke="#3f51b5" fill="none" />
              </svg>
            </Box>
            <Typography variant="body1">
              {props.exists
                ? props.fileInfo.name +
                  "." +
                  fileExtentions[props.fileInfo.type]
                : props.isDrum
                ? drumMapping[props.index]
                : "Empty"}
            </Typography>
            <Grid
              container
              spacing={1}
              direction="row"
              wrap="nowrap"
              className="file-info"
              component={Box}
            >
              <div className="file-info-card">
                <Typography variant="body1">
                  {soundChannels[props.buffer.numberOfChannels] ||
                    props.buffer.numberOfChannels ||
                    "Multichannel"}
                  <br />
                  {props.buffer.sampleRate + " Hz"}
                </Typography>
              </div>
              <Divider orientation="vertical" flexItem />

              <div className="file-info-card">
                <Typography variant="body1">
                  {formatBytes(props.fileInfo.size)}
                </Typography>
              </div>
              <Divider orientation="vertical" flexItem />

              <div className="file-info-card">
                <Typography variant="body1">
                  {props.fileInfo.dur + " s"}
                </Typography>
              </div>
            </Grid>
          </>
        )}
        {!(props.exists && props.instrument.name === "Sampler") && (
          <Box>
            <Button onClick={() => {}}>Upload File</Button>
            <Button color="secondary" onClick={() => {}}>
              Record
            </Button>
          </Box>
        )}
      </Box>
      <IconButton
        onClick={props.onClose}
        className="mp-closebtn"
        color="primary"
      >
        <Icon>close</Icon>
      </IconButton>
    </Dialog>
  );
}

const drawWave = (wavearray, setWavePath) => {
  if (!wavearray.length) {
    return;
  }
  //console.log(wavearray);
  let pathstring = "M 0 64 ";

  let wave = wavearray.filter((e) => Math.abs(e) > 0.005);
  let scale = wave.length / 256;

  for (let x = 0; x < 256; x++) {
    pathstring +=
      "L " + x + " " + (wave[Math.floor(x * scale)] * 64 + 64) + " ";
  }

  setWavePath(pathstring);
};

function formatBytes(a, b = 2) {
  if (0 === a) return "0 Bytes";
  const c = 0 > b ? 0 : b,
    d = Math.floor(Math.log(a) / Math.log(1024));
  return (
    parseFloat((a / Math.pow(1024, d)).toFixed(c)) +
    " " +
    ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][d]
  );
}

export default FileEditor;

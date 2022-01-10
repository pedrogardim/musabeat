import React, { useEffect, useState } from "react";

import { fileExtentions, soundChannels } from "../../../services/Audio";

import { drumMapping, fileTags } from "../../../services/MiscData";

import "./style.css";

import {
  IconButton,
  Icon,
  Typography,
  Grid,
  Button,
  Box,
  Dialog,
  Divider,
} from "@mui/material";

import { useTranslation } from "react-i18next";

import ListExplorer from "../../ListExplorer";

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

  const {
    audioTrack,
    open,
    onClose,
    exists,
    instrument,
    onFileClick,
    setInstrumentLoaded,
    index,
    handleFileDelete,
    buffer,
    fileInfo,
    fileId,
    isDrum,
    handlePageNav,
  } = props;

  const [wavePath, setWavePath] = useState("");

  const handleClick = (e) => {
    if (exists) instrument.player(index).start();
    /* if (
      e.target.className.includes &&
      !e.target.className.includes("Typography")
    ) {
      if (exists) instrument.player(index).start();
    } */
  };

  useEffect(
    () => buffer && drawWave(buffer.toArray(), setWavePath),
    [buffer, exists, instrument]
  );

  //console.log("exists", exists);

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
      {!(exists && instrument.name === "Sampler") && (
        <>
          <Box className="file-editor-column">
            <ListExplorer
              type="files"
              compact
              fileEditor
              audioTrack={audioTrack}
              setInstrumentLoaded={setInstrumentLoaded}
              handlePageNav={handlePageNav}
              tags={
                !instrument.name === "Sampler" && isDrum
                  ? [fileTags[tagTypeMapping[index]]]
                  : []
              }
              instrument={instrument}
              onFileClick={onFileClick}
              onClose={onClose}
              item={index}
            />
          </Box>
          <Divider flexItem orientation="vertical" />
        </>
      )}
      <Box className="file-editor-column">
        {exists && (
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
              {exists
                ? fileInfo.name + "." + fileExtentions[fileInfo.type]
                : isDrum
                ? drumMapping[index]
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
                  {soundChannels[buffer.numberOfChannels] ||
                    buffer.numberOfChannels ||
                    "Multichannel"}
                  <br />
                  {buffer.sampleRate + " Hz"}
                </Typography>
              </div>
              <Divider orientation="vertical" flexItem />

              <div className="file-info-card">
                <Typography variant="body1">
                  {formatBytes(fileInfo.size)}
                </Typography>
              </div>
              <Divider orientation="vertical" flexItem />

              <div className="file-info-card">
                <Typography variant="body1">{fileInfo.dur + " s"}</Typography>
              </div>
            </Grid>
          </>
        )}
        {!(exists && instrument.name === "Sampler") && (
          <Box>
            <Button onClick={() => {}}>Upload File</Button>
            {!audioTrack && (
              <Button color="secondary" onClick={() => {}}>
                Record
              </Button>
            )}
            <div className="break" />
            <Typography>Or Drag and Drop It</Typography>
          </Box>
        )}
      </Box>
      <IconButton onClick={onClose} className="mp-closebtn" color="primary">
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

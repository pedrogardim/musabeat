import React, { useEffect, useState, useRef } from "react";

import * as Tone from "tone";

import { encodeAudioFile } from "../../../../services/Audio";

import { IconButton, Icon, Typography, Box, Paper } from "@mui/material";

import { checkPremium } from "../../../../services/backendCheckers";

import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/styles";

import useAudioRec from "../../../../hooks/useAudioRec";

function FileEditor(props) {
  const { t } = useTranslation();

  const {
    instrumentEditor,
    audioTrack,
    exists,
    instrument,
    setInstrumentLoaded,
    index,
    buffer,
    fileInfo,
    isDrum,
    handlePageNav,
    uploadFile,
    setFile,
    newFileName,
  } = props.inspectorProps;

  const { onClose } = props;

  const contRef = useRef(null);
  const canvasRef = useRef(null);

  const theme = useTheme();

  const [recordedFile, setRecordedFile] = useState(null);
  const [trimPositions, setTrimPositions] = useState([0, 1]);
  const [draggingHandle, setDraggingHandle] = useState(null);

  const {
    isRecording,
    recStart,
    recStop,
    meterLevel,
    recordingBuffer,
    recOpen,
  } = useAudioRec(true);

  const toggleRec = () => {
    isRecording
      ? recStop((a, b) => setRecordedFile([a, b]))
      : recStart(newFileName ? newFileName : "Audio");
  };

  const saveChanges = () => {
    const slicedTimes = trimPositions
      .map((e) => e * (recordedFile[1] || buffer).duration)
      .map((e) => parseFloat(e.toFixed(3)));

    console.log(slicedTimes);

    if (recordedFile) {
      const trimmedFileBuffer = new Tone.ToneAudioBuffer(recordedFile[1])
        .slice(...slicedTimes)
        .get();
      const finalFile = encodeAudioFile(
        trimmedFileBuffer,
        checkPremium() ? "wav" : "mp3"
      );

      uploadFile(finalFile, trimmedFileBuffer, (id, data) => {
        setFile(id, null, trimmedFileBuffer, data);
      });
    }
  };

  const onHandleDrag = (xPos) => {
    let value =
      (xPos - contRef.current.getBoundingClientRect().left) /
      contRef.current.offsetWidth;

    value = value > 1 ? 1 : value < 0 ? 0 : value;

    setTrimPositions((prev) => {
      let pos = [...prev];
      pos[draggingHandle === "left" ? 0 : 1] = value;
      return pos;
    });

    //console.log(value);
  };

  useEffect(() => {
    if ((exists || isRecording) && canvasRef.current)
      drawClipWave(
        !isRecording ? buffer.toArray(0) : recordingBuffer,
        canvasRef,
        theme.palette[!isRecording ? "primary" : "secondary"].main
      );
  }, [canvasRef.current, recordingBuffer, isRecording]);

  return (
    <Box
      onClose={onClose}
      sx={{
        height: "100%",
        width: "100%",
        position: "absolute",
        bgcolor: "background.default",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Paper
        sx={{
          height: 56,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <IconButton onClick={onClose}>
          <Icon>chevron_left</Icon>
        </IconButton>

        <Box style={{ margin: "auto" }}>
          <IconButton onClick={() => instrument.player([index]).start()}>
            <Icon>play_arrow</Icon>
          </IconButton>
          <IconButton onClick={toggleRec} color="secondary">
            <Icon>fiber_manual_record</Icon>
          </IconButton>
        </Box>
        {(exists || recordedFile) && (
          <IconButton onClick={saveChanges}>
            <Icon>done</Icon>
          </IconButton>
        )}
      </Paper>

      <Box
        sx={{ flex: "1", display: "flex", overflow: "hidden" }}
        ref={contRef}
      >
        {contRef.current && (
          <>
            {/* <div
              style={{
                width: 16,
                height: contRef.current.offsetHeight * meterLevel,
                backgroundColor: "transparent",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: 16,
                height: contRef.current.offsetHeight * meterLevel,
                bottom: 0,
                backgroundColor: "#3f51b5",
              }}
            /> */}
            {!isRecording && recordedFile && (
              <>
                <Box
                  sx={{
                    position: "absolute",
                    height: "100%",
                    left: 0,
                    minWidth: 4,
                    width: trimPositions[0] * 100 + "%",
                    bgcolor: "#000000",
                    opacity: 0.5,
                  }}
                >
                  <Box
                    className="ws-ruler-zoom-cont-handle"
                    sx={{
                      right: 0,
                    }}
                    onMouseDown={() => setDraggingHandle("left")}
                  />
                </Box>
                <Box
                  sx={{
                    position: "absolute",
                    height: "100%",
                    right: 0,
                    minWidth: 4,
                    bgcolor: "text.secondary.light",
                    width: (1 - trimPositions[1]) * 100 + "%",
                    bgcolor: "#000000",
                    opacity: 0.5,
                  }}
                >
                  <Box
                    className="ws-ruler-zoom-cont-handle"
                    sx={{
                      left: 0,
                    }}
                    onMouseDown={() => setDraggingHandle("right")}
                  />
                </Box>
              </>
            )}
            <Paper
              style={{
                flex: "1",
                borderRadius: 0,
                boxShadow: "none",
              }}
              elevation={22}
            >
              <canvas
                style={{
                  height: "100%",
                  width: "100%",
                }}
                ref={canvasRef}
              />
            </Paper>
          </>
        )}
      </Box>
      {draggingHandle && (
        <div
          className="knob-backdrop"
          style={{ cursor: "ew-resize" }}
          onMouseMove={(e) => onHandleDrag(e.pageX)}
          onMouseUp={() => setDraggingHandle(null)}
          onMouseOut={() => setDraggingHandle(null)}
        />
      )}
    </Box>
  );
}

const drawClipWave = (waveArray, canvasRef, color) => {
  //if (clipHeight === 0 || clipWidth === 0) return;

  const canvas = canvasRef.current;
  canvas.height = canvas.offsetHeight;
  canvas.width = canvas.offsetWidth;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  //console.log(canvas.width);

  let xScale = waveArray.length / canvas.width;
  let yScale = 1;

  ctx.fillStyle = color;

  for (let x = 0; x < canvas.width; x++) {
    let rectHeight =
      Math.abs(Math.floor(waveArray[Math.floor(x * xScale)] * canvas.height)) *
      yScale;

    //console.log("rect");
    ctx.fillRect(x, canvas.height / 2 - rectHeight / 2, 1, rectHeight);
  }
};

export default FileEditor;

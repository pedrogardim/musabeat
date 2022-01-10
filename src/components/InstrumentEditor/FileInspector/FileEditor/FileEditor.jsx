import React, { useEffect, useState, useRef } from "react";

import { IconButton, Icon, Typography, Box, Paper } from "@mui/material";

import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/styles";

import useAudioRec from "../../../../hooks/useAudioRec";

function FileEditor(props) {
  const { t } = useTranslation();

  const {
    audioTrack,
    exists,
    instrument,
    onFileClick,
    setInstrumentLoaded,
    index,
    buffer,
    fileInfo,
    isDrum,
    handlePageNav,
  } = props.inspectorProps;

  const { onClose } = props;

  const contRef = useRef(null);
  const canvasRef = useRef(null);

  const theme = useTheme();

  const { isRecording, recStart, recStop, meterLevel, recordingBuffer } =
    useAudioRec();

  const toggleRec = () => {
    isRecording ? recStop() : recStart();
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
        <IconButton style={{ left: 8 }} onClick={onClose}>
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
            <canvas
              style={{
                height: "100%",
                flex: "1",
              }}
              ref={canvasRef}
            />
          </>
        )}
      </Box>
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

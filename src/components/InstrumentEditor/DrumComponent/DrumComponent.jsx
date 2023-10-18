import React, { useEffect, useState } from "react";

import {
  IconButton,
  Icon,
  Typography,
  Tooltip,
  Paper,
  Grid,
  ButtonBase,
  Box,
} from "@mui/material";

import "./style.css";

import { useTranslation } from "react-i18next";

import { drumMapping } from "../../../services/MiscData";
import { fileExtentions } from "../../../services/Audio";

import { drumIconsSequence } from "../../../assets/img/DrumIcons";

function DrumComponent(props) {
  const { t } = useTranslation();

  const {
    buffer,
    exists,
    instrument,
    index,
    isDrum,
    fileId,
    fileLabel,
    fileInfo,
    handleFileDelete,
    handleFileClick,
  } = props;

  const [wavePath, setWavePath] = useState("");

  const handleClick = (e) => {
    if (!exists) {
      handleFileClick();
    }
    if (
      ((e.target.className.includes &&
        !e.target.className.includes("audio-file-item-label")) ||
        !e.target.className.includes) &&
      exists
    ) {
      instrument.player(index).start();
    }
  };

  useEffect(
    () => buffer && drawWave(buffer.toArray(0), setWavePath),
    [buffer, exists, instrument]
  );

  return (
    <Grid xs={4} sm={4} md={4} lg={4} item>
      <ButtonBase
        fullWidth={true}
        elevation={!exists ? 0 : 2}
        component={Paper}
        onClick={handleClick}
        className="drum-component"
        style={{ backgroundColor: !exists && "rgba(0,0,0,0.05)" }}
      >
        {!isDrum ? (
          <Typography
            variant="body1"
            color="textPrimary"
            className="dc-slot-indicator"
          >
            {index + 1}
          </Typography>
        ) : (
          exists && (
            <Box
              component="img"
              sx={(theme) => ({
                filter: theme.palette.mode === "dark" && "invert(1)",
              })}
              className="dc-img-corner"
              src={drumIconsSequence[index]}
            />
          )
        )}

        {(exists || isDrum) && (
          <Box
            className="drum-component-waveform"
            sx={(theme) => ({
              display: "flex",
              [theme.breakpoints.down("md")]: {
                display: "none",
              },
            })}
          >
            {exists ? (
              <svg className="dc-audio-file-item-waveform" viewBow="0 0 64 32">
                <path d={wavePath} stroke="#3f51b5" fill="none" />
              </svg>
            ) : (
              isDrum && (
                <Box
                  component="img"
                  sx={(theme) => ({
                    filter: theme.palette.mode === "dark" && "invert(1)",
                  })}
                  className="dc-img-centered"
                  src={drumIconsSequence[index]}
                />
              )
            )}
          </Box>
        )}

        <Typography
          variant="body1"
          color="textPrimary"
          className="audio-file-item-label"
          onClick={handleFileClick}
        >
          {exists
            ? fileInfo.name + "." + fileExtentions[fileInfo.type]
            : isDrum
            ? drumMapping[index]
            : "Empty"}
        </Typography>

        {exists && (
          <Tooltip title="Remove file from instrument">
            <IconButton
              className="remove-drum-component-button"
              onClick={() => handleFileDelete(fileId, fileLabel, index)}
            >
              <Icon style={{ fontSize: 18 }}>close</Icon>
            </IconButton>
          </Tooltip>
        )}
      </ButtonBase>
    </Grid>
  );
}

const drawWave = (wavearray, setWavePath) => {
  if (!wavearray.length) {
    return;
  }
  //console.log(wavearray);
  let pathstring = "M 0 32 ";

  let wave = wavearray.filter((e) => Math.abs(e) > 0.005);
  let scale = wave.length / 128;

  for (let x = 0; x < 128; x++) {
    pathstring +=
      "L " + x + " " + (wave[Math.floor(x * scale)] * 32 + 32) + " ";
  }

  setWavePath(pathstring);
};

export default DrumComponent;

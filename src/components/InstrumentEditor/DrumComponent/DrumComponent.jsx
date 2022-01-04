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

  const [wavePath, setWavePath] = useState("");

  const handleClick = (e) => {
    if (
      ((e.target.className.includes &&
        !e.target.className.includes("audio-file-item-label")) ||
        !e.target.className.includes) &&
      props.exists
    ) {
      props.instrument.player(props.index).start();
    }
  };

  useEffect(
    () => props.buffer && drawWave(props.buffer.toArray(), setWavePath),
    [props.buffer, props.exists, props.instrument]
  );

  return (
    <Grid xs={4} sm={4} md={4} lg={4} item>
      <ButtonBase
        fullWidth={true}
        elevation={!props.exists ? 0 : 2}
        component={Paper}
        onClick={handleClick}
        className="drum-component"
        style={{ backgroundColor: !props.exists && "rgba(0,0,0,0.05)" }}
      >
        {!props.isDrum ? (
          <Typography
            variant="body1"
            color="textPrimary"
            className="dc-slot-indicator"
          >
            {props.index + 1}
          </Typography>
        ) : (
          props.exists && (
            <Box
              component="img"
              sx={(theme) => ({
                filter: theme.palette.mode === "dark" && "invert(1)",
              })}
              className="dc-img-corner"
              src={drumIconsSequence[props.index]}
            />
          )
        )}

        {(props.exists || props.isDrum) && (
          <Box
            className="drum-component-waveform"
            sx={(theme) => ({
              display: "flex",
              [theme.breakpoints.down("md")]: {
                display: "none",
              },
            })}
          >
            {props.exists ? (
              <svg className="dc-audio-file-item-waveform" viewBow="0 0 64 32">
                <path d={wavePath} stroke="#3f51b5" fill="none" />
              </svg>
            ) : (
              props.isDrum && (
                <Box
                  component="img"
                  sx={(theme) => ({
                    filter: theme.palette.mode === "dark" && "invert(1)",
                  })}
                  className="dc-img-centered"
                  src={drumIconsSequence[props.index]}
                />
              )
            )}
          </Box>
        )}

        <Typography
          variant="body1"
          color="textPrimary"
          className="audio-file-item-label"
          onClick={props.handleFileClick}
        >
          {props.exists
            ? props.fileInfo.name + "." + fileExtentions[props.fileInfo.type]
            : props.isDrum
            ? drumMapping[props.index]
            : "Empty"}
        </Typography>

        <Tooltip title="Remove file from instrument">
          <IconButton
            className="remove-drum-component-button"
            onClick={() =>
              props.handleFileDelete(props.fileId, props.fileLabel, props.index)
            }
          >
            <Icon style={{ fontSize: 18 }}>close</Icon>
          </IconButton>
        </Tooltip>
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

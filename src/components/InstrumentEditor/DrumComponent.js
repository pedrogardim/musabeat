import React, { useEffect, useState } from "react";
import { labels } from "../../assets/drumkits";

import { drumMapping, fileExtentions } from "../../assets/musicutils";

import * as Tone from "tone";

import "./DrumComponent.css";

import {
  ListItem,
  ListItemText,
  IconButton,
  Icon,
  ListItemSecondaryAction,
  Typography,
  Tooltip,
  Paper,
  Grid,
  ButtonBase,
} from "@mui/material";

import { useTranslation } from "react-i18next";

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

function DrumElement(props) {
  const { t } = useTranslation();

  const [wavePath, setWavePath] = useState("");

  const handleClick = (e) => {
    if (
      e.target.className.includes &&
      e.target.className.includes("drum-component")
    ) {
      if (props.exists) props.instrument.player(props.index).start();
    }
  };

  useEffect(
    () => props.buffer && drawWave(props.buffer.toArray(), setWavePath),
    [props.buffer, props.exists, props.instrument]
  );

  return (
    <Grid xs={3} sm={3} md={3} lg={3} item>
      <ButtonBase
        fullWidth={true}
        elevation={!props.exists ? 0 : 2}
        component={Paper}
        onClick={handleClick}
        className="drum-component"
        style={{ backgroundColor: !props.exists && "rgba(0,0,0,0.05)" }}
      >
        {!props.isDrum ? (
          <span className="dc-slot-indicator">{props.index + 1}</span>
        ) : (
          props.exists && (
            <img className="dc-img-corner" src={drumImgMag[props.index]} />
          )
        )}

        {(props.exists || props.isDrum) && (
          <div
            style={{
              position: "relative",
              width: 128,
              height: 64,
              minHeight: 64,
              marginBottom: 16,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flex: "0 0",
            }}
          >
            {props.exists ? (
              <svg
                onClick={props.openFilePage}
                className="dc-audio-file-item-waveform"
                viewBow="0 0 64 32"
              >
                <path d={wavePath} stroke="#3f51b5" fill="none" />
              </svg>
            ) : (
              props.isDrum && (
                <img
                  className={"dc-img-centered"}
                  src={drumImgMag[props.index]}
                />
              )
            )}
          </div>
        )}

        <Typography
          variant="body1"
          color="textPrimary"
          /* onClick={() =>
          props.instrument.name === "Players" &&
          props.setRenamingLabel(props.index)
        } */
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

export default DrumElement;

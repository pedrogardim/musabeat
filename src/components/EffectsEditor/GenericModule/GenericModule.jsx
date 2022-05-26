import React, { useState, useEffect, useRef, useContext } from "react";

import * as Tone from "tone";

import { fxParam } from "../../../services/Effects";

import wsCtx from "../../../context/SessionWorkspaceContext";

import {
  List,
  ListItem,
  Box,
  Icon,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  ListItemText,
  ListItemIcon,
} from "@mui/material";

import Knob from "../../Knob";

import "./style.css";

function GenericModule(props) {
  const wsCtxData = useContext(wsCtx);

  const {
    tracks,
    instruments,
    setTracks,
    setInstruments,
    setInstrumentsLoaded,
    instrumentsInfo,
    setInstrumentsInfo,
    params,
    paramSetter,
    uploadFile,
    effects,
    setEffects,
  } = /* props.workspace ? wsCtxData : props */ wsCtxData;

  const { selectedTrack } = params;

  const { selectedEffect, onEffectMod } = props;

  const selTrackId = tracks[selectedTrack].id;

  const instrument = instruments[selectedTrack];

  const effect = effects[selTrackId][selectedEffect];

  const fxType = tracks[selectedTrack].fx[selectedEffect].ty;

  const parametersKeys = Object.keys(fxParam[fxType]).filter(
    (e) => e !== "name"
  );

  const handleParamSelect = (param, value) => {
    effect.set({ [param]: value });
  };

  return (
    <Box className="generic-effect-module">
      {parametersKeys.map((param) => (
        <Knob
          defaultValue={effect.get()[param]}
          onChange={(v) => handleParamSelect(param, v)}
          onChangeCommitted={onEffectMod}
          style={{ margin: 32 }}
          min={fxParam[fxType][param][0]}
          max={fxParam[fxType][param][1]}
          step={fxParam[fxType][param][2]}
          size={48}
          label={param}
        />
      ))}
    </Box>
  );
}

export default GenericModule;

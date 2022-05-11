import React, { useState, useEffect, useRef, useContext } from "react";

import * as Tone from "tone";

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
  ListItemButton,
  ListItemIcon,
} from "@mui/material";

import { useTranslation } from "react-i18next";

import { fxParam } from "../../services/Effects";

import wsCtx from "../../context/SessionWorkspaceContext";

import "./style.css";

function EffectsEditor(props) {
  const { t } = useTranslation();

  const wsCtxData = useContext(wsCtx);

  const [draggingOver, setDraggingOver] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);

  const [selectedEffect, setSelectedEffect] = useState(null);

  const feWrapper = useRef(null);

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
  } = props.workspace ? wsCtxData : props;

  const { selectedTrack } = params;

  const selTrackId = tracks[selectedTrack].id;

  const addEffect = (type) => {
    let newFX = new Tone[fxParam[type].name]();
    setTracks((prev) => {
      let newTracks = [...prev];
      let fxData = { ty: type, ...newFX.get() };
      newTracks[selectedTrack].fx.push(fxData);
      return newTracks;
    });
    setEffects((prev) => {
      let trackNewEffects = prev[selTrackId]
        ? [...prev[selTrackId], newFX]
        : [newFX];
      console.log(instruments[selectedTrack], trackNewEffects);
      instruments[selectedTrack].chain(...trackNewEffects, Tone.Destination);
      return { ...prev, [selTrackId]: trackNewEffects };
    });
  };

  const removeEffect = (index) => {
    setTracks((prev) => {
      let newTracks = [...prev];
      newTracks[selectedTrack].fx = newTracks[selectedTrack].fx.filter(
        (e, i) => i !== index
      );
      return newTracks;
    });
    setEffects((prev) => {
      prev[selTrackId][index].dispose();
      let trackNewEffects = prev[selTrackId].filter((e, i) => i !== index);
      instruments[selectedTrack].chain(...trackNewEffects, Tone.Destination);
      return { ...prev, [selTrackId]: trackNewEffects };
    });
  };

  return (
    <Box
      sx={{ bgcolor: "background.default" }}
      className="effects-editor"
      onDragEnter={() => {
        setDraggingOver(true);
        feWrapper.current.scrollTop = 0;
      }}
      ref={feWrapper}
    >
      <List sx={{ width: "192px", height: "100%" }}>
        {tracks[selectedTrack].fx.map((fx, i) => (
          <>
            <ListItem
              divider
              button
              onClick={() => setSelectedEffect(i)}
              secondaryAction={
                <IconButton edge="end" onClick={() => removeEffect(i)}>
                  <Icon>delete</Icon>
                </IconButton>
              }
            >
              <ListItemText
                sx={{ color: "text.primary" }}
                primary={fxParam[fx.ty].name}
              />
            </ListItem>
            <Divider flexItem />
          </>
        ))}
        <IconButton onClick={(e) => setMenuOpen(e.target)}>
          <Icon>add</Icon>
        </IconButton>
      </List>
      <Divider orientation="vertical" flexItem />
      <Box></Box>
      <Menu
        open={Boolean(menuOpen)}
        anchorEl={menuOpen}
        onClose={() => setMenuOpen(null)}
      >
        {Object.values(fxParam).map((fx, i) => (
          <MenuItem onClick={() => addEffect(Object.keys(fxParam)[i])}>
            {fx.name}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}

export default EffectsEditor;

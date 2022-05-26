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
  ListItemIcon,
  ListItemButton,
} from "@mui/material";

import { useTranslation } from "react-i18next";

import { fxParam } from "../../services/Effects";

import GenericModule from "./GenericModule";

import wsCtx from "../../context/SessionWorkspaceContext";

import Confirm from "../dialogs/Confirm";

import "./style.css";

function EffectsEditor(props) {
  const { t } = useTranslation();

  const wsCtxData = useContext(wsCtx);

  const [draggingOver, setDraggingOver] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);

  const [selectedEffect, setSelectedEffect] = useState(null);
  const [deletingEffect, setDeletingEffect] = useState(null);

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

  const { resetHistory } = props;

  const { selectedTrack } = params;

  const selTrackId = tracks[selectedTrack].id;

  const addEffect = (type) => {
    let newFX = new Tone[fxParam[type].name]();
    setTracks((prev) => {
      let newTracks = [...prev];
      let fxData = { ty: type, bp: false, ...newFX.get() };
      newTracks[selectedTrack].fx.push(fxData);
      return newTracks;
    });
    setEffects((prev) => {
      let trackNewEffects = prev[selTrackId]
        ? [...prev[selTrackId], newFX]
        : [newFX];
      /* console.log(instruments[selectedTrack], trackNewEffects);
      instruments[selectedTrack].chain(
        ...trackNewEffects.filter((fx, i) => !tracks[selectedTrack].fx[i].bp),
        Tone.Destination
      ); */
      return { ...prev, [selTrackId]: trackNewEffects };
    });

    setMenuOpen(null);
  };

  const removeEffect = (index) => {
    let newTracks = [];

    resetHistory();
    setSelectedEffect(null);
    setTracks((prev) => {
      newTracks = [...prev];
      newTracks[selectedTrack].fx = newTracks[selectedTrack].fx.filter(
        (e, i) => i !== index
      );
      return newTracks;
    });
    setEffects((prev) => {
      prev[selTrackId][index].dispose();
      let trackNewEffects = prev[selTrackId].filter((e, i) => i !== index);
      /* instruments[selectedTrack].chain(
        ...trackNewEffects.filter(
          (fx, i) => !newTracks[selectedTrack].fx[i].bp
        ),
        Tone.Destination
      ); */
      return { ...prev, [selTrackId]: trackNewEffects };
    });
  };

  const toggleBypassEffect = (index) => {
    setTracks((prev) => {
      let newTracks = [...prev];
      newTracks[selectedTrack].fx[index].bp =
        !newTracks[selectedTrack].fx[index].bp;

      instruments[selectedTrack].disconnect();

      instruments[selectedTrack].chain(
        ...effects[selTrackId].filter(
          (fx, i) => !newTracks[selectedTrack].fx[i].bp
        ),
        Tone.Destination
      );

      return newTracks;
    });
  };

  const onEffectMod = () => {
    let newFxOptions = effects[selTrackId][selectedEffect].get();
    delete newFxOptions.context;

    setTracks((prev) => {
      let newTracks = [...prev];
      newTracks[selectedTrack].fx[selectedEffect] = {
        ...newTracks[selectedTrack].fx[selectedEffect],
        ...newFxOptions,
      };
      return newTracks;
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
      <List
        sx={{
          width: "192px",
          height: "100%",
        }}
      >
        {tracks[selectedTrack].fx.map((fx, i) => (
          <>
            <ListItem
              divider
              /* button */
              disabled={fx.bp}
              secondaryAction={
                <IconButton edge="end" onClick={() => setDeletingEffect(i)}>
                  <Icon>delete</Icon>
                </IconButton>
              }
            >
              <IconButton onClick={(e) => toggleBypassEffect(i)}>
                <Icon>power_settings_new</Icon>
              </IconButton>
              <ListItemButton
                onClick={() =>
                  setSelectedEffect((prev) => (prev == i ? null : i))
                }
                disableGutters
                style={{ paddingRight: 8 }}
                sx={{ px: 1 }}
              >
                <ListItemText
                  sx={{
                    color:
                      selectedEffect === i
                        ? "primary.light"
                        : fx.bp
                        ? "text.disabled"
                        : "text.primary",
                  }}
                  primary={t(`effects.${fx.ty}`)}
                />
              </ListItemButton>
            </ListItem>
          </>
        ))}
        <IconButton
          onClick={(e) => setMenuOpen(e.target)}
          style={{ left: "50%", marginLeft: -24 }}
        >
          <Icon>add</Icon>
        </IconButton>
      </List>
      <Divider orientation="vertical" flexItem />
      {typeof selectedEffect === "number" && (
        <GenericModule
          selectedEffect={selectedEffect}
          onEffectMod={onEffectMod}
        />
      )}
      <Menu
        open={Boolean(menuOpen)}
        anchorEl={menuOpen}
        onClose={() => setMenuOpen(null)}
      >
        {Object.values(fxParam).map((fx, i) => (
          <MenuItem onClick={() => addEffect(Object.keys(fxParam)[i])}>
            {t(`effects.${Object.keys(fxParam)[i]}`)}
          </MenuItem>
        ))}
      </Menu>

      <IconButton
        onClick={() => paramSetter("openSubPage", null)}
        className="mp-closebtn"
        color="primary"
        sx={{ zIndex: 9 }}
      >
        <Icon>close</Icon>
      </IconButton>

      <Confirm
        delete
        action={() => removeEffect(deletingEffect)}
        open={typeof deletingEffect === "number"}
        onClose={() => setDeletingEffect(null)}
      />
    </Box>
  );
}

export default EffectsEditor;

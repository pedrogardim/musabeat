import React, { useEffect, useState, Fragment } from "react";
import * as Tone from "tone";

import {
  IconButton,
  Icon,
  Menu,
  MenuItem,
  CircularProgress,
} from "@material-ui/core";
import { clearEvents } from "../../utils/TransportSchedule";
import {
  patchLoader,
  loadDrumPatch,
  loadSynthFromGetObject,
} from "../../assets/musicutils";

import Sequencer from "../Modules/DrumSequencer/Sequencer";
import ChordProgression from "../Modules/ChordProgression/ChordProgression";
import MelodyGrid from "../Modules/MelodyGrid/MelodyGrid";
import Player from "../Modules/Player/Player";
import InstrumentEditor from "../InstrumentEditor/InstrumentEditor";
import ModuleSettings from "./ModuleSettings";

import { colors } from "../../utils/materialPalette";

import "./Module.css";

function Module(props) {
  const [instrumentEditorMode, setInstrumentEditorMode] = useState(false);
  const [settingsMode, setSettingsMode] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  let moduleContent = <span>Nothing Here</span>;

  const handleInstrumentButtonMode = () => {
    setInstrumentEditorMode((prev) => (prev ? false : true));
    setSettingsMode(false);
    closeMenu();
  };

  const handleSettingsButtonMode = () => {
    setSettingsMode((prev) => (prev ? false : true));
    setInstrumentEditorMode(false);
    closeMenu();
  };

  const handleBackButtonClick = () => {
    setSettingsMode(false);
    setInstrumentEditorMode(false);
  };

  const removeModule = () => {
    //Tone.Transport.pause();
    props.setModules((prevModules) => {
      //prevModules.forEach(e=>clearEvents(e.id));
      clearEvents(props.index);
      let newModules = [...prevModules];
      newModules = newModules
        .filter((e) => e.id !== props.index)
        .map((e, i) => {
          return { ...e, id: i };
        });
      return newModules;
    });
  };

  const openMenu = (e) => {
    setMenuAnchorEl(e.currentTarget);
  };

  const closeMenu = () => {
    setMenuAnchorEl(null);
  };

  const onInstrumentMod = (url, name, isRemoving) => {
    //update instrument info in module object

    props.setModules((prev) => {
      let newModules = [...prev];
      if (props.module.type === 0) {
        newModules[props.module.id].instrument = {
          urls: { ...prev[props.module.id].instrument.urls, [name]: url },
        };
      } else if (props.module.type === 3) {
        newModules[props.module.id].instrument = { url };
      } else if (props.instrument.name === "Sampler") {
        let samplerPrms = props.instrument.get();
        delete samplerPrms.onerror;
        delete samplerPrms.onload;
        samplerPrms.urls = { ...props.instrument.get().urls, [name]: url };
        newModules[props.module.id].instrument = samplerPrms;
      } else {
        newModules[props.module.id].instrument = props.instrument.get();
      }
      return newModules;
    });
  };

  switch (props.module.type) {
    case 0:
      moduleContent = (
        <Sequencer
          style={{
            display: instrumentEditorMode || settingsMode ? "none" : "flex",
            backgroundColor: colors[props.module.color][500],
          }}
          instrument={props.instrument}
          loaded={props.loaded}
          sessionSize={props.sessionSize}
          module={props.module}
          kit={0}
          updateModules={props.setModules}
        />
      );
      break;
    case 1:
      moduleContent = (
        <MelodyGrid
          style={{
            display: instrumentEditorMode || settingsMode ? "none" : "flex",
          }}
          instrument={props.instrument}
          sessionSize={props.sessionSize}
          module={props.module}
          updateModules={props.setModules}
        />
      );
      break;
    case 2:
      moduleContent = (
        <ChordProgression
          style={{
            display: instrumentEditorMode || settingsMode ? "none" : "block",
            overflow: "hidden",
          }}
          instrument={props.instrument}
          sessionSize={props.sessionSize}
          module={props.module}
          updateModules={props.setModules}
        />
      );
      break;

    case 3:
      moduleContent = (
        <Player
          style={{
            display: instrumentEditorMode || settingsMode ? "none" : "flex",
          }}
          onInstrumentMod={onInstrumentMod}
          setInstruments={props.setInstruments}
          loaded={props.loaded}
          instrument={props.instrument}
          sessionSize={props.sessionSize}
          module={props.module}
          updateModules={props.setModules}
        />
      );
      break;
  }

  useEffect(() => {
    return () => {
      //TODO: IMPORTANT: Dispose module instrument on unmount
      //console.log(instrument) -> null
      //instrument.dispose();
    };
  }, []);

  useEffect(() => {
    if (
      props.instrument !== null &&
      props.instrument !== undefined &&
      Tone.Transport.state !== "started"
    ) {
      props.instrument.name === "Players"
        ? props.instrument.stopAll()
        : props.instrument.name === "GrainPlayer" ||
          props.instrument.name === "Player"
        ? props.instrument.stop()
        : props.instrument.releaseAll();
    }
  }, [Tone.Transport.state]);

  return (
    <div
      style={{
        backgroundColor: colors[props.module.color][700],
        overflow:
          props.module.type === 2 || (props.module.type === 3 && "hidden"),
        pointerEvents: props.editMode ? "auto" : "none",
      }}
      className={
        "module " +
        //(props.module.type === 3 && " module-compact ") +
        (props.module.muted && " module-muted")
      }
    >
      <div className="module-header">
        {(instrumentEditorMode || settingsMode) && (
          <IconButton
            className="module-back-button"
            onClick={handleBackButtonClick}
          >
            <Icon style={{ fontSize: 20 }}>arrow_back_ios</Icon>
          </IconButton>
        )}
        <span className="module-title">{props.module.name}</span>
        <IconButton className="module-options-button" onClick={openMenu}>
          <Icon>more_vert</Icon>
        </IconButton>
        <Menu
          anchorEl={menuAnchorEl}
          keepMounted
          open={Boolean(menuAnchorEl)}
          onClose={closeMenu}
        >
          <MenuItem
            onClick={handleSettingsButtonMode}
            className="module-menu-option"
          >
            <Icon className="module-menu-option-icon">settings</Icon>
            Module Settings
          </MenuItem>
          <MenuItem
            onClick={handleInstrumentButtonMode}
            className="module-menu-option"
          >
            <Icon>piano</Icon>
            Instrument Editor
          </MenuItem>
          <MenuItem onClick={removeModule}>
            <Icon className="module-menu-remove-option">delete</Icon>
            Remove Module
          </MenuItem>
        </Menu>
      </div>
      {props.loaded ? (
        <Fragment>
          {instrumentEditorMode && (
            <InstrumentEditor
              module={props.module}
              setModules={props.setModules}
              instrument={props.instrument}
              onInstrumentMod={onInstrumentMod}
              setInstruments={props.setInstruments}
              setInstrumentsLoaded={props.setInstrumentsLoaded}
              updateModules={props.setModules}
              setInstrumentEditorMode={setInstrumentEditorMode}
              index={props.index}
            />
          )}
          {settingsMode && (
            <ModuleSettings
              instrument={props.instrument}
              module={props.module}
              setModules={props.setModules}
              setSettingsMode={setSettingsMode}
              index={props.index}
            />
          )}

          {moduleContent}
        </Fragment>
      ) : (
        <CircularProgress
          className="loading-progress"
          style={{ color: colors[props.module.color][300] }}
        />
      )}
    </div>
  );
}

export default Module;

{
  /* <div
  className="expand-bar"
  onClick={() => setExpanded(expanded ? false : true)}
>
  <Icon className="expand-bar-icon">
    {expanded ? "expand_less" : "expand_more"}
  </Icon>
</div>; */
}

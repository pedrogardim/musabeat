import React, { useEffect, useState } from "react";
import * as Tone from "tone";

import { IconButton, Icon, Menu, MenuItem } from "@material-ui/core";
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

import "./Module.css";

function Module(props) {
  const [instrument, setInstrument] = useState(null);
  const [bufferLoaded, setBufferLoaded] = useState(false);

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

  const loadInstrument = () => {
    if (props.module.type === 0) {
      setInstrument(()=>{return new Tone.Players(props.module.instrument.urls,()=>setBufferLoaded(true)).toDestination()})

    }
    //players
    else if (props.module.type === 3) {
      console.log("loading player")
      setInstrument(()=>{return new Tone.GrainPlayer(props.module.instrument.url,()=>setBufferLoaded(true)).toDestination()})
    } else if (typeof props.module.instrument === "string") {
      patchLoader(props.module.instrument, "", setInstrument);
    } else if (
      typeof props.module.instrument === "object" &&
      props.module.instrument.name !== "Players" &&
      props.module.instrument.name !== "GrainPlayer" &&
      instrument === null
    ) {
      setInstrument(loadSynthFromGetObject(props.module.instrument));
    }
  };

  const onInstrumentMod = (url,name,isRemoving) => {
    //update instrument info in module object
    props.setModules((prev) => {
      let newModules = [...prev];
      newModules[props.module.id].instrument =
      props.module.type === 0
          ? { urls: {...prev[props.module.id].instrument.urls,[name]:url} }
          : props.module.type === 3
          ? { url }
          : instrument.get();
      return newModules;
    });
  };

  switch (props.module.type) {
    case 0:
      moduleContent = (
        <Sequencer
          style={{
            display: instrumentEditorMode || settingsMode ? "none" : "flex",
            backgroundColor: props.module.color[500],
          }}
          instrument={instrument}
          bufferLoaded={bufferLoaded}
          setBufferLoaded={setBufferLoaded}
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
          instrument={instrument}
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
          instrument={instrument}
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
          setInstrument={setInstrument}
          bufferLoaded={bufferLoaded}
          setBufferLoaded={setBufferLoaded}
          instrument={instrument}
          sessionSize={props.sessionSize}
          module={props.module}
          updateModules={props.setModules}
        />
      );
      break;
  }

  useEffect(() => {
    loadInstrument();
  }, []);

  useEffect(() => {
    if (instrument !== null) instrument.volume.value = props.module.volume;
  }, [props.module.volume]);

  useEffect(() => {
    if (instrument !== null)
      instrument.volume.value = props.module.muted
        ? -Infinity
        : props.module.volume;
  }, [props.module.muted]);

  useEffect(() => {
    console.log(bufferLoaded)
  }, [bufferLoaded]);

  useEffect(() => {
    if (instrument !== null) {
      Tone.Transport.state !== "started" && instrument.name === "Players"
        ? instrument.stopAll()
        : instrument.name === "GrainPlayer" || instrument.name === "Player"
        ? instrument.stop()
        : instrument.releaseAll();
    }
  }, [Tone.Transport.state]);

  return (
    <div
      style={{
        backgroundColor: props.module.color[700],
        overflow:
          props.module.type === 2 || (props.module.type === 3 && "hidden"),
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

      {instrumentEditorMode && (
        <InstrumentEditor
          module={props.module}
          setModules={props.setModules}
          instrument={instrument}
          onInstrumentMod={onInstrumentMod}
          setInstrument={setInstrument}
          updateModules={props.setModules}
          setInstrumentEditorMode={setInstrumentEditorMode}
          index={props.index}
        />
      )}
      {settingsMode && (
        <ModuleSettings
          instrument={instrument}
          module={props.module}
          updateModules={props.setModules}
          setSettingsMode={setSettingsMode}
          index={props.index}
        />
      )}

      {moduleContent}
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

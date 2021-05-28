import React, { useEffect, useState } from "react";

import { IconButton, Icon, Menu, MenuItem } from "@material-ui/core";
import { clearEvents } from "../../utils/TransportSchedule"

import Sequencer from "../Modules/DrumSequencer/Sequencer";
import ChordProgression from "../Modules/ChordProgression/ChordProgression";
import MelodyGrid from "../Modules/MelodyGrid/MelodyGrid";
import Sampler from "../Modules/Player/Player";
import InstrumentEditor from "../InstrumentEditor/InstrumentEditor";
import ModuleSettings from "./ModuleSettings";

import "./Module.css";

function Module(props) {
  const [muted, setMuted] = useState(props.muted);
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
    props.setModules((prevModules) => {
      prevModules.forEach(e=>clearEvents(e.id));
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

  switch (props.module.type) {
    case 0:
      moduleContent = (
        <Sequencer
          style={{
            display: instrumentEditorMode || settingsMode ? "none" : "flex",
            backgroundColor: props.module.color[500],
          }}
          sessionSize={props.sessionSize}
          muted={muted}
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
          sessionSize={props.sessionSize}
          muted={muted}
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
          sessionSize={props.sessionSize}
          muted={muted}
          module={props.module}
          updateModules={props.setModules}
        />
      );
      break;

    case 3:
      moduleContent = (
        <Sampler
          style={{
            display: instrumentEditorMode || settingsMode ? "none" : "flex",
          }}
          sessionSize={props.sessionSize}
          muted={muted}
          module={props.module}
          updateModules={props.setModules}
        />
      );
      break;
  }

  useEffect(() => {
    setMuted(props.module.instrument._volume.mute);
  }, [props.module.instrument._volume.mute]);

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
        (muted && " module-muted")
      }
    >
      <div className="module-header">
      {(instrumentEditorMode || settingsMode) && <IconButton className="module-back-button" onClick={handleBackButtonClick}>
          <Icon style={{fontSize:20}}>arrow_back_ios</Icon>
        </IconButton>}
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
          instrument={props.module.instrument}
          updateModules={props.setModules}
          setInstrumentEditorMode={setInstrumentEditorMode}
          index={props.index}
        />
      )}
      {settingsMode && (
        <ModuleSettings
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

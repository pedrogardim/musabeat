import React, { useEffect, useState } from "react";

import { Card, IconButton, Icon } from "@material-ui/core";

import Sequencer from "../modules/Sequencer";
import ChordProgression from "../modules/ChordProgression";
import MelodyGrid from "../modules/MelodyGrid";
import Sampler from "../modules/Sampler";
import InstrumentEditor from "../InstrumentEditor/InstrumentEditor";
import ModuleSettings from "./ModuleSettings";

import { clearEvents } from "../../utils/TransportSchedule";

import "./Module.css";

function Module(props) {
  const [expanded, setExpanded] = useState(false);
  const [muted, setMuted] = useState(props.module.instrument._volume.mute);
  const [instrumentEditorMode, setInstrumentEditorMode] = useState(false);
  const [settingsMode, setSettingsMode] = useState(false);

  //const getValue = (event) => console.log(event.target.value);

  let innerModule = <span>Nothing Here</span>;

  const handleInstrumentButtonMode = () => {
    setInstrumentEditorMode((prev) => (prev ? false : true));
    setSettingsMode(false);
  };

  const handleSettingsButtonMode = () => {
    setSettingsMode((prev) => (prev ? false : true));
    setInstrumentEditorMode(false);
  };

  switch (props.module.type) {
    case 0:
      innerModule = (
        <Sequencer
          style={{
            display: instrumentEditorMode || settingsMode ? "none" : "flex",
          }}
          sessionSize={props.sessionSize}
          muted={muted}
          module={props.module}
          kit={0}
          updateModules={props.updateModules}
        />
      );
      break;
    case 1:
      innerModule = (
        <MelodyGrid
          style={{
            display: instrumentEditorMode || settingsMode ? "none" : "flex",
          }}
          sessionSize={props.sessionSize}
          muted={muted}
          module={props.module}
          updateModules={props.updateModules}
        />
      );
      break;
    case 2:
      innerModule = (
        <ChordProgression
          style={{
            display: instrumentEditorMode || settingsMode ? "none" : "flex",
          }}

          sessionSize={props.sessionSize}
          muted={muted} 
          module={props.module}
          updateModules={props.updateModules}
          setDrawer={props.setDrawer}
          drawerCont={props.drawerCont}
        />
      );
      break;

      case 3:
      innerModule = (
        <Sampler
          style={{
            display: instrumentEditorMode || settingsMode ? "none" : "flex",
          }}
          sessionSize={props.sessionSize}
          muted={muted} 
          module={props.module}
          updateModules={props.updateModules}
        />
      );
      break;
  }

  //TO DO
  /*
  useEffect(() =>{ 
    setMuted(props.module.instrument.volume.value === -Infinity ? true : false);
    console.log(props.module.instrument.volume.value)
  }
  , [props.module.instrument.volume.value]);

  */

  return (
    <Card
      style={{
        backgroundColor: props.module.color[700],
        filter: muted && "saturate(0) brightness(1.5) constrast(0.5)",
      }}
      className="module"
    >
      <div className="module-header">
        <span className="module-title">{props.module.name}</span>
        <IconButton
          className="module-instrument-icon-button"
          onClick={handleSettingsButtonMode}
        >
          <Icon style={{ color: "white" }}>settings</Icon>
        </IconButton>
        <IconButton
          className="module-instrument-icon-button"
          onClick={handleInstrumentButtonMode}
        >
          <Icon style={{ color: "white" }}>piano</Icon>
        </IconButton>
      </div>

      {instrumentEditorMode && (
        <InstrumentEditor
          instrument={props.module.instrument}
          updateModules={props.updateModules}
          setInstrumentEditorMode={setInstrumentEditorMode}
          index={props.index}
        />
      )}
      {settingsMode && (
        <ModuleSettings
          module={props.module}
          updateModules={props.updateModules}
          setSettingsMode={setSettingsMode}
          index={props.index}
        />
      )}

      {innerModule}
    </Card>
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

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
  const [muted, setMuted] = useState(props.muted);
  const [instrumentEditorMode, setInstrumentEditorMode] = useState(false);
  const [settingsMode, setSettingsMode] = useState(false);

  let moduleContent = <span>Nothing Here</span>;

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
      moduleContent = (
        <Sequencer
          style={{
            display: instrumentEditorMode || settingsMode ? "none" : "flex",
            backgroundColor: props.module.color[500]
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
      moduleContent = (
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
      moduleContent = (
        <ChordProgression
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

    case 3:
      moduleContent = (
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

  useEffect(() => {
    setMuted(props.module.instrument._volume.mute);
  }, [props.module.instrument._volume.mute]);

  return (
    <div
      id={"module-" + props.module.id}
      style={{
        backgroundColor: props.module.color[700],
        overflow: props.module.type === 3 && "hidden"


      }}
      className={
        "module " +
        (props.module.type === 3 && " module-compact ") +
        (muted && " module-muted")
      }
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
          module={props.module}
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

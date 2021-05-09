import React, { useState } from "react";

import { Card, IconButton, Icon } from "@material-ui/core";

import Sequencer from "../modules/Sequencer";
import ChordProgression from "../modules/ChordProgression";
import MelodyGrid from "../modules/MelodyGrid";
import InstrumentEditor from "../InstrumentEditor/InstrumentEditor";

import "./Module.css";

function Module(props) {
  const [instrumentEditorMode, setInstrumentEditorMode] = useState(false);

  //const getValue = (event) => console.log(event.target.value);

  let innerModule = <span>Nothing Here</span>;

  const handleSwitchButtonMode = () => {
    setInstrumentEditorMode((prev) => (prev ? false : true));
  };

  switch (props.module.type) {
    case 0:
      innerModule = (
        <Sequencer
          style={{ display: instrumentEditorMode ? "none" : "flex" }}
          module={props.module}
          kit={0}
          updateModules={props.updateModules}
        />
      );
      break;
    case 1:
      innerModule = (
        <MelodyGrid
          style={{ display: instrumentEditorMode ? "none" : "flex" }}
          module={props.module}
          updateModules={props.updateModules}
        />
      );
      break;
    case 2:
      innerModule = (
        <ChordProgression
          style={{ display: instrumentEditorMode ? "none" : "flex" }}
          module={props.module}
          updateModules={props.updateModules}
          setDrawer={props.setDrawer}
        />
      );
      break;
  }

  return (
    <Card className="module">
      <div className="module-header">
        <span className="module-title">{props.module.name}</span>
        <IconButton
          className="module-instrument-mode-button"
          onClick={handleSwitchButtonMode}
        >
          <Icon style={{ color: "white" }}>piano</Icon>
        </IconButton>
      </div>

      {instrumentEditorMode && (
        <InstrumentEditor
          instrument={props.module.instrument}
          updateModules={props.updateModules}
          index={props.index}
        />
      )}
      {innerModule}
    </Card>
  );
}

export default Module;

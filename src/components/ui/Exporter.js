import React, { useState } from "react";

import { Fab, Icon } from "@material-ui/core";

import { bounceSessionExport } from "../../utils/exportUtils";

function Exporter(props) {
  const [isReady, setIsReady] = useState(false);

  const modules = props.modules;
  const sessionData = props.sessionData;

  const handleButtonClick = () => {
    setIsReady(false);
    bounceSessionExport(
      modules,
      props.modulesInstruments,
      sessionData,
      setIsReady,
      props.sessionSize,
      props.timeline,
      props.timelineMode
    );
  };

  return (
    <Fab
      color="primary"
      className="ws-fab ws-fab-export"
      tabIndex={-1}
      onClick={handleButtonClick}
    >
      <Icon>file_download</Icon>
    </Fab>
  );
}

export default Exporter;

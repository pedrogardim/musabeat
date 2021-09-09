import React, { useState, useEffect } from "react";

import { IconButton, Icon, CircularProgress } from "@material-ui/core";

import { bounceSessionExport } from "../../utils/exportUtils";

function Exporter(props) {
  const [isReady, setIsReady] = useState(true);
  const [exportProgress, setExportProgress] = useState(0);

  const modules = props.modules;
  const sessionData = props.sessionData;

  const handleButtonClick = () => {
    if (isReady)
      bounceSessionExport(
        modules,
        props.modulesInstruments,
        sessionData,
        setIsReady,
        setExportProgress,
        props.sessionSize,
        props.timeline,
        props.timelineMode,
        props.forceReschedule
      );
  };

  //it's necessary to trigger rescheduling after export

  return (
    <IconButton
      color="primary"
      className="ws-fab ws-fab-export"
      tabIndex={-1}
      onClick={handleButtonClick}
    >
      {isReady ? (
        <Icon>file_download</Icon>
      ) : (
        <CircularProgress
          size={24}
          color={"secondary"}
          variant="determinate"
          value={exportProgress}
        />
      )}
    </IconButton>
  );
}

export default Exporter;

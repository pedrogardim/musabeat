import React, { useState, useEffect, Fragment } from "react";

import {
  IconButton,
  Icon,
  CircularProgress,
  Dialog,
  Button,
  DialogContent,
} from "@material-ui/core";

import { bounceSessionExport } from "../../utils/exportUtils";

function Exporter(props) {
  const [isReady, setIsReady] = useState(true);
  const [open, setOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const modules = props.modules;
  const sessionData = props.sessionData;

  const handleDownload = (format) => {
    if (isReady) {
      bounceSessionExport(
        modules,
        props.modulesInstruments,
        sessionData,
        setIsReady,
        setExportProgress,
        props.sessionSize,
        props.timeline,
        props.timelineMode,
        props.forceReschedule,
        format
      );
      setOpen(false);
    }
  };

  //it's necessary to trigger rescheduling after export

  return (
    <>
      <IconButton
        className="ws-fab ws-fab-export"
        tabIndex={-1}
        onClick={() => setOpen(true)}
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
      {
        <Dialog open={open} onClose={() => setOpen(false)}>
          {/* <IconButton
            onClick={() => setOpen(false)}
            className="mp-closebtn"
            color="primary"
          >
            <Icon>close</Icon>
          </IconButton> */}
          <div style={{ display: "flex", margin: 24 }}>
            {["mp3", "wav"].map((e, i) => (
              <Button key={e} color="primary" onClick={() => handleDownload(e)}>
                {e.toUpperCase()}
              </Button>
            ))}
          </div>
        </Dialog>
      }
    </>
  );
}

export default Exporter;

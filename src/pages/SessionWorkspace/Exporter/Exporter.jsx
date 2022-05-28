import React, { useState } from "react";

import {
  IconButton,
  Icon,
  CircularProgress,
  Dialog,
  Button,
} from "@mui/material";

import { bounceSessionExport } from "../../../services/Session/Export";

function Exporter(props) {
  const [isReady, setIsReady] = useState(true);
  const [open, setOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const { tracks, sessionData, scheduleAllTracks, instruments } = props;

  const handleDownload = (format) => {
    if (isReady) {
      bounceSessionExport(
        tracks,
        instruments,
        sessionData,
        setIsReady,
        setExportProgress,
        format,
        scheduleAllTracks
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

import React, { useState, useEffect } from "react";

import { useTranslation } from "react-i18next";

import { Drawer, MenuItem, Icon, IconButton } from "@mui/material";

//import "./AppLogo.css";

import { colors } from "../../../utils/materialPalette";

function FileList(props) {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    let fs = [];
    props.instrumentsInfo.forEach((track, trackIndex) => {
      if (!track || !track.filesInfo) return;
      fs = [
        ...fs,
        ...Object.keys(track.filesInfo).map((e) => ({
          ...track.filesInfo[e],
          id: e,
          index: trackIndex,
        })),
      ];
    });
    setFiles(fs);
  }, [props.instrumentsInfo]);

  return (
    <Drawer anchor="right" open={props.open} variant="persistent">
      <IconButton
        onClick={props.onClose}
        className="mp-closebtn"
        style={{ top: 0, right: 16 }}
        color="primary"
      >
        <Icon>close</Icon>
      </IconButton>
      <div
        style={{
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span>Audio Files</span>
      </div>

      {files.map((e) => (
        <MenuItem
          className="up"
          style={{
            fontSize: 12,
            color: colors[props.tracks[e.index].color][900],
          }}
        >{`${e.name} ${e.dur.toFixed(2)}s ${formatBytes(e.size)}`}</MenuItem>
      ))}
    </Drawer>
  );
}

function formatBytes(a, b = 2) {
  if (0 === a) return "0 Bytes";
  const c = 0 > b ? 0 : b,
    d = Math.floor(Math.log(a) / Math.log(1024));
  return (
    parseFloat((a / Math.pow(1024, d)).toFixed(c)) +
    " " +
    ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][d]
  );
}

export default FileList;

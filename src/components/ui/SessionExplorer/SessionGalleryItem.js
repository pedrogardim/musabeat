import React, { useState, useEffect, Fragment } from "react";
import * as Tone from "tone";

import {
  Paper,
  Typography,
  CircularProgres,
  TextField,
  Icon,
  IconButton,
  Avatar,
} from "@material-ui/core";

import "./SessionGalleryItem.css";

import firebase from "firebase";

import { colors } from "../../../utils/materialPalette";

function SessionGalleryItem(props) {
  const [creatorInfo, setCreatorInfo] = useState({});
  const [hovered,setHovered] = useState(false);

  const handleClick = (event) => {
    (event.target.classList.contains("session-gallery-item") ||
      event.target.classList.contains("session-gallery-item-modules-cont") ||
      event.target.classList.contains("session-gallery-item-module")) &&
      props.handleSessionSelect(props.index);
  };

  const handleHover = (event) => {
    (event.target.classList.contains("session-gallery-item") ||
      event.target.classList.contains("session-gallery-item-modules-cont") ||
      event.target.classList.contains("session-gallery-item-module")) ?
      setHovered(true) : setHovered(false)
  };

  const fetchCreatorDisplayName = () => {
    const dbRef = firebase
      .database()
      .ref(`users/${props.session.creator}/profile`);
    dbRef.get().then((snapshot) => setCreatorInfo(snapshot.val()));
  };

  useEffect(() => {
    fetchCreatorDisplayName();
  }, [props.session]);

  useEffect(() => {
    creatorInfo !== {} && console.log(creatorInfo);
  }, [creatorInfo]);
  return (
    <Paper className={`session-gallery-item ${hovered && 'session-gallery-item-hovered'}`} onClick={handleClick} onMouseOver={handleHover} onMouseOut={()=>setHovered(false)}>
      {
        <Typography variant="h5" className="session-gallery-item-title">
          {props.session.name}
        </Typography>
      }
      {props.isUser && (
        <IconButton style={{ position: "absolute", top: 0, right: 0 }}>
          <Icon>edit</Icon>
        </IconButton>
      )}
      {!props.isUser && (
        <div className="session-gallery-item-subtitle">
          <Avatar
            className="session-gallery-item-subtitle-avatar"
            src={creatorInfo.photoURL}
          ></Avatar>
          <Typography variant="overline">{creatorInfo.displayName}</Typography>
        </div>
      )}

      <div className="session-gallery-item-modules-cont">
        {props.session.modules !== undefined &&
        !!props.session.modules.length ? (
          props.session.modules.map((e) => (
            <Paper
              className="session-gallery-item-module"
              style={{ backgroundColor: colors[e.color][500] }}
            >
              {e.name}
            </Paper>
          ))
        ) : (
          <Paper
            className="session-gallery-item-module"
            style={{ backgroundColor: "gray", opacity: 0.7 }}
          >
            No Modules
          </Paper>
        )}
      </div>
      <div className="session-gallery-item-module-footer">
        <IconButton>
          <Icon>play_arrow</Icon>
        </IconButton>
        <IconButton>
          <Icon>favorite</Icon>
        </IconButton>
        <IconButton>
          <Icon>share</Icon>
        </IconButton>
        <IconButton>
          <Icon>content_copy</Icon>
        </IconButton>
        {props.isUser && (
          <IconButton>
            <Icon>delete</Icon>
          </IconButton>
        )}
      </div>
    </Paper>
  );
}

export default SessionGalleryItem;

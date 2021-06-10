import React, { useState, useEffect, Fragment } from "react";
import * as Tone from "tone";

import {
  Paper,
  Typography,
  CircularProgress,
  TextField,
  Icon,
  IconButton,
  Avatar,
  Tooltip,
} from "@material-ui/core";

import "./SessionGalleryItem.css";

import firebase from "firebase";

import { colors } from "../../../utils/materialPalette";

function SessionGalleryItem(props) {
  const [creatorInfo, setCreatorInfo] = useState({});
  const [hovered, setHovered] = useState(false);
  const [sessionLikes, setSessionLikes] = useState(false);

  const handleClick = (event) => {
    !event.target.classList.contains("MuiButtonBase-root") &&
      !event.target.classList.contains("MuiIcon-root") &&
      props.handleSessionSelect(props.index);
  };

  const handleHover = (event) => {
    !event.target.classList.contains("MuiButtonBase-root") &&
    !event.target.classList.contains("MuiIcon-root")
      ? setHovered(true)
      : setHovered(false);
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

  return (
    <Paper
      className={`session-gallery-item ${
        hovered && "session-gallery-item-hovered"
      }`}
      onClick={handleClick}
      onMouseOver={handleHover}
      onMouseOut={() => setHovered(false)}
    >
      <div className="session-gallery-item-title-cont">
        <Tooltip placement={"top"} title={props.session.name}>
          <Typography variant="h5" className="session-gallery-item-title">
            {props.session.name}
          </Typography>
        </Tooltip>
        {props.isUser && (
          <IconButton
            onClick={() => props.setRenameDialog(props.index)}
            className="session-gallery-item-editname-button"
          >
            <Icon>edit</Icon>
          </IconButton>
        )}
      </div>

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
              style={{ backgroundColor: colors[e.color][500], borderRadius: 0 }}
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
        {props.playingLoadingProgress !== 100 &&
        props.playingSession &&
        !!props.session.modules ? (
          <CircularProgress value={props.playingLoadingProgress} />
        ) : 
          !!props.session.modules ||
          props.playingLoadingProgress === 100 ? (
          <IconButton onClick={props.setPlayingSession}>
            <Icon>{props.playingSession ? "stop" : "play_arrow"}</Icon>
          </IconButton>
        ) : (
          ""
        )}
        <Tooltip title={props.session.likes}>
          <IconButton>
            <Icon
              onClick={props.handleUserLike}
              color={props.likedByUser ? "secondary" : "none"}
            >
              favorite
            </Icon>
          </IconButton>
        </Tooltip>

        {/*<IconButton>
          <Icon>share</Icon>
        </IconButton>*/}
        <IconButton>
          <Icon>content_copy</Icon>
        </IconButton>
        {props.isUser && (
          <Tooltip title="Delete Session">
            <IconButton onClick={() => props.handleSessionDelete(props.index)}>
              <Icon>delete</Icon>
            </IconButton>
          </Tooltip>
        )}
      </div>
    </Paper>
  );
}

export default SessionGalleryItem;

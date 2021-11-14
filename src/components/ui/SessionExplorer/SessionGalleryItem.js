import React, { useState, useEffect } from "react";

import {
  Paper,
  Typography,
  CircularProgress,
  Icon,
  IconButton,
  Avatar,
  Tooltip,
} from "@material-ui/core";

import "./SessionGalleryItem.css";

import { useTranslation } from "react-i18next";

import firebase from "firebase";

import { colors } from "../../../utils/materialPalette";

function SessionGalleryItem(props) {
  const [creatorInfo, setCreatorInfo] = useState({});
  const [hovered, setHovered] = useState(false);

  const { t } = useTranslation();

  const handleClick = (event) => {
    !event.target.classList.contains("MuiButtonBase-root") &&
      !event.target.classList.contains("MuiIcon-root") &&
      !event.target.classList.contains("like-btn-label") &&
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
      .firestore()
      .collection("users")
      .doc(props.session.creator);
    dbRef.get().then((snapshot) => setCreatorInfo(snapshot.data().profile));
  };

  useEffect(() => {
    fetchCreatorDisplayName();
  }, [props.session]);

  return (
    <Paper
      className={`session-gallery-item ${
        hovered && "session-gallery-item-hovered"
      } ${props.compact && "session-gallery-item-compact"}`}
      onClick={handleClick}
      onMouseOver={handleHover}
      onMouseOut={() => setHovered(false)}
    >
      <div className="session-gallery-item-title-cont">
        <Tooltip placement={"top"} title={props.session.name}>
          <Typography
            variant={"h5"}
            style={{ fontSize: props.compact && "1.2rem" }}
            className="session-gallery-item-title"
          >
            {props.session.name
              ? props.session.name
              : t("WSTitle.untitledSession")}
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

      {!(props.isUser || props.compact) && (
        <div className="session-gallery-item-subtitle">
          <Avatar
            className="session-gallery-item-subtitle-avatar"
            src={creatorInfo.photoURL}
            onClick={() =>
              props.handlePageNav("user", creatorInfo.username, true)
            }
          />
          <Typography variant="overline">{creatorInfo.username}</Typography>
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
              <Tooltip
                title={
                  e.name
                    ? `"${e.name}"`
                    : t(`modulePicker.types.${e.type}.name`)
                }
              >
                <Icon>
                  {e.type === 0
                    ? "grid_on"
                    : e.type === 1
                    ? "music_note"
                    : e.type === 2
                    ? "font_download"
                    : e.type === 3
                    ? "graphic_eq"
                    : "piano"}
                </Icon>
              </Tooltip>
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
      {!props.userPage && (
        <div className="session-gallery-item-footer">
          {props.playingLoadingProgress !== 100 &&
          props.playingSession &&
          !!props.session.modules ? (
            <CircularProgress value={props.playingLoadingProgress} />
          ) : !!props.session.modules ||
            props.playingLoadingProgress === 100 ? (
            <IconButton onClick={props.setPlayingSession}>
              <Icon>{props.playingSession ? "stop" : "play_arrow"}</Icon>
            </IconButton>
          ) : (
            ""
          )}
          <Tooltip title={props.session.likes}>
            <IconButton onClick={props.handleUserLike}>
              <Icon color={props.likedByUser ? "secondary" : "inherit"}>
                favorite
              </Icon>
              <Typography className="like-btn-label" variant="overline">
                {props.session.likes}
              </Typography>
            </IconButton>
          </Tooltip>

          {/*<IconButton>
          <Icon>share</Icon>
        </IconButton>*/}
          <Tooltip
            title={
              !props.user
                ? "Log in to be able to copy sessions"
                : (props.user && props.user.uid) !== props.session.creator &&
                  !props.session.alwcp
                ? "The user doesn't allow this session to be copied"
                : "Create a copy"
            }
            placement="top"
          >
            <div>
              <IconButton
                onClick={() => props.createNewSession(props.session)}
                disabled={
                  !props.user ||
                  (props.user.uid !== props.session.creator &&
                    !props.session.alwcp)
                }
              >
                <Icon>content_copy</Icon>
              </IconButton>
            </div>
          </Tooltip>
          {props.isUser && (
            <Tooltip title="Delete Session">
              <IconButton
                onClick={() => props.handleSessionDelete(props.index)}
              >
                <Icon>delete</Icon>
              </IconButton>
            </Tooltip>
          )}
        </div>
      )}
    </Paper>
  );
}

export default SessionGalleryItem;

import React, { useState, useEffect } from "react";

import firebase from "firebase";

import {
  Paper,
  Typography,
  CircularProgress,
  Icon,
  IconButton,
  Avatar,
  Tooltip,
  Grid,
  Chip,
} from "@mui/material";

import "./style.css";

import { useTranslation } from "react-i18next";

import { sessionTags } from "../../../services/MiscData";

import { colors } from "../../../utils/Pallete";

function SessionCard(props) {
  const [creatorInfo, setCreatorInfo] = useState({});
  const [hovered, setHovered] = useState(false);

  const { t } = useTranslation();

  const handleClick = (event) => {
    !event.target.className.includes("MuiButtonBase-root") &&
      !event.target.className.includes("MuiIcon") &&
      !event.target.className.includes("MuiChip") &&
      !event.target.className.includes("like-btn-label") &&
      props.handleSessionSelect(event);
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
    <Grid item xs={12} sm={12} md={12} lg={!props.compact ? 6 : 12} xl={6}>
      <Paper
        className={`session-gallery-item ${
          hovered && "session-gallery-item-hovered"
        } ${props.compact && "session-gallery-item-compact"}`}
        onClick={handleClick}
        onMouseOver={handleHover}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="session-gallery-item-title-cont">
          {!(props.isUser || props.compact) && (
            <>
              <Avatar
                className="session-gallery-item-subtitle-avatar"
                src={creatorInfo.photoURL}
                onClick={(ev) =>
                  props.handlePageNav("user", creatorInfo.username, ev)
                }
              />
            </>
          )}
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontWeight: "bold",
                //textTransform: "none",
              }}
            >
              {props.session.name
                ? props.session.name
                : t("WSTitle.untitledSession")}
            </Typography>
            <div className="break" />
            <Typography
              variant="body1"
              sx={{
                color: "gray",
                textDecoration: "underline",
                textTransform: "none",
              }}
            >
              {"@" + creatorInfo.username}
            </Typography>
          </div>

          <IconButton
            onClick={() => props.setRenameDialog(props.index)}
            className="session-gallery-item-actions-button"
          >
            <Icon>more_vert</Icon>
          </IconButton>
        </div>

        {!props.compact &&
          props.session.tags &&
          !!props.session.tags.length && (
            <div className={"session-gallery-item-tags"}>
              {props.session.tags.map(
                (e, i) =>
                  i < 2 && (
                    <Chip
                      style={{ margin: "0px 4px" }}
                      key={props.index + e}
                      label={sessionTags[e]}
                      onClick={() =>
                        props.handleTagClick && props.handleTagClick(i)
                      }
                    />
                  )
              )}
            </div>
          )}

        <div className="session-gallery-item-track-cont">
          {props.session.tracks !== undefined &&
          !!props.session.tracks.length ? (
            props.session.tracks.map((e) => (
              <Paper
                className="session-gallery-item-track"
                style={{
                  backgroundColor: colors[e.color][500],
                  borderRadius: 0,
                }}
              >
                <Tooltip
                  title={
                    e.name
                      ? `"${e.name}"`
                      : t(`trackPicker.types.${e.type}.name`)
                  }
                >
                  <Icon>
                    {e.type === 0
                      ? "grid_on"
                      : e.type === 1
                      ? "piano"
                      : "graphic_eq"}
                  </Icon>
                </Tooltip>
              </Paper>
            ))
          ) : (
            <Paper
              className="session-gallery-item-track"
              style={{ backgroundColor: "gray", opacity: 0.7 }}
            >
              No Tracks
            </Paper>
          )}
        </div>
        {!props.userPage && (
          <div className="session-gallery-item-footer">
            {props.playingLoadingProgress !== 100 &&
            props.playingSession &&
            !!props.session.tracks ? (
              <CircularProgress value={props.playingLoadingProgress} />
            ) : !!props.session.tracks ||
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
            >
              <div>
                <IconButton
                  onClick={() => props.setNewSessionDialog(props.session)}
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
    </Grid>
  );
}

export default SessionCard;

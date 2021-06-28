import React, { useState, useEffect, Fragment } from "react";
import firebase from "firebase";

import {
  Icon,
  IconButton,
  Typography,
  Tooltip,
  Avatar,
  Chip,
  Button,
} from "@material-ui/core";

import SessionInfo from "./Dialogs/SessionInfo";

import "./Workspace.css";

function WorkspaceTitle(props) {
  const [creationDateString, setCreationDateString] = useState(null);
  const [editorProfiles, setEditorProfiles] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [infoDialog, setInfoDialog] = useState(false);

  const getSessionTitleInfo = async () => {
    if (typeof props.sessionData.createdOn === "number") {
      let date = new Date(props.sessionData.createdOn);
      let creationDate = `Created on ${date.getDate()}/${
        date.getMonth() + 1
      }/${date.getFullYear()}`;
      setCreationDateString(creationDate);
    }

    const getEditorProfiles = async () => {
      return Promise.all(
        props.sessionData.editors.map((item) =>
          firebase.database().ref(`users/${item}/profile`).get()
        )
      );
    };

    props.sessionData.editors &&
      getEditorProfiles().then((data) => {
        setEditorProfiles(data.map((e) => e.val()));
      });
  };

  const handleTagClick = () => {};

  const handleTagDelete = (index) => {
    props.setSessionData((prev) => {
      let newSessionData = { ...prev };
      newSessionData.tags = newSessionData.tags.filter((e, i) => i !== index);
      return newSessionData;
    });
  };

  useEffect(() => {
    getSessionTitleInfo();
    setExpanded(false);
  }, [props.sessionKey]);

  /*  useEffect(() => {
    console.log(editorProfiles);
  }, [editorProfiles]); */

  return (
    <div className="app-title">
      <Typography variant="h4">
        {props.sessionData.name}
        {expanded && (
          <IconButton onClick={() => setInfoDialog(true)}>
            <Icon>edit</Icon>
          </IconButton>
        )}
        {!(props.editMode && !props.user) && (
          <IconButton onClick={() => setExpanded((prev) => !prev)}>
            <Icon
              style={{
                transition: "0.2s",
                transform: expanded ? "rotate(180deg)" : "",
              }}
            >
              expand_more
            </Icon>
          </IconButton>
        )}
      </Typography>

      {!props.editMode && (
        <Tooltip title="View Mode: You don't have the permission to edit this session! To be able to edit it create a copy">
          <Icon className="app-title-alert">visibility</Icon>
        </Tooltip>
      )}
      {props.editMode && !props.user && (
        <Tooltip title="You are not logged in! Changes will not be saved">
          <Icon className="app-title-alert">no_accounts</Icon>
        </Tooltip>
      )}

      <div className="break" style={{ margin: 0 }} />
      {creationDateString && (
        <Typography variant="overline" style={{ fontSize: 10 }}>
          {`${props.sessionData.bpm} BPM - ${creationDateString}`}
        </Typography>
      )}
      <div className="break" />

      {props.sessionData.editors.length &&
        editorProfiles.map(
          (e) =>
            e !== null && (
              <Tooltip title={e.displayName}>
                <Avatar src={e.photoURL} />
              </Tooltip>
            )
        )}

      <div className="break" />

      {expanded && (
        <Fragment>
          <Typography variant="body2">{`"${props.sessionData.description}"`}</Typography>
          <div className="break" />
          {props.sessionData.tags && props.sessionData.tags.length && (
            <Fragment>
              {props.sessionData.tags.map((e, i) => (
                <Chip
                  style={{ margin: "0px 4px" }}
                  key={props.index + e}
                  label={e}
                  variant="outlined"
                  onClick={handleTagClick}
                  onDelete={() => handleTagDelete(i)}
                />
              ))}
            </Fragment>
          )}
        </Fragment>
      )}
      {infoDialog && (
        <SessionInfo
          sessionKey={props.sessionKey}
          sessionData={props.sessionData}
          setSessionData={props.setSessionData}
          onClose={() => setInfoDialog(false)}
        />
      )}
    </div>
  );
}

export default WorkspaceTitle;

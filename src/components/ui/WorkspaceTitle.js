import React, { useState, useEffect, Fragment, useRef } from "react";
import * as Tone from "tone";
import firebase from "firebase";

import { useParams } from "react-router-dom";

import {
  Fab,
  Icon,
  IconButton,
  Button,
  Typography,
  Tooltip,
  Snackbar,
  Avatar,
} from "@material-ui/core";

import "./Workspace.css";

function WorkspaceTitle(props) {
  const [creationDateString, setCreationDateString] = useState(null);
  const [editorProfiles, setEditorProfiles] = useState([]);

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

    getEditorProfiles().then((data) => {
      setEditorProfiles(data.map((e) => e.val()));
    });
  };

  useEffect(() => {
    props.sessionData && getSessionTitleInfo();
  }, [props.sessionData]);

  useEffect(() => {
    console.log(editorProfiles);
  }, [editorProfiles]);

  return (
    <div className="app-title">
      <Typography variant="h4">
        {props.sessionData && props.sessionData.name}
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
      <div className="break" />

      {editorProfiles.map((e) => (
        <Tooltip title={e.displayName}>
          <Avatar src={e.photoURL} />
        </Tooltip>
      ))}

      <div className="break" />

      {creationDateString && (
        <Typography variant="overline">{creationDateString}</Typography>
      )}
    </div>
  );
}

export default WorkspaceTitle;

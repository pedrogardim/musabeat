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

import TagInput from "../ui/Dialogs/TagInput";

import "./Workspace.css";

function WorkspaceTitle(props) {
  const [creationDateString, setCreationDateString] = useState(null);
  const [editorProfiles, setEditorProfiles] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [tagDialog, setTagDialog] = useState(false);

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
    console.log("deleting" + index);
    const sessionTagsRef = firebase
      .database()
      .ref(`sessions/${props.sessionKey}/tags`);
    const newTags = props.sessionData.tags.filter((e, i) => i !== index);
    sessionTagsRef.set(newTags);
  };

  const handleTagAdd = (tags) => {
    const sessionTagsRef = firebase
      .database()
      .ref(`sessions/${props.sessionKey}/tags`);
    const newTags = props.sessionData.tags
      ? [...props.sessionData.tags, ...tags]
      : [...tags];
    sessionTagsRef.set(newTags);
  };

  useEffect(() => {
    props.sessionData && getSessionTitleInfo();
    setExpanded(false);
  }, [props.sessionKey]);

  /*  useEffect(() => {
    console.log(editorProfiles);
  }, [editorProfiles]); */

  return (
    <div className="app-title">
      <Typography variant="h4">
        {props.sessionData && props.sessionData.name}
      </Typography>
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

      {!(props.editMode && !props.user) &&
        editorProfiles.map((e) => (
          <Tooltip title={e.displayName}>
            <Avatar src={e.photoURL} />
          </Tooltip>
        ))}

      <div className="break" />

      {expanded && (
        <Fragment>
          <Typography>{props.sessionData.description}</Typography>
          <div className="break" />
          {props.sessionData.tags && props.sessionData.tags.length ? (
            <Fragment>
              {props.sessionData.tags.map((e, i) => (
                <Chip
                  key={props.index + e}
                  label={e}
                  variant="outlined"
                  onClick={handleTagClick}
                  onDelete={() => handleTagDelete(i)}
                />
              ))}
              <IconButton
                onClick={() => setTagDialog(true)}
                style={{ height: 24, width: 24, margin: 4 }}
              >
                <Icon style={{ fontSize: 24 }}>add</Icon>
              </IconButton>
            </Fragment>
          ) : (
            <Button onClick={() => setTagDialog(true)}>ADD TAG</Button>
          )}

          <div className="break" />
          {creationDateString && (
            <Typography variant="overline" style={{ fontSize: 10 }}>
              {creationDateString}
            </Typography>
          )}
        </Fragment>
      )}
      {tagDialog && (
        <TagInput
          handleTagAdd={handleTagAdd}
          onClose={() => setTagDialog(false)}
        />
      )}
    </div>
  );
}

export default WorkspaceTitle;

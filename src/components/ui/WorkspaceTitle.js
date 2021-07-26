import React, { useState, useEffect, Fragment } from "react";
import firebase from "firebase";
import { useTranslation } from "react-i18next";

import * as Tone from "tone";

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
  const { t } = useTranslation();

  const [creationDateString, setCreationDateString] = useState(null);
  const [editorProfiles, setEditorProfiles] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [infoDialog, setInfoDialog] = useState(false);

  const getSessionTitleInfo = async () => {
    if (typeof props.sessionData.createdOn.seconds === "number") {
      let date = new Date(props.sessionData.createdOn.seconds * 1000);
      let creationDate = `${t("misc.createdOn")} ${date.getDate()}/${
        date.getMonth() + 1
      }/${date.getFullYear()}`;
      setCreationDateString(creationDate);
    }

    const getEditorProfiles = async () => {
      return Promise.all(
        props.sessionData.editors.map((user) =>
          firebase.firestore().collection("users").doc(user).get()
        )
      );
    };

    props.user &&
      props.sessionData.editors &&
      getEditorProfiles().then((data) => {
        setEditorProfiles(data.map((e) => e.data().profile));
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
  }, [props.sessionKey, props.user]);

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
        <Tooltip title={t("WSTitle.viewMode")}>
          <Icon className="app-title-alert">visibility</Icon>
        </Tooltip>
      )}
      {props.editMode && !props.user && (
        <Tooltip title={t("WSTitle.unloggedEditor")}>
          <Icon className="app-title-alert">no_accounts</Icon>
        </Tooltip>
      )}

      <div className="break" style={{ margin: 0 }} />

      {creationDateString && (
        <Typography variant="overline" style={{ fontSize: 10 }}>
          {`${props.sessionData.bpm} BPM - ${Math.floor(
            (Tone.Time("1m").toSeconds() * props.sessionSize) / 60
          )}:${(
            "0" +
            Math.floor((Tone.Time("1m").toSeconds() * props.sessionSize) % 60)
          ).slice(-2)} s - ${creationDateString}`}
        </Typography>
      )}
      <div className="break" />

      {props.sessionData.editors.length &&
        editorProfiles.map(
          (e) =>
            e !== null && (
              <Tooltip title={e.displayName}>
                <Avatar src={e.photoURL} alt={e.displayName} />
              </Tooltip>
            )
        )}

      <div className="break" />

      {expanded && (
        <Fragment>
          <Typography variant="body2">{`"${props.sessionData.description}"`}</Typography>
          <div className="break" />
          {props.sessionData.tags && !!props.sessionData.tags.length && (
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

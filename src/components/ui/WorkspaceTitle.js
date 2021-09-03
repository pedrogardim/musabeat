import React, { useState, useEffect, Fragment } from "react";
import { Helmet } from "react-helmet";

import firebase from "firebase";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";

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

import { Skeleton } from "@material-ui/lab";

import { sessionTags } from "../../assets/musicutils";

import "./Workspace.css";

function WorkspaceTitle(props) {
  const { t } = useTranslation();

  const [creationDateString, setCreationDateString] = useState(null);
  const [editorProfiles, setEditorProfiles] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const history = useHistory();

  const getSessionTitleInfo = async () => {
    let date = new Date(props.sessionData.createdOn.seconds * 1000);
    let creationDate = `${t("misc.createdOn")} ${date.getDate()}/${
      date.getMonth() + 1
    }/${date.getFullYear()}`;
    setCreationDateString(creationDate);

    const getEditorProfiles = async () => {
      return Promise.all(
        props.sessionData.editors.map(async (user) => {
          let profile = (
            await firebase.firestore().collection("users").doc(user).get()
          ).data();
          return [user, profile];
        })
      );
    };

    props.user &&
      props.sessionData.editors &&
      getEditorProfiles().then((r) => {
        r.map((e) => {
          props.user.uid === e[0] &&
            e[0] === props.sessionData.creator &&
            e[1].pr &&
            props.setPremiumMode(true);
        });
        setEditorProfiles(Object.fromEntries(r));
        //check if user is one of the editors, and if its premium
      });
  };

  const openUserPage = (id) => {
    //console.log(id);
    const win = window.open("/user/" + id, "_blank");
    win.focus();
  };

  const handleTagDelete = (index) => {
    props.setSessionData((prev) => {
      let newSessionData = { ...prev };
      newSessionData.tags = newSessionData.tags.filter((e, i) => i !== index);
      return newSessionData;
    });
  };

  useEffect(() => {
    props.sessionData && getSessionTitleInfo();
    setExpanded(false);
  }, [props.sessionData, props.sessionKey, props.user]);

  useEffect(() => {
    console.log(editorProfiles);
  }, [editorProfiles]);

  return (
    <div className="app-title">
      <Helmet>
        <title>
          {props.sessionData &&
            editorProfiles &&
            `${props.sessionData.name} by ${
              editorProfiles[props.sessionData.creator].displayName
            } `}
        </title>
      </Helmet>
      <Typography variant="h4">
        {props.sessionData ? props.sessionData.name : "..."}

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

      <Typography variant="overline" style={{ fontSize: 10 }}>
        {`${props.sessionData ? props.sessionData.bpm : "-"} BPM - ${Math.floor(
          (Tone.Time("1m").toSeconds() * (props.sessionSize || 0)) / 60
        )}:${(
          "0" +
          Math.floor(
            (Tone.Time("1m").toSeconds() * (props.sessionSize || 0)) % 60
          )
        ).slice(-2)} s - ${creationDateString || " "}`}
      </Typography>

      <div className="break" />

      {editorProfiles && Object.keys(editorProfiles).length > 0 ? (
        Object.keys(editorProfiles).map(
          (e) =>
            e !== null && (
              <Tooltip title={editorProfiles[e].profile.displayName}>
                <Avatar
                  src={editorProfiles[e].profile.photoURL}
                  alt={editorProfiles[e].profile.displayName}
                  onClick={() => openUserPage(e)}
                />
              </Tooltip>
            )
        )
      ) : (
        <Avatar />
      )}

      <div className="break" />

      {props.sessionData && expanded && (
        <Fragment>
          <Typography variant="body2">{`"${props.sessionData.description}"`}</Typography>
          <div className="break" />
          {props.sessionData.tags && !!props.sessionData.tags.length && (
            <Fragment>
              {props.sessionData.tags.map((e, i) => (
                <Chip
                  style={{ margin: "0px 4px" }}
                  key={props.index + e}
                  label={sessionTags[e]}
                  variant="outlined"
                  /* onClick={() => handleTagClick(e)} */
                  onDelete={() => handleTagDelete(i)}
                />
              ))}
            </Fragment>
          )}
        </Fragment>
      )}
    </div>
  );
}

export default WorkspaceTitle;

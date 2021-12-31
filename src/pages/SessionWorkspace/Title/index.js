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
} from "@mui/material";

import { Skeleton } from "@mui/material";

import { sessionTags } from "../../../assets/musicutils";

import "./Workspace.css";

function WorkspaceTitle(props) {
  const { t } = useTranslation();

  const [creationDateString, setCreationDateString] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const history = useHistory();

  const getSessionTitleInfo = async () => {
    let date = props.sessionData.createdOn
      ? props.sessionData.createdOn.toDate()
      : new Date();

    let creationDate = `${t("misc.createdOn")} ${date.getDate()}/${
      date.getMonth() + 1
    }/${date.getFullYear()}`;
    setCreationDateString(isNaN(date.getDate()) ? "" : creationDate);

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
          if (
            props.user.uid === e[0] &&
            e[0] === props.sessionData.creator &&
            e[1].pr !== null &&
            e[1].pr.seconds > ~~(+new Date() / 1000)
          )
            props.setPremiumMode(true);
        });
        props.setEditorProfiles(Object.fromEntries(r));
        //check if user is one of the editors, and if its premium
      });
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

  /* useEffect(() => {
    console.log(props.editorProfiles);
  }, [props.editorProfiles]); */

  return (
    <div className="workspace-title">
      <Helmet>
        <title>
          {props.sessionData &&
            props.editorProfiles !== null &&
            `${
              props.sessionData.name
                ? props.sessionData.name
                : t("WSTitle.untitledSession")
            } by ${
              props.editorProfiles[props.sessionData.creator].profile.username
            } `}
        </title>
      </Helmet>
      <span
        /* onClick={() => setExpanded((prev) => !prev)} */
        style={{
          textOverflow: "ellipsis",
          overflow: "hidden",
          color: "white",
          fontSize: "2rem",
          lineHeight: 1,
          marginRight: 8,
          display: "inline-block",
          whiteSpace: "nowrap",
          maxWidth: "20vw",
        }}
      >
        {props.sessionData
          ? props.sessionData.name
            ? props.sessionData.name
            : t("WSTitle.untitledSession")
          : "..."}
      </span>

      {/*
        !(props.editMode && !props.user) && (
          <IconButton>
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
        <Tooltip title={t("WSTitle.viewMode")}>
          <Icon className="app-title-alert">visibility</Icon>
        </Tooltip>
      )}
      {props.editMode && !props.user && (
        <Tooltip title={t("WSTitle.unloggedEditor")}>
          <Icon className="app-title-alert">no_accounts</Icon>
        </Tooltip>
      )}

      */}

      <Tooltip
        title={
          props.editorProfiles &&
          props.editorProfiles[props.sessionData.creator].profile.username
        }
      >
        <Avatar
          sx={(theme) => ({
            marginRight: 8,
            [theme.breakpoints.down("md")]: {
              height: 32,
              width: 32,
            },
          })}
          src={
            props.editorProfiles &&
            props.editorProfiles[props.sessionData.creator].profile.photoURL
          }
          alt={
            props.editorProfiles &&
            props.editorProfiles[props.sessionData.creator].profile.username
          }
          onClick={(ev) =>
            props.editorProfiles &&
            props.handlePageNav(
              "user",
              props.editorProfiles[props.sessionData.creator].profile.username,
              ev
            )
          }
        />
      </Tooltip>

      {/* props.editorProfiles !== null &&
      Object.values(props.editorProfiles).length > 0 ? (
        Object.values(props.editorProfiles).map(
          (e) =>
            e && (
              <Tooltip title={e.profile.username}>
                <Avatar
                  sx={(theme) => ({
                    marginRight: 8,
                    [theme.breakpoints.down("md")]: {
                      height: 32,
                      width: 32,
                    },
                  })}
                  src={e.profile.photoURL}
                  alt={e.profile.username}
                  onClick={(ev) =>
                    props.handlePageNav("user", e.profile.username, ev)
                  }
                />
              </Tooltip>
            )
        )
      ) : (
        <Avatar />
      ) */}

      {/* <div className="break" style={{ margin: 0 }} /> */}

      {props.sessionData && expanded && (
        <>
          <Typography variant="overline" style={{ fontSize: 10 }}>
            {`${
              props.sessionData ? props.sessionData.bpm : "-"
            } BPM - ${Math.floor(
              (Tone.Time("1m").toSeconds() * (props.sessionSize || 0)) / 60
            )}:${(
              "0" +
              Math.floor(
                (Tone.Time("1m").toSeconds() * (props.sessionSize || 0)) % 60
              )
            ).slice(-2)} s ${creationDateString && "- " + creationDateString}`}
          </Typography>

          <div className="break" />
          <Typography variant="body2">
            {props.sessionData.description
              ? `"${props.sessionData.description}"`
              : "No Description"}
          </Typography>
          <div className="break" />
          {props.sessionData.tags && !!props.sessionData.tags.length && (
            <>
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
            </>
          )}
        </>
      )}
    </div>
  );
}

export default WorkspaceTitle;

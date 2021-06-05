import React, { useState, useEffect, Fragment } from "react";
import * as Tone from "tone";

import { Paper, Typography,CircularProgress } from "@material-ui/core";

import SessionGalleryItem from "./SessionGalleryItem"

import "./SessionExplorer.css";

import firebase from "firebase";

function SessionExplorer(props) {
  const [sessions, setSessions] = useState([]);
  const [sessionsKeys, setSessionsKeys] = useState([]);


  const getUserSessionList = async () => {
    const dbRef = firebase.database().ref('users').child(props.user.uid).child('sessions');
    const userSessionKeys = (await dbRef.get()).val()
    setSessionsKeys(userSessionKeys);

    let userSessions = await Promise.all(
        userSessionKeys.map(async (e, i) => {
            let sessionRef = firebase.database().ref('sessions').child(e);
            let session = (await sessionRef.get()).val();
            return session;
        })
      );

    setSessions(userSessions);
      
  };

  const handleSessionSelect = (index) => {
      props.setOpenedSession(sessionsKeys[index])
      props.setCurrentPage(null);

  }

  useEffect(() => {
    getUserSessionList();
    return () => {
    };
  }, []);

  return (
    <div className="session-explorer">
      <Typography variant="h5">User Sessions</Typography>
      <div className="break"/>

      {!!sessions.length ? (
        <Fragment>
          {sessions.map((session, sessionIndex) => (
            <SessionGalleryItem handleSessionSelect={handleSessionSelect} index={sessionIndex} session={session} />
          ))}
        </Fragment>
      ) : (
        <CircularProgress />
      )}
    </div>
  );
}

export default SessionExplorer;

import React, { useState, useEffect, Fragment } from "react";
import * as Tone from "tone";

import { Paper, Typography, CircularProgress } from "@material-ui/core";

import SessionGalleryItem from "./SessionGalleryItem";

import "./SessionExplorer.css";

import firebase from "firebase";

function SessionExplorer(props) {
  const [sessions, setSessions] = useState([]);
  const [sessionKeys, setSessionKeys] = useState([]);
  const isUser = props.currentPage === "userSessions";

  const getSessionList = async () => {
    console.log(isUser ? "fetching user sessions" : "fetching explore");
    let dbRef = isUser
      ? firebase.database().ref("users").child(props.user.uid).child("sessions")
      : firebase.database().ref("sessions");
    const sessionKeys = (await dbRef.get()).val();
    isUser
      ? setSessionKeys(sessionKeys)
      : setSessionKeys(Object.keys((sessionKeys)));
    !isUser && setSessions(Object.values(sessionKeys));

    isUser &&
      (await Promise.all(
        sessionKeys.map(async (e, i) => {
          let sessionRef = firebase.database().ref("sessions").child(e);
          let session = (await sessionRef.get()).val();
          //console.log(session);
          setSessions((prev) => [...prev, session]);
        })
      ));
  };

  const handleSessionSelect = (index) => {
    props.setOpenedSession(sessionKeys[index]);

    props.setCurrentPage(null);
  };

  useEffect(() => {
    return () => {};
  }, []);

  useEffect(() => {
    setSessions([]);
    getSessionList();
  }, [props.currentPage]);
/* 
  useEffect(() => {
    console.log(sessionKeys, sessions);
  }, [sessions, sessionKeys]);
 */
  return (
    <div className="session-explorer">
      {!!sessions.length ? (
        <Fragment>
          {sessions.map((session, sessionIndex) => (
            <SessionGalleryItem
              handleSessionSelect={handleSessionSelect}
              key={`sgi${sessionIndex}`}
              index={sessionIndex}
              session={session}
              isUser={isUser}
            />
          ))}
        </Fragment>
      ) : (
        <CircularProgress />
      )}
    </div>
  );
}

export default SessionExplorer;

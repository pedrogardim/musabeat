import "./App.css";

import React, { useState, useEffect, Fragment } from "react";
import * as Tone from "tone";

import {
  Fab,
  Icon,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Drawer,
  Typography,
  Toolbar,
  AppBar,
} from "@material-ui/core";

import firebase from "firebase";

import Workspace from "./components/ui/Workspace";
import SessionExplorer from "./components/ui/SessionExplorer/SessionExplorer";
import FileExplorer from "./components/ui/FileExplorer/FileExplorer";
import SideMenu from "./components/ui/SideMenu";

import AuthDialog from "./components/ui/AuthDialog";

function App() {
  const [user, setUser] = useState(null);
  const [authDialog, setAuthDialog] = useState(false);
  const [userOption, setUserOption] = useState(false);
  const [sideMenu, setSideMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(null);
  const [openedSession, setOpenedSession] = useState(null);
  const [appTitle, setAppTitle] = useState("Welcome!");

  const createNewSession = () => {
    let newSession = {
      name: "New Session",
      bpm: 120,
      creator: user.uid,
      editors: [user.uid],
      modules: [
        {
          id: 0,
          name: "Sequencer",
          color: 2,
          score: [[[0], [3], [2, 0], [3], [0], [3], [2, 0], [3]]],
          instrument: {
            urls: {
              0: "https://raw.githubusercontent.com/pedrogardim/musa_loops_old/master/assets/samples/drums/808/0.wav",
              1: "https://raw.githubusercontent.com/pedrogardim/musa_loops_old/master/assets/samples/drums/808/1.wav",
              2: "https://raw.githubusercontent.com/pedrogardim/musa_loops_old/master/assets/samples/drums/808/2.wav",
              3: "https://raw.githubusercontent.com/pedrogardim/musa_loops_old/master/assets/samples/drums/808/3.wav",
              4: "https://raw.githubusercontent.com/pedrogardim/musa_loops_old/master/assets/samples/drums/808/4.wav",
              5: "https://raw.githubusercontent.com/pedrogardim/musa_loops_old/master/assets/samples/drums/808/5.wav",
              6: "https://raw.githubusercontent.com/pedrogardim/musa_loops_old/master/assets/samples/drums/808/6.wav",
              7: "https://raw.githubusercontent.com/pedrogardim/musa_loops_old/master/assets/samples/drums/808/7.wav",
              8: "https://raw.githubusercontent.com/pedrogardim/musa_loops_old/master/assets/samples/drums/808/8.wav",
              9: "https://raw.githubusercontent.com/pedrogardim/musa_loops_old/master/assets/samples/drums/808/9.wav",
            },
          },
          type: 0,
          volume: 0,
          muted: false,
        },
      ],
      copied: 0,
      opened: 0,
      likes: 0,
      likedBy: ["a"],
      createdOn: firebase.database.ServerValue.TIMESTAMP,
    };
    const sessionsRef = firebase.database().ref(`sessions`);
    const newSessionRef = sessionsRef.push();
    newSessionRef.set(newSession, setOpenedSession(newSessionRef.key));

    const userSessionsRef = firebase
      .database()
      .ref("users")
      .child(user.uid)
      .child("sessions");
    userSessionsRef.get().then((snapshot) => {
      let prev = snapshot.val() === null ? [] : snapshot.val();
      userSessionsRef.set([...prev, newSessionRef.key]);
    });

    //temp:only show workspace

    setCurrentPage(null);
  };

  const handleAvatarClick = (e) => {
    !user ? setAuthDialog(true) : setUserOption(e.currentTarget);
  };

  const handleLogOut = () => {
    firebase
      .auth()
      .signOut()
      .then((r) => console.log("singout"));
    setUserOption(false);
  };

  const handleKeyPress = (event) => {
    Tone.start();
    switch (event.code) {
      case "Space":
        Tone.start();
        if (Tone.Transport.state !== "started") {
          Tone.Transport.start();
        } else {
          Tone.Transport.pause();
        }
        break;
    }
  };

  const updateAppTitle = () => {
    setAppTitle(
      currentPage === "userSessions"
        ? "My Sessions"
        : currentPage === "exploreSessions"
        ? "Explore"
        : currentPage === "userFiles"
        ? "My Samples"
        : currentPage === null && user !== null
        ? `Welcome ${user.displayName.split(" ")[0]} ${
            user.displayName.split(" ")[1]
          }!`
        : "Welcome!"
    );
  };

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => setUser(user));
  }, []);

  useEffect(() => {
    console.log(user);
    setCurrentPage(null);
    setOpenedSession(null);
    updateAppTitle();
  }, [user]);

  useEffect(() => {
    console.log(currentPage);
    updateAppTitle();
  }, [currentPage]);

  return (
    <Fragment>
      <AppBar position="sticky">
        <Toolbar className="app-bar">
          <IconButton
            className="side-menu-icon"
            onClick={() => setSideMenu(true)}
          >
            <Icon>menu</Icon>
          </IconButton>
          <Typography variant="h4" className="app-title">
            {appTitle}
          </Typography>
          <Avatar
            onClick={handleAvatarClick}
            className="main-avatar"
            alt={user && user.displayName}
            src={user && user.photoURL}
          />
        </Toolbar>
      </AppBar>
      <div className="app-wrapper" onKeyDown={handleKeyPress}>
        {authDialog && (
          <AuthDialog
            authDialog={authDialog}
            setAuthDialog={setAuthDialog}
            setUser={setUser}
          />
        )}
        <Menu
          style={{ marginTop: 48 }}
          anchorEl={userOption}
          keepMounted
          open={Boolean(userOption)}
          onClose={() => setUserOption(false)}
        >
          <MenuItem onClick={() => setUserOption(false)}>Profile</MenuItem>
          <MenuItem onClick={() => setCurrentPage("userSessions")}>
            My Sessions
          </MenuItem>
          <MenuItem onClick={() => setCurrentPage("userFiles")}>
            My Samples
          </MenuItem>
          <MenuItem onClick={() => setUserOption(false)}>
            My Synth Patches
          </MenuItem>
          <MenuItem onClick={handleLogOut}>Logout</MenuItem>
        </Menu>
        {(currentPage === "userSessions" ||
          currentPage === "exploreSessions") && (
          <SessionExplorer
            setCurrentPage={setCurrentPage}
            currentPage={currentPage}
            setOpenedSession={setOpenedSession}
            user={user}
          />
        )}
        {currentPage === "userFiles" && (
          <FileExplorer setCurrentPage={setCurrentPage} user={user} />
        )}
        <SideMenu
          open={sideMenu}
          setCurrentPage={setCurrentPage}
          setOpenedSession={setOpenedSession}
          setSideMenu={setSideMenu}
          createNewSession={createNewSession}
        />
        {openedSession !== null && currentPage === null && (
          <Workspace
            className="workspace"
            setAppTitle={setAppTitle}
            session={openedSession}
            user={user}
          />
        )}
      </div>
    </Fragment>
  );
}

export default App;

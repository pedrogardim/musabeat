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
  Tooltip,
} from "@material-ui/core";

import firebase from "firebase";

import Workspace from "./components/ui/Workspace";
import SessionExplorer from "./components/ui/SessionExplorer/SessionExplorer";
import FileExplorer from "./components/ui/FileExplorer/FileExplorer";
import SideMenu from "./components/ui/SideMenu";
import AuthDialog from "./components/ui/AuthDialog";

import { createNewSession } from "./utils/sessionUtils";

function App() {
  const [user, setUser] = useState(null);
  const [appTitle, setAppTitle] = useState("Welcome!");
  const [isPlaying, setIsPlaying] = useState(null);
  const [authDialog, setAuthDialog] = useState(false);
  const [userOption, setUserOption] = useState(false);
  const [sideMenu, setSideMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(null);
  const [openedSession, setOpenedSession] = useState(null);
  const [sessionEditMode, setSessionEditMode] = useState(null);

  const handleCreateNewSession = (session) => {
    createNewSession(session, setCurrentPage, setOpenedSession);
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
        event.target.classList[0] === "workspace" && togglePlaying(event);
        break;
    }
  };

  const togglePlaying = (event) => {
    event.preventDefault();
    if (Tone.Transport.state !== "started") {
      Tone.Transport.start();
      setIsPlaying(true);
    } else {
      Tone.Transport.pause();
      setIsPlaying(false);
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
          <Typography
            variant="h4"
            className="app-title"
            style={{ marginRight: 8 }}
          >
            {appTitle}
          </Typography>
          {!sessionEditMode && !!openedSession && (
            <Tooltip title="View Mode: You don't have the permission to edit this session! To be able to edit it create a copy">
              <Icon>visibility</Icon>
            </Tooltip>
          )}
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
            createNewSession={handleCreateNewSession}
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
          createNewSession={handleCreateNewSession}
        />
        {openedSession !== null && currentPage === null && (
          <Workspace
            className="workspace"
            setAppTitle={setAppTitle}
            session={openedSession}
            isPlaying={isPlaying}
            togglePlaying={togglePlaying}
            user={user}
            setSessionEditMode={setSessionEditMode}
            createNewSession={handleCreateNewSession}
          />
        )}
      </div>
    </Fragment>
  );
}

export default App;

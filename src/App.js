import "./App.css";

import React, { useState, useEffect, Fragment } from "react";
import * as Tone from "tone";

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  withRouter,
  useHistory,
} from "react-router-dom";

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

import logo from "./assets/img/logo.svg";

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

  const history = useHistory();

  const handlePageNav = (route) => history.push(`/${route}`);

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
          <img className="app-logo" style={{ height: 30 }} src={logo} />
          <Avatar
            onClick={handleAvatarClick}
            className="main-avatar"
            alt={user && user.displayName}
            src={user && user.photoURL}
          />
        </Toolbar>
      </AppBar>
      <div className="app-wrapper">
        {authDialog && (
          <AuthDialog
            authDialog={authDialog}
            setAuthDialog={setAuthDialog}
            setUser={setUser}
          />
        )}
        <div className="app-title">
          <Typography variant="h4">{appTitle}</Typography>
          {!sessionEditMode && !!openedSession && (
            <Tooltip title="View Mode: You don't have the permission to edit this session! To be able to edit it create a copy">
              <Icon className="app-title-alert">visibility</Icon>
            </Tooltip>
          )}
          {sessionEditMode && !user && !!openedSession && (
            <Tooltip title="You are not logged in! Changes will not be saved">
              <Icon className="app-title-alert">no_accounts</Icon>
            </Tooltip>
          )}
        </div>

        <Menu
          style={{ marginTop: 48 }}
          anchorEl={userOption}
          keepMounted
          open={Boolean(userOption)}
          onClose={() => setUserOption(false)}
        >
          <MenuItem onClick={() => setUserOption(false)}>Profile</MenuItem>
          <MenuItem onClick={() => handlePageNav("sessions")}>
            My Sessions
          </MenuItem>
          <MenuItem onClick={() => handlePageNav("files")}>My Samples</MenuItem>
          <MenuItem onClick={() => setUserOption(false)}>
            My Synth Patches
          </MenuItem>
          <MenuItem onClick={handleLogOut}>Logout</MenuItem>
        </Menu>

        <SideMenu
          open={sideMenu}
          handlePageNav={handlePageNav}
          setOpenedSession={setOpenedSession}
          setSideMenu={setSideMenu}
          createNewSession={handleCreateNewSession}
        />

        <Switch>
          <Route exact path="/">
            <p>Home!</p>
          </Route>
          <Route exact path="/explore">
            <SessionExplorer
              setCurrentPage={setCurrentPage}
              createNewSession={handleCreateNewSession}
              setOpenedSession={setOpenedSession}
              history={history}
              user={user}
            />
          </Route>
          <Route exact path="/sessions">
            <SessionExplorer
              isUser
              setCurrentPage={setCurrentPage}
              createNewSession={handleCreateNewSession}
              setOpenedSession={setOpenedSession}
              history={history}
              user={user}
            />
          </Route>
          <Route exact path="/files">
            <FileExplorer setCurrentPage={setCurrentPage} />
          </Route>
          <Route exact path="/session/:key">
            <Workspace
              className="workspace"
              setAppTitle={setAppTitle}
              session={openedSession}
              user={user}
              setSessionEditMode={setSessionEditMode}
              createNewSession={handleCreateNewSession}
            />
          </Route>

          {openedSession !== null && currentPage === null && (
            <Workspace
              className="workspace"
              setAppTitle={setAppTitle}
              session={openedSession}
              user={user}
              setSessionEditMode={setSessionEditMode}
              createNewSession={handleCreateNewSession}
            />
          )}
        </Switch>
      </div>
    </Fragment>
  );
}

export default withRouter(App);

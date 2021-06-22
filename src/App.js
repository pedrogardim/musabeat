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
  const [openedSession, setOpenedSession] = useState(null);
  const [sessionEditMode, setSessionEditMode] = useState(null);

  const history = useHistory();

  const handlePageNav = (route, additional) => history.push(`/${route}`);

  const handleCreateNewSession = (session) => {
    createNewSession(session, handlePageNav, setOpenedSession);
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

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => setUser(user));
  }, []);

  useEffect(() => {
    console.log(user);
    //updateAppTitle();
  }, [user]);

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
          setOpenedSession={setOpenedSession}
          handlePageNav={handlePageNav}
          setSideMenu={setSideMenu}
          createNewSession={handleCreateNewSession}
        />

        <Switch>
          <Route exact path="/">
            <p>Home!</p>
          </Route>
          <Route exact path="/explore">
            <SessionExplorer
              createNewSession={handleCreateNewSession}
              history={history}
              user={user}
            />
          </Route>
          <Route exact path="/sessions">
            <SessionExplorer
              isUser
              createNewSession={handleCreateNewSession}
              history={history}
              user={user}
            />
          </Route>
          <Route exact path="/files">
            <FileExplorer />
          </Route>
          <Route exact path="/session/:key">
            <Workspace
              setAppTitle={setAppTitle}
              session={openedSession}
              user={user}
              setSessionEditMode={setSessionEditMode}
              createNewSession={handleCreateNewSession}
            />
          </Route>
        </Switch>
      </div>
    </Fragment>
  );
}

export default withRouter(App);

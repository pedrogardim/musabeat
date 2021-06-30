import "./App.css";

import React, { useState, useEffect, Fragment } from "react";

import { Switch, Route, withRouter, useHistory } from "react-router-dom";

import {
  Icon,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Toolbar,
  AppBar,
  Typography,
} from "@material-ui/core";

import firebase from "firebase";
import { useTranslation } from "react-i18next";

import logo from "./assets/img/logo.svg";

import Workspace from "./components/ui/Workspace";
import SessionExplorer from "./components/ui/SessionExplorer/SessionExplorer";
import FileExplorer from "./components/ui/FileExplorer/FileExplorer";
import SideMenu from "./components/ui/SideMenu";
import AuthDialog from "./components/ui/AuthDialog";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";

import { createNewSession } from "./utils/sessionUtils";

function App() {
  const { t } = useTranslation();
  const history = useHistory();

  const [user, setUser] = useState(null);
  const [authDialog, setAuthDialog] = useState(false);
  const [userOption, setUserOption] = useState(false);
  const [sideMenu, setSideMenu] = useState(false);
  const [openedSession, setOpenedSession] = useState(null);

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
          <div className="app-logo">
            <Typography variant="overline" className="app-log-beta-mark">
              BETA
            </Typography>
            <img alt={"musa"} style={{ height: 30 }} src={logo} />
          </div>
          <IconButton className="main-avatar">
            <Avatar
              onClick={handleAvatarClick}
              alt={user && user.displayName}
              src={user && user.photoURL}
            />
          </IconButton>
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
          <MenuItem onClick={() => setUserOption(false)}>
            {t("avatar.profile")}
          </MenuItem>
          <MenuItem onClick={() => handlePageNav("sessions")}>
            {t("avatar.userSessions")}
          </MenuItem>
          <MenuItem onClick={() => handlePageNav("files")}>
            {t("avatar.userSamples")}
          </MenuItem>
          <MenuItem onClick={() => setUserOption(false)}>
            {t("avatar.userPatches")}
          </MenuItem>
          <MenuItem onClick={handleLogOut}>{t("avatar.logOut")}</MenuItem>
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
              setOpenedSession={setOpenedSession}
              session={openedSession}
              user={user}
              createNewSession={handleCreateNewSession}
            />
          </Route>
          <Route exact path="/admin">
            {user && user.uid === "jyWfwZsyKlg1NliBOIYNmWkc3Dr1" && (
              <AdminDashboard />
            )}
          </Route>
        </Switch>
      </div>
    </Fragment>
  );
}

export default withRouter(App);

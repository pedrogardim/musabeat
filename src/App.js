import "./App.css";

import React, { useState, useEffect, Fragment, useRef } from "react";

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

import HomePage from "./components/ui/HomePage";
import Workspace from "./components/ui/Workspace";

import SessionExplorer from "./components/ui/SessionExplorer/SessionExplorer";
import FileExplorer from "./components/ui/FileExplorer/FileExplorer";
import FilePage from "./components/ui/FileExplorer/FilePage";
import PatchExplorer from "./components/ui/PatchExplorer/PatchExplorer";
import PatchPage from "./components/ui/PatchExplorer/PatchPage";
import UserPage from "./components/ui/UserPage/UserPage";

import SideMenu from "./components/ui/SideMenu";
import AuthDialog from "./components/ui/AuthDialog";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";

import { createNewSession } from "./utils/sessionUtils";

function App() {
  const { t, i18n } = useTranslation();
  const history = useHistory();

  const wrapperRef = useRef(null);

  const [user, setUser] = useState(firebase.auth().currentUser);
  const [authDialog, setAuthDialog] = useState(false);
  const [userOption, setUserOption] = useState(false);
  const [languagePicker, setLanguagePicker] = useState(false);

  const [sideMenu, setSideMenu] = useState(false);
  const [openedSession, setOpenedSession] = useState(null);

  const [isScrollBottom, setIsScrollBottom] = useState(false);

  const handlePageNav = (route, additional) => history.push(`/${route}`);

  const handleCreateNewSession = (session) => {
    createNewSession(session, handlePageNav, setOpenedSession);
  };

  const handleAvatarClick = (e) => {
    !user ? setAuthDialog(true) : setUserOption(e.currentTarget);
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    setLanguagePicker(false);
  };

  const handleLogOut = () => {
    firebase
      .auth()
      .signOut()
      .then((r) => console.log("singout"));
    setUserOption(false);
  };

  //used for some components

  const detectScrollToBottom = (e) => {
    if (e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight)
      setIsScrollBottom((prev) => !prev);
  };

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => setUser(user));
  }, []);

  useEffect(() => {
    console.log(user);
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
          <IconButton
            style={{ position: "absolute", right: 80 }}
            onClick={(e) => setLanguagePicker(e.currentTarget)}
          >
            <Icon style={{ color: "white" }}>language</Icon>
          </IconButton>
          <IconButton className="main-avatar">
            <Avatar
              onClick={handleAvatarClick}
              alt={user && user.displayName}
              src={user && user.photoURL}
            />
          </IconButton>
        </Toolbar>
      </AppBar>
      <div className="app-wrapper" onScroll={detectScrollToBottom}>
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
          open={!!userOption}
          onClose={() => setUserOption(false)}
        >
          <MenuItem onClick={() => setUserOption(false)}>
            {t("avatar.profile")}
          </MenuItem>
          <MenuItem onClick={() => handlePageNav("sessions")}>
            {t("avatar.userSessions")}
          </MenuItem>
          <MenuItem onClick={() => handlePageNav("userfiles")}>
            {t("avatar.userSamples")}
          </MenuItem>
          <MenuItem onClick={() => handlePageNav("userinstruments")}>
            {t("avatar.userPatches")}
          </MenuItem>
          <MenuItem onClick={() => handlePageNav("userdrumsets")}>
            {t("avatar.userDrumPatches")}
          </MenuItem>
          <MenuItem onClick={handleLogOut}>{t("avatar.logOut")}</MenuItem>
        </Menu>

        <Menu
          style={{ marginTop: 48 }}
          anchorEl={languagePicker}
          keepMounted
          open={!!languagePicker}
          onClose={() => setLanguagePicker(false)}
        >
          <MenuItem onClick={() => handleLanguageChange("en")}>
            English
          </MenuItem>
          <MenuItem onClick={() => handleLanguageChange("es")}>
            Español
          </MenuItem>
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
            <HomePage />
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
            <FileExplorer explore isScrollBottom={isScrollBottom} />
          </Route>
          <Route exact path="/userfiles">
            <FileExplorer userFiles isScrollBottom={isScrollBottom} />
          </Route>
          <Route exact path="/file/:key">
            <FilePage />
          </Route>

          <Route exact path="/instruments">
            <PatchExplorer explore isScrollBottom={isScrollBottom} />
          </Route>
          <Route exact path="/userinstruments">
            <PatchExplorer userPatches isScrollBottom={isScrollBottom} />
          </Route>
          <Route exact path="/instrument/:key">
            <PatchPage />
          </Route>
          <Route exact path="/drumsets">
            <PatchExplorer isDrum explore isScrollBottom={isScrollBottom} />
          </Route>
          <Route exact path="/userdrumsets">
            <PatchExplorer isDrum userPatches isScrollBottom={isScrollBottom} />
          </Route>
          <Route exact path="/drumset/:key">
            <PatchPage isDrum />
          </Route>

          <Route exact path="/session/:key">
            <Workspace
              setOpenedSession={setOpenedSession}
              session={openedSession}
              user={user}
              createNewSession={handleCreateNewSession}
            />
          </Route>
          <Route exact path="/tag/:key">
            <SessionExplorer
              isTag
              createNewSession={handleCreateNewSession}
              history={history}
              user={user}
            />
          </Route>

          <Route exact path="/user/:key">
            <UserPage history={history} user={user} />
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

import "./App.css";

import React, { useState, useEffect, Fragment, useRef } from "react";
import { Helmet } from "react-helmet";

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
  Fade,
} from "@material-ui/core";

import * as Tone from "tone";

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
import AppLogo from "./components/ui/AppLogo";

import SideMenu from "./components/ui/SideMenu";
import AuthDialog from "./components/ui/Dialogs/AuthDialog";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";

import ActionConfirm from "./components/ui/Dialogs/ActionConfirm";

import { createNewSession } from "./utils/sessionUtils";

import { createChordProgression } from "./assets/musicutils";

const pageLabels = {
  explore: "Explore",
  files: "Files",
  instruments: "Browse Instruments",
  drumsets: "Drumsets",
  userinstruments: "User Instruments",
  userdrumsets: "User Drumsets",
  userfiles: "User Files",
};

function App() {
  const { t, i18n } = useTranslation();
  const history = useHistory();

  const wrapperRef = useRef(null);

  const [user, setUser] = useState(firebase.auth().currentUser);
  const [isOnline, setIsOnline] = useState(true);
  const [authDialog, setAuthDialog] = useState(false);
  const [userOption, setUserOption] = useState(false);
  const [languagePicker, setLanguagePicker] = useState(false);

  const [sideMenu, setSideMenu] = useState(false);
  const [openedSession, setOpenedSession] = useState(null);

  const [currentRoute, setCurrentRoute] = useState(null);

  const [followingRoute, setFollowingRoute] = useState(null);

  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const handlePageNav = (route, id, newTab) => {
    if (newTab && !window.cordova) {
      const win = window.open(`/#/${route}/${id}`, "_blank");
      win.focus();
    } else {
      if (unsavedChanges && !followingRoute) {
        setFollowingRoute([route, id, newTab]);
        return;
      }

      history.push(id ? `/${route}/${id}` : `/${route}`);
      setUnsavedChanges(false);
    }
    setCurrentRoute(route);
    setFollowingRoute(null);
  };

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

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => setUser(user));
    window.addEventListener("online", () => setIsOnline(true));
    window.addEventListener("offline", () => setIsOnline(false));
  }, []);

  useEffect(() => {
    console.log(user);
  }, [user]);

  useEffect(() => {
    window.onbeforeunload = function (e) {
      if (!unsavedChanges) return;
      var dialogText = "Dialog text here";
      e.returnValue = dialogText;
      return dialogText;
    };
  }, [unsavedChanges]);

  /////TESTING

  useEffect(() => {
    console.log(createChordProgression(0, 0, 3, 4));
  }, []);

  /////TESTING

  return (
    <Fragment>
      <Fade in={false /* !isOnline */}>
        <div className="app-offline-screen">
          <AppLogo
            style={{ marginBottom: 32 }}
            className="loading-screen-logo"
            animated
          />
          <Typography align="center" variant="h5" style={{ padding: 64 }}>
            {t("misc.offlineAlert")}
          </Typography>
        </div>
      </Fade>
      <AppBar position="sticky">
        <Toolbar className="app-bar">
          <IconButton
            className="side-menu-icon"
            onClick={() => setSideMenu(true)}
          >
            <Icon>menu</Icon>
          </IconButton>
          <div className="app-logo-header">
            <AppLogo style={{ height: 30 }} src={logo} />
            <Typography variant="overline" className="app-log-beta-mark">
              BETA
            </Typography>
          </div>
          <IconButton
            style={{ position: "absolute", right: 80 }}
            onClick={(e) => setLanguagePicker(e.currentTarget)}
          >
            <Icon style={{ color: "white" }}>language</Icon>
          </IconButton>
          <IconButton className="main-avatar" onClick={handleAvatarClick}>
            <Avatar
              alt={user && user.displayName}
              src={user && user.photoURL && user.photoURL}
            />
          </IconButton>
        </Toolbar>
        {currentRoute && (
          <Helmet>
            <title>MusaBeat - {pageLabels[currentRoute] || "Home"}</title>
          </Helmet>
        )}
      </AppBar>
      <div className="app-wrapper" onMouseDown={() => Tone.start()}>
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
            <HomePage
              user={user}
              setAuthDialog={setAuthDialog}
              handlePageNav={handlePageNav}
              createNewSession={handleCreateNewSession}
            />
          </Route>
          <Route exact path="/explore">
            <SessionExplorer
              createNewSession={handleCreateNewSession}
              handlePageNav={handlePageNav}
              user={user}
            />
          </Route>
          <Route exact path="/sessions">
            <SessionExplorer
              isUser
              createNewSession={handleCreateNewSession}
              handlePageNav={handlePageNav}
              user={user}
            />
          </Route>
          <Route exact path="/files">
            <FileExplorer explore user={user} handlePageNav={handlePageNav} />
          </Route>
          <Route exact path="/userfiles">
            <FileExplorer userFiles user={user} handlePageNav={handlePageNav} />
          </Route>
          <Route exact path="/file/:key">
            <FilePage user={user} handlePageNav={handlePageNav} />
          </Route>

          <Route exact path="/instruments">
            <PatchExplorer explore user={user} handlePageNav={handlePageNav} />
          </Route>
          <Route exact path="/userinstruments">
            <PatchExplorer
              userPatches
              user={user}
              handlePageNav={handlePageNav}
            />
          </Route>
          <Route exact path="/instrument/:key">
            <PatchPage user={user} handlePageNav={handlePageNav} />
          </Route>
          <Route exact path="/drumsets">
            <PatchExplorer
              isDrum
              explore
              user={user}
              handlePageNav={handlePageNav}
            />
          </Route>
          <Route exact path="/userdrumsets">
            <PatchExplorer
              isDrum
              userPatches
              user={user}
              handlePageNav={handlePageNav}
            />
          </Route>
          <Route exact path="/drumset/:key">
            <PatchPage isDrum user={user} handlePageNav={handlePageNav} />
          </Route>

          <Route exact path="/session/:key">
            <Workspace
              setOpenedSession={setOpenedSession}
              session={openedSession}
              user={user}
              createNewSession={handleCreateNewSession}
              setUnsavedChanges={setUnsavedChanges}
              handlePageNav={handlePageNav}
            />
          </Route>
          <Route exact path="/user/:key">
            {user && <UserPage handlePageNav={handlePageNav} user={user} />}
          </Route>

          <Route exact path="/admin">
            {user && user.uid === "jyWfwZsyKlg1NliBOIYNmWkc3Dr1" && (
              <AdminDashboard />
            )}
          </Route>
        </Switch>
      </div>
      <ActionConfirm
        unsavedChanges
        open={Boolean(followingRoute)}
        onClose={() => setFollowingRoute(null)}
        action={() => handlePageNav(...followingRoute)}
      />
    </Fragment>
  );
}

export default withRouter(App);

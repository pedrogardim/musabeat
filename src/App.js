import React, { useState, useEffect, useRef, useMemo } from "react";
import { Helmet } from "react-helmet";

import "./App.css";

import { Switch, Route, withRouter, useHistory } from "react-router-dom";

import {
  Box,
  Icon,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Toolbar,
  AppBar,
  Typography,
  Fade,
  ThemeProvider,
  createTheme,
  useMediaQuery,
} from "@mui/material";

import * as Tone from "tone";

import firebase from "firebase";
import { useTranslation } from "react-i18next";

import logo from "./assets/img/logo.svg";

import HomePage from "./pages/HomePage";
import SessionWorkspace from "./pages/SessionWorkspace";

import SessionExplorer from "./components/SessionExplorer";
//import FileExplorer from "./components/FileExplorer";
//import PatchExplorer from "./components/PatchExplorer";
import ListExplorer from "./components/ListExplorer";
import FilePage from "./pages/FilePage";
import PatchPage from "./pages/PatchPage";
import UserPage from "./pages/UserPage";
import NotFoundPage from "./pages/NotFoundPage";

import AppLogo from "./components/AppLogo";
import SideMenu from "./components/SideMenu";
import Admin from "./pages/Admin";

import AuthDialog from "./components/dialogs/Auth";
import NewSessionDialog from "./components/dialogs/NewSession";
import Confirm from "./components/dialogs/Confirm";

import { createNewSession } from "./services/Session/Session";

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

  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? "dark" : "light",
          primary: { main: "#3F51B5" },
          secondary: { main: "#ED254E" },
        },
        typography: {
          h4: {
            fontFamily: '"Barlow Semi Condensed", sans-serif',
            fontSize: "2rem",
            lineHeight: 1,
          },
          body1: {
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: 1,
          },
        },
        components: {
          MuiTypography: {
            defaultProps: {
              variantMapping: {
                h1: "h2",
                h2: "h2",
                h3: "h2",
                h4: "span",
                h5: "h2",
                h6: "h2",
                subtitle1: "h2",
                subtitle2: "h2",
                body1: "span",
                body2: "span",
              },
            },
          },
        },
      }),
    [prefersDarkMode]
  );

  const wrapperRef = useRef(null);

  const [user, setUser] = useState(firebase.auth().currentUser);
  const [isOnline, setIsOnline] = useState(true);
  const [authDialog, setAuthDialog] = useState(false);
  const [userOption, setUserOption] = useState(false);
  const [languagePicker, setLanguagePicker] = useState(false);

  const [sideMenu, setSideMenu] = useState(false);

  //can be boolean (opened, empty), or object (session to copy)

  const [newSessionDialog, setNewSessionDialog] = useState(false);

  //const [premiumMode, setPremiumMode] = useState(false);

  const [openedSession, setOpenedSession] = useState(null);
  const [currentRoute, setCurrentRoute] = useState(null);
  const [followingRoute, setFollowingRoute] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const [bottomScroll, setBottomScroll] = useState(false);

  const handlePageNav = (route, id, e) => {
    if (e && (e.metaKey || e.ctrlKey)) {
      const win = window.open(`/#/${route}/${id}`, "_blank");
      win.focus();
    } else {
      if (unsavedChanges && !followingRoute) {
        setFollowingRoute([route, id]);
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

  const detectScrollToBottom = (e) => {
    if (e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight)
      setBottomScroll(true);
  };

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => setUser(user));
    window.addEventListener("online", () => setIsOnline(true));
    window.addEventListener("offline", () => setIsOnline(false));
  }, []);

  useEffect(() => {
    //console.log(user);
  }, [user]);

  useEffect(() => {
    window.onbeforeunload = function (e) {
      if (!unsavedChanges) return;
      var dialogText = "Dialog text here";
      e.returnValue = dialogText;
      return dialogText;
    };
  }, [unsavedChanges]);

  /*  useEffect(() => {
    console.log(bottomScroll);
  }, [bottomScroll]); */

  /////TESTING

  /* useEffect(() => {
    console.log(createChordProgression(0, 0, 3, 4));
  }, []); */

  /////TESTING

  return (
    <ThemeProvider theme={theme}>
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
      <AppBar
        sx={(theme) => ({
          [theme.breakpoints.down("md")]: {
            height: "40px",
            maxHeight: "40px",
            minHeight: "40px",
          },
        })}
        position="sticky"
      >
        <Toolbar
          className="app-bar"
          sx={(theme) => ({
            [theme.breakpoints.down("md")]: {
              height: "40px",
              maxHeight: "40px",
              minHeight: "40px",
            },
          })}
        >
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
              sx={(theme) => ({
                [theme.breakpoints.down("md")]: {
                  height: 32,
                  width: 32,
                },
              })}
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
      <Box
        className="app-wrapper"
        onMouseDown={() => Tone.start()}
        onScroll={(e) => detectScrollToBottom(e)}
        sx={{ bgcolor: "background.default" }}
      >
        <Menu
          style={{ marginTop: 48 }}
          anchorEl={userOption}
          keepMounted
          open={!!userOption}
          onClose={() => setUserOption(false)}
        >
          <MenuItem onClick={(e) => handlePageNav("user", user.displayName, e)}>
            {t("avatar.profile")}
          </MenuItem>
          <MenuItem onClick={(e) => handlePageNav("sessions", "", e)}>
            {t("avatar.userSessions")}
          </MenuItem>
          <MenuItem onClick={(e) => handlePageNav("userfiles", "", e)}>
            {t("avatar.userSamples")}
          </MenuItem>
          <MenuItem onClick={(e) => handlePageNav("userinstruments", "", e)}>
            {t("avatar.userPatches")}
          </MenuItem>
          <MenuItem onClick={(e) => handlePageNav("userdrumsets", "", e)}>
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
          setNewSessionDialog={setNewSessionDialog}
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
              createNewSession={() => setNewSessionDialog(true)}
              handlePageNav={handlePageNav}
              user={user}
              setNewSessionDialog={setNewSessionDialog}
            />
          </Route>
          <Route exact path="/sessions">
            <SessionExplorer
              isUser
              createNewSession={() => setNewSessionDialog(true)}
              handlePageNav={handlePageNav}
              user={user}
              setNewSessionDialog={setNewSessionDialog}
            />
          </Route>
          <Route exact path="/files">
            <ListExplorer
              type="files"
              explore
              user={user}
              handlePageNav={handlePageNav}
              bottomScroll={bottomScroll}
              setBottomScroll={setBottomScroll}
            />
          </Route>
          <Route exact path="/userfiles">
            <ListExplorer
              type="files"
              userPage
              user={user}
              handlePageNav={handlePageNav}
              bottomScroll={bottomScroll}
              setBottomScroll={setBottomScroll}
            />
          </Route>
          <Route exact path="/file/:key">
            <FilePage user={user} handlePageNav={handlePageNav} />
          </Route>

          <Route exact path="/instruments">
            <ListExplorer
              explore
              type="instr"
              user={user}
              handlePageNav={handlePageNav}
              bottomScroll={bottomScroll}
              setBottomScroll={setBottomScroll}
            />
          </Route>
          <Route exact path="/userinstruments">
            <ListExplorer
              userPage
              type="instr"
              user={user}
              bottomScroll={bottomScroll}
              setBottomScroll={setBottomScroll}
              handlePageNav={handlePageNav}
            />
          </Route>
          <Route exact path="/instrument/:key">
            <PatchPage user={user} handlePageNav={handlePageNav} />
          </Route>
          <Route exact path="/drumsets">
            <ListExplorer
              type="seq"
              explore
              user={user}
              handlePageNav={handlePageNav}
              bottomScroll={bottomScroll}
              setBottomScroll={setBottomScroll}
            />
          </Route>
          <Route exact path="/userdrumsets">
            <ListExplorer
              type="seq"
              userPage
              user={user}
              handlePageNav={handlePageNav}
              bottomScroll={bottomScroll}
              setBottomScroll={setBottomScroll}
            />
          </Route>
          <Route exact path="/drumset/:key">
            <PatchPage isDrum user={user} handlePageNav={handlePageNav} />
          </Route>

          <Route exact path="/session/:key">
            <SessionWorkspace
              setOpenedSession={setOpenedSession}
              session={openedSession}
              user={user}
              setUser={setUser}
              createNewSession={handleCreateNewSession}
              setUnsavedChanges={setUnsavedChanges}
              setNewSessionDialog={setNewSessionDialog}
              handlePageNav={handlePageNav}
            />
          </Route>
          <Route exact path="/user/:key">
            <UserPage
              handlePageNav={handlePageNav}
              user={user}
              setNewSessionDialog={setNewSessionDialog}
            />
          </Route>

          <Route exact path="/admin">
            {user && user.uid === "jyWfwZsyKlg1NliBOIYNmWkc3Dr1" && <Admin />}
          </Route>

          <Route exact path="/list">
            <ListExplorer
              explore
              type="files"
              user={user}
              handlePageNav={handlePageNav}
              bottomScroll={bottomScroll}
              setBottomScroll={setBottomScroll}
            />
          </Route>
          <Route>
            <NotFoundPage
              type="page"
              handlePageNav={(e) => handlePageNav("", "", e)}
            />
          </Route>
        </Switch>
      </Box>
      {newSessionDialog && (
        <NewSessionDialog
          newSessionDialog={newSessionDialog}
          setNewSessionDialog={setNewSessionDialog}
          handleCreateNewSession={handleCreateNewSession}
        />
      )}
      {authDialog && (
        <AuthDialog
          authDialog={authDialog}
          setAuthDialog={setAuthDialog}
          setUser={setUser}
        />
      )}

      <Confirm
        unsavedChanges
        open={Boolean(followingRoute)}
        onClose={() => setFollowingRoute(null)}
        action={() => handlePageNav(...followingRoute)}
      />
    </ThemeProvider>
  );
}

export default withRouter(App);

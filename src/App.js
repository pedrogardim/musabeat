import "./App.css";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Helmet } from "react-helmet";

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

import * as MUIColors from "@mui/material/colors";

import * as Tone from "tone";

import firebase from "firebase";
import { useTranslation } from "react-i18next";

import logo from "./assets/img/logo.svg";

import HomePage from "./components/ui/HomePage";
import Workspace from "./components/Workspace/Workspace";

import SessionExplorer from "./components/ui/SessionExplorer/SessionExplorer";
import FileExplorer from "./components/ui/FileExplorer/FileExplorer";
import FilePage from "./components/ui/FileExplorer/FilePage";
import PatchExplorer from "./components/ui/PatchExplorer/PatchExplorer";
import PatchPage from "./components/ui/PatchExplorer/PatchPage";
import UserPage from "./components/ui/UserPage/UserPage";
import AppLogo from "./components/ui/AppLogo";
import NotFoundPage from "./components/ui/NotFoundPage";

import SideMenu from "./components/ui/SideMenu";
import AuthDialog from "./components/ui/Dialogs/AuthDialog";
import NewSessionDialog from "./components/ui/Dialogs/NewSessionDialog";

import AdminDashboard from "./components/AdminDashboard/AdminDashboard";

import ActionConfirm from "./components/Dialogs/ActionConfirm";

import { createNewSession } from "./utils/sessionUtils";

import { createChordProgression } from "./assets/musicutils";

const colors = [
  MUIColors.red,
  MUIColors.purple,
  MUIColors.deepPurple,
  MUIColors.indigo,
  MUIColors.blue,
  MUIColors.lightBlue,
  MUIColors.cyan,
  MUIColors.teal,
  MUIColors.green,
  MUIColors.lightGreen,
  MUIColors.lime,
  MUIColors.yellow,
  MUIColors.amber,
  MUIColors.orange,
  MUIColors.deepOrange,
];

const defaultTheme = createTheme();

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
            <FileExplorer
              explore
              user={user}
              handlePageNav={handlePageNav}
              bottomScroll={bottomScroll}
              setBottomScroll={setBottomScroll}
            />
          </Route>
          <Route exact path="/userfiles">
            <FileExplorer
              userFiles
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
            <PatchExplorer
              explore
              user={user}
              handlePageNav={handlePageNav}
              bottomScroll={bottomScroll}
              setBottomScroll={setBottomScroll}
            />
          </Route>
          <Route exact path="/userinstruments">
            <PatchExplorer
              userPatches
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
            <PatchExplorer
              isDrum
              explore
              user={user}
              handlePageNav={handlePageNav}
              bottomScroll={bottomScroll}
              setBottomScroll={setBottomScroll}
            />
          </Route>
          <Route exact path="/userdrumsets">
            <PatchExplorer
              isDrum
              userPatches
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
            <Workspace
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
            {user && user.uid === "jyWfwZsyKlg1NliBOIYNmWkc3Dr1" && (
              <AdminDashboard />
            )}
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

      <ActionConfirm
        unsavedChanges
        open={Boolean(followingRoute)}
        onClose={() => setFollowingRoute(null)}
        action={() => handlePageNav(...followingRoute)}
      />
    </ThemeProvider>
  );
}

export default withRouter(App);

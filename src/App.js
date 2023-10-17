import React, { useState, useEffect, useRef, useMemo } from "react";
import { Helmet } from "react-helmet";

import "./App.css";

import {
  Switch,
  Route,
  withRouter,
  useHistory,
  Link as RouterLink,
} from "react-router-dom";

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
  ThemeProvider,
  createTheme,
  useMediaQuery,
  Button,
  Link,
} from "@mui/material";

import CssBaseline from "@mui/material/CssBaseline";

import * as Tone from "tone";

import firebase from "firebase";
import { useTranslation } from "react-i18next";

import logo from "./assets/img/logo.svg";

import HomePage from "./pages/HomePage";
import SessionWorkspace from "./pages/SessionWorkspace";

import SessionExplorer from "./components/SessionExplorer";
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

  const darkModeMediaQuery = useMediaQuery("(prefers-color-scheme: dark)");

  const [darkMode, setDarkMode] = useState(darkModeMediaQuery);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
          primary: { main: "#3F51B5", light: "#3F51B5", dark: "#3F51B5" },
          secondary: { main: "#ED254E", light: "#ED254E", dark: "#ED254E" },
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
                h4: "h4",
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
    [darkMode]
  );

  const wrapperRef = useRef(null);

  const [user, setUser] = useState(firebase.auth().currentUser);
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
      const win = window.open(`/${route}/${id}`, "_blank");
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
  }, []);

  useEffect(() => {
    setDarkMode(darkModeMediaQuery);
  }, [darkModeMediaQuery]);

  useEffect(() => {
    window.onbeforeunload = function (e) {
      if (!unsavedChanges) return;
      var dialogText = "Dialog text here";
      e.returnValue = dialogText;
      return dialogText;
    };
  }, [unsavedChanges]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="sticky">
        <Toolbar className="app-bar">
          {/* <IconButton
            className="side-menu-icon"
            onClick={() => setSideMenu(true)}
          >
            <Icon>menu</Icon>
          </IconButton> */}
          <div className="app-logo-header">
            <RouterLink to="/">
              <AppLogo style={{ height: 30 }} src={logo} />
            </RouterLink>
            <Typography variant="overline" className="app-log-beta-mark">
              By{" "}
              <Link href="https://pedrogardim.com" target="_blank">
                Pedro Gardim
              </Link>
            </Typography>
          </div>
          <IconButton
            style={{ position: "absolute", right: user ? 80 : 96 }}
            onClick={(e) => setLanguagePicker(e.currentTarget)}
          >
            <Icon style={{ color: "white" }}>language</Icon>
          </IconButton>
          {user ? (
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
          ) : (
            <Button
              className="login-button"
              variant="contained"
              color="primary"
              onClick={() => setAuthDialog(true)}
            >
              Login
            </Button>
          )}
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
          // style={{ marginTop: 48 }}
          anchorEl={userOption}
          keepMounted
          open={!!userOption}
          onClose={() => setUserOption(false)}
        >
          <MenuItem onClick={(e) => handlePageNav("sessions", "", e)}>
            {t("avatar.userSessions")}
          </MenuItem>
          <MenuItem onClick={(e) => handlePageNav("userfiles", "", e)}>
            {t("avatar.userSamples")}
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

        {/* <SideMenu
          open={sideMenu}
          setOpenedSession={setOpenedSession}
          handlePageNav={handlePageNav}
          setSideMenu={setSideMenu}
          setNewSessionDialog={setNewSessionDialog}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        /> */}

        <Switch>
          <Route exact path="/">
            <HomePage
              user={user}
              setAuthDialog={setAuthDialog}
              handlePageNav={handlePageNav}
              createNewSession={() => setNewSessionDialog(true)}
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

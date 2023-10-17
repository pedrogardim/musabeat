import React, { useState, useEffect, useRef } from "react";
import firebase from "firebase";
import { useTranslation } from "react-i18next";

import { Icon, Typography, Fab, Link } from "@mui/material";

import SessionExplorer from "../../components/SessionExplorer";

import "./style.css";

function HomePage(props) {
  const { t } = useTranslation();

  return (
    <div className="home-page">
      <div className="home-page-card">
        <Typography
          variant="h4"
          sx={{ textAlign: "left", fontWeight: "bold", width: "100%" }}
        >
          Explore
        </Typography>
        <Typography
          variant="body1"
          sx={{ textAlign: "left", pt: 2, textTransform: "none" }}
        >
          Hey! Welcome to MusaBeat, a web music creation app. Explore the
          sessions created by other users or create your own. Create a account
          to save all your sessions and get access to all the features of
          MusaBeat.
          <br />
          Created by{" "}
          <Link href="https://pedrogardim.com" target="_blank">
            Pedro Gardim
          </Link>
          .
        </Typography>
      </div>

      <div
        className="home-page-card"
        style={{ position: "relative", flexGrow: 1 }}
      >
        <SessionExplorer compact handlePageNav={props.handlePageNav} />
      </div>

      <Fab
        className="home-page-new-session-btn"
        color="primary"
        variant="extended"
        sx={{ zIndex: 2 }}
        onClick={() =>
          props.createNewSession(
            undefined,
            props.handlePageNav,
            props.setOpenedSession
          )
        }
      >
        <Icon style={{ marginRight: 8 }}>add_circle</Icon>
        {t("sidemenu.newSession")}
      </Fab>
    </div>
  );
}

export default HomePage;

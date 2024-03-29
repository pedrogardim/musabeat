import React from "react";

import { Typography, Button } from "@mui/material";
import { useTranslation } from "react-i18next";

function NotFoundPage(props) {
  const { t } = useTranslation();

  const types = {
    patchExplorer: {
      emoji: "🏝️",
      text: "misc.nothingFound",
      button: false,
    },
    fileExplorer: {
      emoji: "🏝️",
      text: "misc.nothingFound",
      button: false,
    },
    filePage: {
      emoji: "🙈",
      text: "fileExplorer.fileNotFound",
      button: "sidemenu.files",
    },
    patchPage: {
      emoji: "🙈",
      text: "patchExplorer.patchNotFound",
      button: "sidemenu.explore",
    },
    workspace: {
      emoji: "🙈",
      text: "workspace.sessionNotFound",
      button: "sidemenu.explore",
    },
    sessionExplorer: {
      emoji: "🕳️",
      text: "misc.nothingFound",
      button: "sidemenu.newSession",
    },
    emptySequencer: {
      emoji: "🎛️",
      text: "instrumentEditor.noFiles",
      button: "instrumentEditor.addFile",
    },
    emptySession: {
      emoji: "🏝️",
      text: "workspace.empty",
    },
    user: {
      emoji: "🙈",
      text: "user.userNotFound",
    },
    page: {
      emoji: "🙈",
      text: "misc.pageNotFound",
      button: "sidemenu.home",
    },
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        alignContent: "center",
        flex: 1,
        height: "100%",
      }}
    >
      <Typography variant="h1">{types[props.type].emoji}</Typography>
      <Typography variant="overline">{t(types[props.type].text)}</Typography>
      {types[props.type].button && (
        <Button color="primary" onClick={props.handlePageNav}>
          {t(types[props.type].button)}
        </Button>
      )}
    </div>
  );
}

export default NotFoundPage;

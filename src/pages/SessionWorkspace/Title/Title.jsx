import React, { useState, useContext } from "react";

import { useTranslation } from "react-i18next";

import { Icon, IconButton } from "@mui/material";

import wsCtx from "../../../context/SessionWorkspaceContext";

function WorkspaceTitle(props) {
  const { t } = useTranslation();

  const { paramSetter } = useContext(wsCtx);

  return (
    <div className="workspace-title">
      <span
        style={{
          textOverflow: "ellipsis",
          overflow: "hidden",
          color: "white",
          fontSize: "2rem",
          lineHeight: 1,
          marginRight: 8,
          display: "inline-block",
          whiteSpace: "nowrap",
          maxWidth: "20vw",
        }}
      >
        {props.sessionData
          ? props.sessionData.name
            ? props.sessionData.name
            : t("WSTitle.untitledSession")
          : "..."}
      </span>
      {props.editMode && (
        <IconButton onClick={() => paramSetter("openDialog", "options")}>
          <Icon>edit</Icon>
        </IconButton>
      )}
    </div>
  );
}

export default WorkspaceTitle;

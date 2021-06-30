import React, { useState } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  DialogContentText,
  Input,
  FormControl,
  InputLabel,
} from "@material-ui/core";

import { useTranslation } from "react-i18next";

import "./SessionInfo.css";

function SessionInfo(props) {
  const { t } = useTranslation();

  const [sessionName, setSessionName] = useState(props.sessionData.name);
  const [description, setDescription] = useState(props.sessionData.description);

  const [tags, setTags] = useState(
    props.sessionData.tags ? props.sessionData.tags.join(" ") : ""
  );

  const handleSubmit = () => {
    props.setSessionData((prev) => {
      let newSessionData = { ...prev };
      newSessionData.name = sessionName;
      newSessionData.description = description;
      newSessionData.tags = tags.split(" ");
      return newSessionData;
    });
    props.onClose();
  };

  return (
    <Dialog open="true" onClose={props.onClose}>
      <DialogTitle>{t("dialogs.sessionInfo")}</DialogTitle>
      <DialogContent className="session-info-dialog">
        <FormControl>
          <InputLabel labelFor="si1">{t("info.name")}</InputLabel>
          <Input
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            id="si1"
          ></Input>
        </FormControl>
        <div className="break" />
        <FormControl>
          <InputLabel labelFor="si2">{t("info.description")}</InputLabel>
          <Input
            value={description}
            rows={2}
            maxRows={6}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            id="si2"
          ></Input>
        </FormControl>
        <div className="break" />
        <FormControl>
          <InputLabel labelFor="si3">{t("info.tags")}</InputLabel>
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            multiline
            id="si3"
            name="AAAA"
          ></Input>
        </FormControl>
      </DialogContent>

      <DialogActions>
        <Button onClick={props.onClose}> {t("dialogs.cancel")}</Button>
        <Button color="primary" onClick={handleSubmit}>
          {t("dialogs.submit")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SessionInfo;

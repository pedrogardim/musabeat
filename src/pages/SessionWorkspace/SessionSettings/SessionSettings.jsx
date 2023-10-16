import React, { useState, useEffect } from "react";
import * as Tone from "tone";

import {
  IconButton,
  Icon,
  Dialog,
  Grid,
  TextField,
  Button,
} from "@mui/material";

import { useTranslation } from "react-i18next";

import AddUser from "../../../components/dialogs/AddUser";

import "./style.css";

function SessionSettings(props) {
  const { t } = useTranslation();

  const [newSessionData, setNewSessionData] = useState(props.sessionData);
  const [userDialog, setUserDialog] = useState(false);

  const handleInfoChange = (field, value) => {
    setNewSessionData((prev) => {
      let a = { ...prev };
      a[field] = value;
      return a;
    });
  };

  useEffect(() => {
    !props.open && props.setSessionData(newSessionData);
  }, [props.open]);

  useEffect(() => {
    setNewSessionData(props.sessionData);
  }, [props.sessionData]);

  return (
    <>
      {
        <Dialog
          fullWidth
          maxWidth="xs"
          open={props.open}
          onClose={props.onClose}
          PaperProps={{ className: "session-settings-cont" }}
        >
          <Grid container direction="row" wrap="wrap" spacing={2}>
            <Grid item sm={12} md={12} xl={12} lg={12} xs={12}>
              <TextField
                variant="standard"
                style={{ width: "100%" }}
                value={newSessionData.name}
                onChange={(e) =>
                  handleInfoChange("name", e.target.value.slice(0, 63))
                }
                label={t("info.name")}
              />
              <Button
                onClick={props.onClose}
                variant="contained"
                sx={{ mt: 2 }}
              >
                Save
              </Button>
            </Grid>
          </Grid>
          <IconButton
            onClick={props.onClose}
            className="mp-closebtn"
            color="primary"
          >
            <Icon>close</Icon>
          </IconButton>
        </Dialog>
      }

      <AddUser
        open={userDialog}
        onClose={() => setUserDialog(false)}
        setNewSessionData={setNewSessionData}
        setEditorProfiles={props.setEditorProfiles}
      />
    </>
  );
}

export default SessionSettings;

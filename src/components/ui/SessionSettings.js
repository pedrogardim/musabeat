import React, { useState, useRef, Fragment, useEffect } from "react";
import * as Tone from "tone";

import {
  IconButton,
  Icon,
  Dialog,
  Paper,
  Typography,
  Input,
  Slider,
  Grid,
  TextField,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
  Tooltip,
  Select,
  Avatar,
} from "@material-ui/core";

import { sessionTags, scales, musicalNotes } from "../../assets/musicutils";

import { useTranslation } from "react-i18next";

import { Autocomplete } from "@material-ui/lab";

import AddUserDialog from "../ui/Dialogs/AddUserDialog";

import "./SessionSettings.css";

function SessionSettings(props) {
  const { t } = useTranslation();

  const btnRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [newSessionData, setNewSessionData] = useState(props.sessionData);
  const [userDialog, setUserDialog] = useState(false);
  const sessionData = props.sessionData;

  const handleBpmChange = (field, value) => {
    Tone.Transport.bpm.value = value;
    handleInfoChange("bpm", value);
  };

  const handleInfoChange = (field, value) => {
    setNewSessionData((prev) => {
      let a = { ...prev };
      a[field] = value;
      return a;
    });
  };

  useEffect(() => {
    !open && props.setSessionData(newSessionData);
  }, [open]);

  return (
    <Fragment>
      <IconButton
        ref={btnRef}
        color="primary"
        className="ws-fab ws-fab-settings"
        tabIndex={-1}
        onClick={() => setOpen(true)}
      >
        <Icon>settings</Icon>
      </IconButton>
      {sessionData && (
        <Dialog
          fullWidth
          maxWidth="md"
          open={open}
          onClose={() => setOpen(false)}
          PaperProps={{ className: "session-settings-cont" }}
        >
          <Grid container direction="row" wrap="wrap" spacing={2}>
            <Grid
              container
              item
              direction="row"
              alignItems="stretch"
              sm={6}
              spacing={2}
            >
              <Grid item sm={12} md={12} xl={12} lg={12} xs={12}>
                <TextField
                  style={{ width: "100%" }}
                  value={newSessionData.name}
                  onChange={(e) => handleInfoChange("name", e.target.value)}
                  label={t("info.name")}
                />
              </Grid>
              <Grid item sm={12} md={12} xl={12} lg={12} xs={12}>
                <TextField
                  style={{ width: "100%" }}
                  value={newSessionData.description}
                  rows={2}
                  label={t("info.description")}
                  maxRows={6}
                  onChange={(e) =>
                    handleInfoChange("description", e.target.value)
                  }
                  multiline
                />
              </Grid>
              <Grid item sm={12} md={12} xl={12} lg={12} xs={12}>
                <Autocomplete
                  multiple
                  className={""}
                  options={Array(129)
                    .fill()
                    .map((e, i) => (e = i))}
                  renderInput={(params) => (
                    <TextField {...params} label={"Tags"} />
                  )}
                  onChange={(e, v) => handleInfoChange("tags", v)}
                  value={newSessionData.tags}
                  getOptionLabel={(e) => sessionTags[e]}
                />
              </Grid>

              <Grid
                className="session-settings-tabs-cont"
                item
                sm={12}
                md={12}
                xl={12}
                lg={12}
                xs={12}
              >
                <Tooltip
                  title={
                    !props.premiumMode
                      ? "Upgrade to Premium to use this feature"
                      : "Session won't show up on explore"
                  }
                  interactive={!props.premiumMode}
                  placement="top-start"
                >
                  <FormControlLabel
                    className="session-settings-checkbox-lbl"
                    control={
                      <Checkbox
                        color="primary"
                        checked={newSessionData.hid}
                        disabled={!props.premiumMode}
                        onChange={(e) =>
                          handleInfoChange("hid", e.target.checked)
                        }
                      />
                    }
                    label="Hidden session"
                    labelPlacement="end"
                  />
                </Tooltip>
                <Tooltip
                  title={
                    !props.premiumMode
                      ? "Upgrade to Premium to use this feature"
                      : "Users won't be able to copy this session"
                  }
                  interactive={!props.premiumMode}
                  placement="top-start"
                >
                  <FormControlLabel
                    className="session-settings-checkbox-lbl"
                    control={
                      <Checkbox
                        color="primary"
                        checked={newSessionData.alwcp}
                        disabled={!props.premiumMode}
                        onChange={(e) =>
                          handleInfoChange("alwcp", e.target.checked)
                        }
                      />
                    }
                    label="Allow Copies"
                    labelPlacement="end"
                  />
                </Tooltip>
                <Tooltip
                  title={
                    !props.premiumMode
                      ? "Upgrade to Premium to use this feature"
                      : "Edit this session in real-time with other users"
                  }
                  interactive={!props.premiumMode}
                  placement="top-start"
                >
                  <FormControlLabel
                    className="session-settings-checkbox-lbl"
                    control={
                      <Checkbox
                        color="primary"
                        checked={newSessionData.rte}
                        disabled={!props.premiumMode}
                        onChange={(e) =>
                          handleInfoChange("rte", e.target.checked)
                        }
                      />
                    }
                    label="Real-time Editing"
                    labelPlacement="end"
                  />
                </Tooltip>
              </Grid>
            </Grid>

            <Grid container item direction="column" sm={6}>
              <Grid item>
                <Typography variant="overline">Tempo</Typography>
                <Slider
                  min={40}
                  max={300}
                  defaultValue={sessionData.bpm}
                  valueLabelDisplay="auto"
                  onChangeCommitted={handleBpmChange}
                />
              </Grid>
              <Grid item>
                <Typography variant="overline">
                  {t("module.settings.sessionScale")}
                </Typography>
                <div className="break" />

                <Select
                  native
                  defaultValue={sessionData.root}
                  onChange={(e) => handleInfoChange("root", e.target.value)}
                >
                  {musicalNotes.map((note, noteIndex) => (
                    <option key={noteIndex} value={noteIndex}>
                      {note}
                    </option>
                  ))}
                </Select>
                <Select
                  native
                  defaultValue={sessionData.scale}
                  onChange={(e) => handleInfoChange("scale", e.target.value)}
                >
                  {scales.map((scale, scaleIndex) => (
                    <option key={scaleIndex} value={scaleIndex}>
                      {t(`music.scales.${scaleIndex}`)}
                    </option>
                  ))}
                </Select>
              </Grid>
              <div className="break" style={{ height: 16 }} />

              <Grid item>
                <Typography variant="overline">{t("Editors")}</Typography>
                <div style={{ display: "flex", flexDirection: "row" }}>
                  {props.editorProfiles !== null &&
                  Object.values(props.editorProfiles).length > 0 ? (
                    Object.values(props.editorProfiles).map(
                      (e) =>
                        e && (
                          <Tooltip title={e.profile.username}>
                            <Avatar
                              src={e.profile.photoURL}
                              alt={e.profile.username}
                              style={{ marginRight: 8 }}
                              onClick={() =>
                                props.handlePageNav(
                                  "user",
                                  e.profile.username,
                                  true
                                )
                              }
                            />
                          </Tooltip>
                        )
                    )
                  ) : (
                    <Avatar />
                  )}
                  <IconButton
                    style={{ height: 40, width: 40 }}
                    onClick={() => setUserDialog(true)}
                  >
                    <Icon>add</Icon>
                  </IconButton>
                </div>
              </Grid>
            </Grid>
          </Grid>
          <IconButton
            onClick={() => setOpen(false)}
            className="mp-closebtn"
            color="primary"
          >
            <Icon>close</Icon>
          </IconButton>
        </Dialog>
      )}

      <AddUserDialog
        open={userDialog}
        onClose={() => setUserDialog(false)}
        setNewSessionData={setNewSessionData}
        setEditorProfiles={props.setEditorProfiles}
      />
    </Fragment>
  );
}

export default SessionSettings;

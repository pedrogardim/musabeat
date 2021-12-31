import React, { useState, useEffect } from "react";
import * as Tone from "tone";

import {
  IconButton,
  Icon,
  Dialog,
  Typography,
  Slider,
  Grid,
  TextField,
  Checkbox,
  FormControlLabel,
  Tooltip,
  Select,
  Avatar,
  Autocomplete,
} from "@mui/material";

import { useTranslation } from "react-i18next";

import { scales, musicalNotes } from "../../../services/Music";

import { sessionTags } from "../../../services/MiscData";

import AddUser from "../../../components/dialogs/AddUser";

import "./style.css";

function SessionSettings(props) {
  const { t } = useTranslation();

  const [newSessionData, setNewSessionData] = useState(props.sessionData);
  const [userDialog, setUserDialog] = useState(false);

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
          maxWidth="md"
          open={props.open}
          onClose={props.onClose}
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
                  variant="standard"
                  style={{ width: "100%" }}
                  value={newSessionData.name}
                  onChange={(e) =>
                    handleInfoChange("name", e.target.value.slice(0, 63))
                  }
                  label={t("info.name")}
                />
              </Grid>
              <Grid item sm={12} md={12} xl={12} lg={12} xs={12}>
                <TextField
                  variant="standard"
                  style={{ width: "100%" }}
                  value={newSessionData.description}
                  rows={2}
                  label={t("info.description")}
                  onChange={(e) =>
                    handleInfoChange(
                      "description",
                      e.target.value.slice(0, 255)
                    )
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
                    <TextField {...params} variant="standard" label={"Tags"} />
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
                {/* <Tooltip
                  title={
                    !props.premiumMode
                      ? "Upgrade to Premium to use this feature"
                      : "Session won't show up on explore"
                  }
                  interactive={!props.premiumMode}
                  placement="top-start"
                > */}
                <FormControlLabel
                  className="session-settings-checkbox-lbl"
                  control={
                    <Checkbox
                      color="primary"
                      checked={newSessionData.hid}
                      /* disabled={!props.premiumMode} */
                      disabled={true}
                      onChange={(e) =>
                        handleInfoChange("hid", e.target.checked)
                      }
                    />
                  }
                  label={
                    t("workspace.options.hiddenSession") +
                    " " +
                    t("misc.comingSoon")
                  }
                  labelPlacement="end"
                />
                {/* </Tooltip>
                <Tooltip
                  title={
                    !props.premiumMode
                      ? "Upgrade to Premium to use this feature"
                      : "Users won't be able to copy this session"
                  }
                  interactive={!props.premiumMode}
                  placement="top-start"
                > */}
                <FormControlLabel
                  className="session-settings-checkbox-lbl"
                  control={
                    <Checkbox
                      color="primary"
                      checked={newSessionData.alwcp}
                      /* disabled={!props.premiumMode} */
                      disabled={true}
                      onChange={(e) =>
                        handleInfoChange("alwcp", e.target.checked)
                      }
                    />
                  }
                  label={
                    t("workspace.options.allowCopies") +
                    " " +
                    t("misc.comingSoon")
                  }
                  labelPlacement="end"
                />
                {/* </Tooltip>
                <Tooltip
                  title={
                    !props.premiumMode
                      ? "Upgrade to Premium to use this feature"
                      : "Edit this session in real-time with other users"
                  }
                  interactive={!props.premiumMode}
                  placement="top-start"
                > */}
                <FormControlLabel
                  className="session-settings-checkbox-lbl"
                  control={
                    <Checkbox
                      color="primary"
                      checked={newSessionData.rte}
                      /* disabled={!props.premiumMode} */
                      disabled={true}
                      onChange={(e) =>
                        handleInfoChange("rte", e.target.checked)
                      }
                    />
                  }
                  label={
                    t("workspace.options.realtimeEdit") +
                    " " +
                    t("misc.comingSoon")
                  }
                  labelPlacement="end"
                />
                {/* </Tooltip> */}
              </Grid>
            </Grid>

            <Grid container item direction="column" sm={6}>
              <Grid item>
                <Typography variant="overline">Tempo</Typography>
                <Slider
                  min={40}
                  max={300}
                  defaultValue={newSessionData.bpm}
                  valueLabelDisplay="auto"
                  onChangeCommitted={handleBpmChange}
                />
              </Grid>
              <Grid item>
                <Typography variant="overline">
                  {t("track.settings.sessionScale")}
                </Typography>
                <div className="break" />

                <Select
                  variant="standard"
                  native
                  defaultValue={newSessionData.root}
                  onChange={(e) => handleInfoChange("root", e.target.value)}
                >
                  {musicalNotes.map((note, noteIndex) => (
                    <option key={noteIndex} value={noteIndex}>
                      {note}
                    </option>
                  ))}
                </Select>
                <Select
                  variant="standard"
                  native
                  defaultValue={newSessionData.scale}
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
                              onClick={(ev) =>
                                props.handlePageNav(
                                  "user",
                                  e.profile.username,
                                  ev
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

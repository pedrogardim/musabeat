import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import firebase from "firebase";

import "../SessionSettings.css";

import { colors } from "../../../utils/materialPalette";

import {
  IconButton,
  Typography,
  Icon,
  Dialog,
  DialogTitle,
  BottomNavigation,
  BottomNavigationAction,
  Button,
  Select,
  Paper,
  InputLabel,
  TextField,
  Grid,
  Slider,
  Checkbox,
  FormControlLabel,
  Tooltip,
  ButtonGroup,
} from "@material-ui/core";

import { Autocomplete } from "@material-ui/lab";

import {
  createChordProgression,
  sessionTags,
  scales,
  musicalNotes,
} from "../../../assets/musicutils";

const tracktypes = [
  {
    name: "Drum Sequencer",
    icon: "grid_on",
  },
  {
    name: "Melody Grid",
    icon: "music_note",
  },
  {
    name: "Chord Progression",
    icon: "font_download",
  },
  {
    name: "Player",
    icon: "graphic_eq",
  },
  {
    name: "Piano Roll",
    icon: "piano",
  },
];

const stepValues = [4, 8, 12, 16, 24, 32];
const lengthValues = [1, 2, 4, 8, 16];

const sessionTemplate = {
  name: "",
  description: "",
  tags: [],
  bpm: 120,
  root: 0,
  scale: 0,
  timeline: { on: false, size: 1 },
  tracks: [],
};

function NewSessionDialog(props) {
  const { t } = useTranslation();

  const isCopy = typeof props.newSessionDialog === "object";

  const [session, setSession] = useState(
    isCopy ? props.newSessionDialog : sessionTemplate
  );

  const addTrack = (trackType) => {
    const initialDrumPatch = "8fsbChTqV7aaWNyI1hTC";
    const initialPatch = "jSjo9Rzv3eg1vTkkEj1s";

    let newTrack = {
      id:
        !session.tracks || !session.tracks.length
          ? 0
          : Math.max(...session.tracks.map((e) => e.id)) + 1,
      name: "",
      type: trackType,
      score:
        trackType !== 2
          ? []
          : createChordProgression(session.scale, session.root, 3, 2).map(
              (e, i) => {
                return { notes: e, time: i, duration: 1, rhythm: [true] };
              }
            ),
      volume: 0,
      muted: false,
      instrument:
        trackType === 0
          ? initialDrumPatch
          : trackType === 3
          ? {
              url: "",
            }
          : initialPatch,
      color: Math.floor(Math.random() * 14.99),
      fx: [],
    };

    if (trackType === 1) {
      //newTrack.root = selectedRoot;
      //newTrack.scale = selectedScale;
      newTrack.range = 3;
    }

    if (trackType === 2) {
      //newTrack.root = selectedRoot;
      //newTrack.scale = selectedScale;
      newTrack.complexity = 3;
    }

    if (trackType === 3 || trackType === 4) {
      newTrack.size = 1;
    }

    setSession((prev) => {
      let newSession = { ...prev };
      newSession.tracks = [...newSession.tracks, newTrack];
      newSession.timeline = {
        ...newSession.timeline,
        [newTrack.id]: [...Array(2).keys()],
      };
      return newSession;
    });
  };

  const removeTrack = (trackType) => {
    setSession((prev) => {
      let newSession = { ...prev };
      newSession.tracks = newSession.tracks.filter((e) => e.type !== trackType);
      return newSession;
    });
  };

  const handleInfoChange = (prop, value) => {
    setSession((prev) => {
      return { ...prev, [prop]: value };
    });
  };

  const handleCreateNewSession = () => {
    session.tracks.map((e) => {
      if (typeof e.instrument === "string") {
        firebase
          .firestore()
          .collection(e.type === 0 ? "drumpatches" : "patches")
          .doc(e.instrument)
          .update({
            ld: firebase.firestore.FieldValue.increment(1),
            in: firebase.firestore.FieldValue.increment(1),
          });
        if (e.type === 0) {
          firebase
            .firestore()
            .collection(e.type === 0 ? "drumpatches" : "patches")
            .doc(e.instrument)
            .get()
            .then((r) =>
              Object.values(r.data().urls).map((file) =>
                firebase
                  .firestore()
                  .collection("files")
                  .doc(file)
                  .update({
                    ld: firebase.firestore.FieldValue.increment(1),
                    in: firebase.firestore.FieldValue.increment(1),
                  })
              )
            );
        }
      }
    });

    props.handleCreateNewSession(session);
    props.setNewSessionDialog(false);
  };

  return (
    <Dialog
      open={true}
      onClose={() => props.setNewSessionDialog(false)}
      PaperProps={{ className: "session-settings-cont" }}
      maxWidth={"md"}
      fullWidth
    >
      <Typography variant="h6" align="center">
        {t(`sidemenu.newSession`)}
      </Typography>
      <div className="break" style={{ height: 16 }} />

      {/* <p variant="overline">
        {t(`trackPicker.types.${selectedType}.description`)}
      </p> */}

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
              value={session.name}
              onChange={(e) =>
                handleInfoChange("name", e.target.value.slice(0, 63))
              }
              label={t("info.name")}
            />
          </Grid>
          <Grid item sm={12} md={12} xl={12} lg={12} xs={12}>
            <TextField
              style={{ width: "100%" }}
              value={session.description}
              rows={2}
              label={t("info.description")}
              maxRows={6}
              onChange={(e) =>
                handleInfoChange("description", e.target.value.slice(0, 255))
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
              renderInput={(params) => <TextField {...params} label={"Tags"} />}
              onChange={(e, v) => handleInfoChange("tags", v)}
              value={session.tags}
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
                  checked={session.hid}
                  /* disabled={!props.premiumMode} */
                  disabled={true}
                  onChange={(e) => handleInfoChange("hid", e.target.checked)}
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
                  checked={session.alwcp}
                  /* disabled={!props.premiumMode} */
                  disabled={true}
                  onChange={(e) => handleInfoChange("alwcp", e.target.checked)}
                />
              }
              label={
                t("workspace.options.allowCopies") + " " + t("misc.comingSoon")
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
              defaultValue={session.bpm}
              valueLabelDisplay="auto"
              onChangeCommitted={(e, v) => handleInfoChange("bpm", v)}
            />
          </Grid>
          <Grid item>
            <Typography variant="overline">
              {t("track.settings.sessionScale")}
            </Typography>
            <div className="break" />

            <Select
              native
              defaultValue={session.root}
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
              defaultValue={session.scale}
              onChange={(e) => handleInfoChange("scale", e.target.value)}
            >
              {scales.map((scale, scaleIndex) => (
                <option key={scaleIndex} value={scaleIndex}>
                  {t(`music.scales.${scaleIndex}`)}
                </option>
              ))}
            </Select>
          </Grid>
          <Grid item>
            <Typography variant="overline">
              {/* t("track.settings.sessionScale") */}
              {t("misc.initialTracks")}
            </Typography>
            <div className="break" />
            {isCopy ? (
              <div className="session-gallery-item-track-cont">
                {session.tracks.map((e) => (
                  <Paper
                    className="session-gallery-item-track"
                    style={{
                      backgroundColor: colors[e.color][500],
                      borderRadius: 0,
                    }}
                  >
                    <Tooltip
                      title={
                        e.name
                          ? `"${e.name}"`
                          : t(`trackPicker.types.${e.type}.name`)
                      }
                    >
                      <Icon>
                        {e.type === 0
                          ? "grid_on"
                          : e.type === 1
                          ? "music_note"
                          : e.type === 2
                          ? "font_download"
                          : e.type === 3
                          ? "graphic_eq"
                          : "piano"}
                      </Icon>
                    </Tooltip>
                  </Paper>
                ))}
              </div>
            ) : (
              <ButtonGroup color="primary" style={{ margin: "auto" }}>
                {tracktypes.map((e, i) => (
                  <Tooltip title={t(`trackPicker.types.${i}.name`)}>
                    <Button
                      color="primary"
                      variant={
                        session.tracks.some((e) => e.type === i)
                          ? "contained"
                          : "outlined"
                      }
                      onClick={() =>
                        session.tracks.some((e) => e.type === i)
                          ? removeTrack(i)
                          : addTrack(i)
                      }
                      key={e.name}
                    >
                      <Icon>{e.icon}</Icon>
                    </Button>
                  </Tooltip>
                ))}
              </ButtonGroup>
            )}
          </Grid>
        </Grid>
      </Grid>
      <div className="break" style={{ height: 16 }} />

      <Button
        color="primary"
        variant="contained"
        onClick={handleCreateNewSession}
      >
        {t("sidemenu.newSession")}
      </Button>
      <IconButton
        onClick={() => props.setNewSessionDialog(false)}
        className="mp-closebtn"
        color="primary"
      >
        <Icon>close</Icon>
      </IconButton>
    </Dialog>
  );
}

export default NewSessionDialog;

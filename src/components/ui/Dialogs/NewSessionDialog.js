import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import firebase from "firebase";

import "../SessionSettings.css";

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
  FormControl,
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

const moduletypes = [
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
  timeline: {},
  modules: [],
};

function NewSessionDialog(props) {
  const { t } = useTranslation();

  const [session, setSession] = useState(sessionTemplate);

  const addModule = (moduleType) => {
    const initialDrumPatch = "8fsbChTqV7aaWNyI1hTC";
    const initialPatch = "jSjo9Rzv3eg1vTkkEj1s";

    let newModule = {
      id:
        !session.modules || !session.modules.length
          ? 0
          : Math.max(...session.modules.map((e) => e.id)) + 1,
      name: "",
      type: moduleType,
      score:
        moduleType === 0 || moduleType === 1
          ? [{ ...new Array(8).fill(0) }]
          : moduleType === 2
          ? createChordProgression(session.scale, session.root, 3, 2).map(
              (e, i) => {
                return { notes: e, time: i, duration: 1, rhythm: [true] };
              }
            )
          : moduleType === 3
          ? [{ time: 0, duration: 0 }]
          : [],
      volume: 0,
      muted: false,
      instrument:
        moduleType === 0
          ? initialDrumPatch
          : moduleType === 3
          ? {
              url: "",
            }
          : initialPatch,
      color: Math.floor(Math.random() * 14.99),
      fx: [],
    };

    if (moduleType === 1) {
      //newModule.root = selectedRoot;
      //newModule.scale = selectedScale;
      newModule.range = 3;
    }

    if (moduleType === 2) {
      //newModule.root = selectedRoot;
      //newModule.scale = selectedScale;
      newModule.complexity = 3;
    }

    if (moduleType === 3 || moduleType === 4) {
      newModule.size = 1;
    }

    setSession((prev) => {
      let newSession = { ...prev };
      newSession.modules = [...newSession.modules, newModule];
      newSession.timeline = {
        ...newSession.timeline,
        [newModule.id]: [...Array(2).keys()],
      };
      return newSession;
    });
  };

  const removeModule = (moduleType) => {
    setSession((prev) => {
      let newSession = { ...prev };
      newSession.modules = newSession.modules.filter(
        (e) => e.type !== moduleType
      );
      return newSession;
    });
  };

  const handleInfoChange = (prop, value) => {
    setSession((prev) => {
      return { ...prev, [prop]: value };
    });
  };

  const handleCreateNewSession = () => {
    session.modules.map((e) => {
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
        {t(`modulePicker.types.${selectedType}.description`)}
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
              onChange={(e) => handleInfoChange("name", e.target.value)}
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
              onChange={(e) => handleInfoChange("description", e.target.value)}
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
              {t("module.settings.sessionScale")}
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
              {/* t("module.settings.sessionScale") */}
              {t("misc.initialModules")}
            </Typography>
            <div className="break" />
            <ButtonGroup color="primary" style={{ margin: "auto" }}>
              {moduletypes.map((e, i) => (
                <Tooltip title={t(`modulePicker.types.${i}.name`)}>
                  <Button
                    color="primary"
                    variant={
                      session.modules.some((e) => e.type === i)
                        ? "contained"
                        : "outlined"
                    }
                    onClick={() =>
                      session.modules.some((e) => e.type === i)
                        ? removeModule(i)
                        : addModule(i)
                    }
                    key={e.name}
                  >
                    <Icon>{e.icon}</Icon>
                  </Button>
                </Tooltip>
              ))}
            </ButtonGroup>
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

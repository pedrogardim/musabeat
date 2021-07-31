import React, { useState, useEffect, Fragment } from "react";
import * as Tone from "tone";
import firebase from "firebase";
import { useTranslation } from "react-i18next";

import { useParams } from "react-router-dom";

import {
  Fab,
  Icon,
  IconButton,
  Typography,
  Tooltip,
  Snackbar,
  Input,
} from "@material-ui/core";

import "./Workspace.css";

import Module from "../Module/Module";
import PlaceholderModule from "../Module/PlaceholderModule";

import WorkspaceTitle from "./WorkspaceTitle";

import ModulePicker from "./ModulePicker";
import Exporter from "./Exporter";
import SessionSettings from "./SessionSettings";
import Mixer from "./mixer/Mixer";
import SessionProgressBar from "./SessionProgressBar";
import WorkspaceTimeline from "./WorkspaceTimeline";

import {
  patchLoader,
  loadDrumPatch,
  loadSynthFromGetObject,
  adaptSequencetoSubdiv,
} from "../../assets/musicutils";

import { clearEvents } from "../../utils/TransportSchedule";

function Workspace(props) {
  const { t } = useTranslation();

  /* 
  There are 2 savingModes for the workspace:
    -Simple: changes are saved in the db between X minutes, and changes are not detected
    -Collaborative: all changes you make are stored in realtime, and changes in th db will be stored in real time. It's more resource expensive, meant to cowork 
 */

  const [savingMode, setSavingMode] = useState("simple");
  const [autosaver, setAutosaver] = useState(null);
  const [areUnsavedChanges, setAreUnsavedChanges] = useState(false);

  const [DBSessionRef, setDBSessionRef] = useState(null);

  const [modules, setModules] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [sessionSize, setSessionSize] = useState(0);

  const [instruments, setInstruments] = useState([]);
  const [instrumentsLoaded, setInstrumentsLoaded] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);

  const [modulePicker, setModulePicker] = useState(false);
  const [mixerOpened, setMixerOpened] = useState(false);

  //true: timeline ; false: loopmode
  const [timelineMode, setTimelineMode] = useState(false);
  const [focusedModule, setFocusedModule] = useState(null);
  const [clipboard, setClipboard] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState(null);
  const [sessionHistory, setSessionHistory] = useState({
    past: [],
    present: null, // (?) How do we initialize the present?
    future: [],
  });

  const [selection, setSelection] = useState([]);

  const sessionKey = useParams().key;
  const autoSaverTime = 5 * 60 * 1000; //5min

  const handleUndo = (action) => {
    let currentModules = deepCopy(modules);

    setSessionHistory((prev) => {
      let { past, present, future } = { ...prev };

      let cleanHistory = {
        past: [],
        present: currentModules, // (?) How do we initialize the present?
        future: [],
      };

      switch (action) {
        case "UNDO":
          if (past.length < 1) return prev;
          let previous = past[past.length - 1];
          let newPast = past.slice(0, past.length - 1);
          setModules(deepCopy(previous));
          return {
            past: newPast,
            present: previous,
            future: [present, ...future],
          };

        case "REDO":
          if (future.length < 1) return prev;
          let next = future[0];
          let newFuture = future.slice(1);
          setModules(deepCopy(next));
          return {
            past: [...past, present],
            present: next,
            future: newFuture,
          };
        case "RESET":
          return cleanHistory;
        default:
          let areDifferent =
            JSON.stringify(present) !== JSON.stringify(currentModules);

          //TEMP Solution: (currentModules.length < past[past.length - 1].length) ===> Reset undo to prevent bringing back deleted modules

          return past[past.length - 1] &&
            currentModules.length < past[past.length - 1].length
            ? cleanHistory
            : areDifferent
            ? {
                past: [...past, present],
                present: deepCopy(currentModules),
                future: [],
              }
            : prev;
      }
    });
    //newObject && setSessionHistory(newObject);
  };

  const handleSessionCopy = () => {
    DBSessionRef.get().then((r) => props.createNewSession(r.data()));
  };

  const getModuleSize = (module, index) => {
    let thisModule = module ? module : modules[index];
    return thisModule.type === 2
      ? Math.ceil(
          thisModule.score[thisModule.score.length - 1].time +
            thisModule.score[thisModule.score.length - 1].duration
        )
      : /* : thisModule.type === 3
      ? Math.ceil(
          (thisModule.score[0].duration +
            thisModule.score[0].time +
            Tone.Time("1m").toSeconds() * 0.5) /
            Tone.Time("1m").toSeconds()
        ) */
      thisModule.type === 3 || thisModule.type === 4
      ? thisModule.size
      : /* Math.ceil(
              Math.max(
                ...module.score
                  .sort((a, b) => a.time + a.duration - (b.time + b.duration))
                  .map((e) => e.time + e.duration)
              )
            ) */
        thisModule.score.length;
  };

  const adaptSessionSize = () => {
    //console.log("checked");
    if (modules === null) return;
    let lengths = modules.map((module) => getModuleSize(module));
    let longestModule = Math.max(...lengths);
    let newSessionSize = 2 << (31 - Math.clz32(longestModule - 1));

    if (newSessionSize === 0) newSessionSize = 1;

    if (newSessionSize !== sessionSize) {
      setSessionSize(newSessionSize);
    }
  };

  const loadSession = () => {
    //TODO: optimize this, avoid call from server for each session load
    console.log("loading session: ", sessionKey);
    if (props.hidden) {
      let thisSessionData = { ...props.session };
      delete thisSessionData.modules;
      setSessionData(thisSessionData);
      setModules(props.session.modules);
      Tone.Transport.bpm.value = props.session.bpm;
      setTimelineMode(thisSessionData.timeline.on);
      setEditMode(true);
      loadSessionInstruments(props.session.modules);
    } else if (sessionKey === null) {
      console.log("session is null!");
      setModules([]);
    }
    //
    else if (sessionKey === "newSession") {
      if (props.session === null) {
        props.createNewSession(null);
        return;
      }
      let data = { ...props.session };
      delete data.modules;
      setSessionData(data);
      setModules(props.session.modules);
      Tone.Transport.bpm.value = props.session.bpm;
      if (
        (!props.hidden &&
          props.user &&
          props.session.editors.includes(props.user.uid)) ||
        !props.session.creator
      ) {
        setEditMode(true);
      }

      let array = Array(props.session.modules.length).fill(false);
      //console.log(array);
      setInstrumentsLoaded(array);

      loadSessionInstruments(props.session.modules);
    }
    //
    else if (typeof sessionKey === "string") {
      let sessionRef =
        sessionKey !== null &&
        firebase.firestore().collection("sessions").doc(sessionKey);

      setDBSessionRef(!sessionRef ? null : sessionRef);
      //Check for editMmode and get title
      sessionRef.get().then((snapshot) => {
        let data = snapshot.data();
        //console.log(snapshot.val().modules + "-----");
        let sessionInfo = { ...data };
        delete sessionInfo.modules;
        setSessionData(sessionInfo);

        if (data.hasOwnProperty("modules")) {
          loadSessionInstruments(data.modules);
          setModules(data.modules);
        }

        setTimelineMode(data.timeline.on);

        Tone.Transport.bpm.value = data.bpm;

        let editors = data.editors;
        //console.log(editors);
        props.user && editors.includes(props.user.uid) && setEditMode(true);
      });

      sessionRef.update({
        opened: firebase.firestore.FieldValue.increment(1),
        played: firebase.firestore.FieldValue.increment(1),
      });
    } /* else if (typeof sessionKey === "object") {
      setModules(sessionKey.modules);
      Tone.Transport.bpm.value = sessionKey.bpm;
      if (
        (!props.hidden &&
          props.user &&
          sessionKey.editors.includes(props.user.uid)) ||
        !sessionKey.creator
      ) {
        setEditMode(true);
        setSessionEditors(props.session.creator);
      }
      loadSessionInstruments(sessionKey.modules);
    } */
  };

  const loadSessionInstruments = (sessionModules) => {
    //console.log("session instr loading");
    let array = Array(sessionModules.length).fill(false);

    setInstruments(array);

    let moduleInstruments = [];
    sessionModules.forEach((module, moduleIndex) => {
      //console.log(instrument)
      //sequencer
      if (module.type === 0) {
        if (typeof module.instrument === "string") {
          //console.log(`loading drums: ${module.instrument}`);
          loadDrumPatch(
            module.instrument,
            setInstrumentsLoaded,
            moduleIndex
          ).then((r) =>
            setInstruments((prev) => {
              let a = [...prev];
              a[moduleIndex] = r;
              return a;
            })
          );
        } else {
          moduleInstruments[moduleIndex] = new Tone.Players(
            module.instrument.urls,
            () =>
              setInstrumentsLoaded((prev) => {
                let a = [...prev];
                a[moduleIndex] = true;
                return a;
              })
          ).toDestination();
        }
      }
      //player
      else if (module.type === 3) {
        moduleInstruments[moduleIndex] = !!module.instrument.url
          ? new Tone.GrainPlayer(module.instrument.url, () =>
              setInstrumentsLoaded((prev) => {
                let a = [...prev];
                a[moduleIndex] = true;
                return a;
              })
            ).toDestination()
          : new Tone.GrainPlayer().toDestination();

        !module.instrument.url &&
          setInstrumentsLoaded((prev) => {
            let a = [...prev];
            a[moduleIndex] = true;
            return a;
          });
      }
      //load from patch id
      else if (typeof module.instrument === "string") {
        patchLoader(
          module.instrument,
          "",
          setInstrumentsLoaded,
          moduleIndex
        ).then((r) =>
          setInstruments((prev) => {
            let a = [...prev];
            a[moduleIndex] = r;
            return a;
          })
        );
      } //load from obj
      else if (typeof module.instrument === "object") {
        //console.log(module.instrument);
        moduleInstruments[moduleIndex] = loadSynthFromGetObject(
          module.instrument
        );
        setInstrumentsLoaded((prev) => {
          let a = [...prev];
          a[moduleIndex] = true;
          return a;
        });
      }
    });

    setInstruments(moduleInstruments);
  };

  const loadNewModuleInstrument = (module, index, buffers) => {
    let instrument;
    //console.log("inserting new instrument on" + index);
    if (module.type === 0) {
      if (buffers) {
        instrument = new Tone.Players(
          {},
          setInstrumentsLoaded((prev) =>
            prev.map((e, i) => (i === index ? true : e))
          )
        ).toDestination();
        instrument._buffers = buffers;
      } else if (typeof module.instrument === "string") {
        loadDrumPatch(module.instrument, setInstrumentsLoaded, index).then(
          (r) =>
            setInstruments((prev) => {
              let a = [...prev];
              a[index] = r;
              return a;
            })
        );
      } else {
        instrument = new Tone.Players(module.instrument.urls, () =>
          setInstrumentsLoaded((prev) =>
            prev.map((e, i) => (i === index ? true : e))
          )
        ).toDestination();
      }
    }
    //player
    else if (module.type === 3) {
      instrument = !!module.instrument.url
        ? new Tone.GrainPlayer(module.instrument.url, () =>
            setInstrumentsLoaded((prev) =>
              prev.map((e, i) => (i === index ? true : e))
            )
          ).toDestination()
        : new Tone.GrainPlayer().toDestination();

      !module.instrument.url &&
        setInstrumentsLoaded((prev) => {
          let a = [...prev];
          a[index] = true;
          return a;
        });
    }
    //load from patch id
    else if (typeof module.instrument === "string") {
      patchLoader(module.instrument, "", setInstrumentsLoaded, index).then(
        (r) =>
          setInstruments((prev) => {
            let a = [...prev];
            a[index] = r;
            return a;
          })
      );
    } //load from obj
    else if (
      typeof module.instrument === "object" &&
      module.instrument.name !== "Players" &&
      module.instrument.name !== "GrainPlayer" &&
      instruments[index] === null
    ) {
      instrument = loadSynthFromGetObject(module.instrument);
    }

    setInstruments((prev) => {
      let a = [...prev];
      a[index] = instrument;
      return a;
    });
  };

  const saveToDatabase = (mod, data) => {
    //console.log(DBSessionRef, isLoaded);
    if (DBSessionRef !== null) {
      //console.log("saved", modules, sessionData);

      savingMode === "simple" && setSnackbarMessage(t("misc.changesSaved"));

      let newSessionData = !data || !mod ? { ...sessionData } : { ...data };

      //temp fix: delete properties to avoid overwrites
      delete newSessionData.createdOn;
      delete newSessionData.creator;
      delete newSessionData.opened;
      delete newSessionData.played;
      delete newSessionData.copied;
      delete newSessionData.likes;

      !data || !mod
        ? DBSessionRef.update({
            ...newSessionData,
            modules: modules,
          })
        : DBSessionRef.update({ ...newSessionData, modules: mod });
    }
    /* DBSessionRef.get().then((snapshot) => {
        snapshot !== modules
          ? DBSessionRef.child("modules").set(modules)
          : console.log("Checked but not atualized");
      }); */
  };

  const updateFromDatabase = (modulesData) => {
    if (JSON.stringify(modules) !== JSON.stringify(modulesData.modules)) {
      //console.log("modules loaded from server:", modulesData.modules);

      setModules(modulesData.modules);

      //console.log("UPDATED");
    } else {
      //console.log("ITS THE SAME!!!");
    }
    /* 
    let data = { ...modulesData };
    delete data.modules;

    if (JSON.stringify(data) !== JSON.stringify(sessionData)) {
      console.log(
        "SESSION DATA UPDATED",
        JSON.stringify(modulesData.modules),
        JSON.stringify(modules)
      );
      setSessionData(data);
    } */
  };

  const onSessionReady = () => {
    instruments.forEach((e, i) => {
      //console.log(modules[i].name, 1, e.volume.value);
      e.volume.value = modules[i].volume;
      e._volume.mute = modules[i].muted;
      //console.log(modules[i].name, 2, e.volume.value);
    });

    props.hidden &&
      props.setPlayingLoadingProgress(
        Math.floor(
          (instrumentsLoaded.filter((e) => e !== false).length /
            instrumentsLoaded.length) *
            100
        )
      );

    //TODO, realtime collaborative editing. Must activate only when multiple editors are in the same session
    /* if (!props.hidden && DBSessionRef !== null) {
      DBSessionRef.onSnapshot((snapshot) => {
        updateFromDatabase(snapshot.data());
      });
    } */

    Tone.Transport.seconds = 0;
    props.hidden ? Tone.Transport.start() : Tone.Transport.pause();
    console.log("session ready!");
    updateMode("simple");
    setIsLoaded(true);
    setAreUnsavedChanges(true);
  };

  const setTimeline = (newTimeline) => {
    setSessionData((prev) => {
      return { ...prev, timeline: newTimeline };
    });
  };

  const getSessionSizeFromTimeline = () => {
    setSessionSize(sessionData.timeline.size);
  };

  const forceReschedule = () => {
    console.log("forceReschedule");
    setSessionSize(0);
    timelineMode ? getSessionSizeFromTimeline() : adaptSessionSize();
  };

  /*   const changeChecker = (mod, data) => {
    setAreUnsavedChanges((prev) => {
      prev && saveToDatabase(mod, data);
      return prev ? false : prev;
    });
  }; */

  const updateMode = (input) => {
    if (props.user === null || !editMode) return;
    if (input === "simple") {
      clearInterval(autosaver);
      //console.log("autosaver initialized");

      let intervalId = setInterval(
        () => setAreUnsavedChanges((prev) => (prev ? false : prev)),
        autoSaverTime
      );

      setAutosaver(intervalId);
    }
  };

  const unfocusModules = (e) => {
    e.target.classList &&
      e.target.classList.contains("workspace") &&
      setFocusedModule(null);
  };

  const duplicateModule = (index) => {
    let newModuleId = parseInt(Math.max(...modules.map((e) => e.id))) + 1;
    let moduleToCopy = modules[modules.length - 1];
    setTimeline({
      ...sessionData.timeline,
      [newModuleId]: [...sessionData.timeline[index]],
    });
    setInstrumentsLoaded((prev) => [...prev, false]);
    let instrumentBuffers = moduleToCopy.type === 0 && moduleToCopy._buffers;
    loadNewModuleInstrument(
      modules[modules.length - 1],
      modules.length,
      instrumentBuffers
    );
    setModules((prev) => [
      ...prev,
      {
        ...prev[index],
        id: newModuleId,
      },
    ]);
    handleUndo("RESET");
  };

  const handleSnackbarClose = () => {
    setSnackbarMessage(null);
  };

  const togglePlaying = (e) => {
    e.preventDefault();
    if (Tone.Transport.state !== "started") {
      Tone.Transport.start();
      setIsPlaying(true);
    } else {
      Tone.Transport.pause();
      setIsPlaying(false);
    }
  };

  const handleCopy = () => {
    if (focusedModule == null) return;
    let currentMeasure = Tone.Transport.position.split(":")[0];
    let module = modules[focusedModule];

    if (module.type === 0 || module.type === 1 || module.type === 2) {
      let copiedData =
        module.type === 0 || module.type === 1
          ? { ...module.score[currentMeasure] }
          : module.type === 2
          ? { ...module.score[selection] }
          : null;
      setClipboard([module.type, copiedData]);
      setSnackbarMessage(
        `${t("workspace.actions.copySuccess")} ${focusedModule + 1} "${
          module.name
        }"`
      );
    }
    //console.log("copied", copiedData);
  };

  const handlePaste = () => {
    if (focusedModule == null) return;
    if (!clipboard) {
      setSnackbarMessage(t("workspace.actions.copyPasteEmptyClipboard"));
      return;
    }

    let currentMeasure = Tone.Transport.position.split(":")[0];
    let module = modules[focusedModule];

    if (clipboard[0] !== module.type) {
      setSnackbarMessage(t("workspace.actions.copyPasteIncompatible"));
      return;
    }

    if (module.type === 0 || module.type === 1) {
      let subdivisionChanged = false;

      setModules((prev) => {
        let newModules = [...prev];

        if (
          Object.keys(clipboard).length !==
          Object.keys(newModules[focusedModule].score[currentMeasure]).length
        ) {
          newModules[focusedModule].score = newModules[focusedModule].score.map(
            (e) =>
              Object.assign(
                {},
                adaptSequencetoSubdiv(
                  Object.values(e),
                  Object.keys(clipboard).length
                )
              )
          );
          subdivisionChanged = true;
        }

        newModules[focusedModule].score[currentMeasure] = { ...clipboard[1] };

        return newModules;
      });
      setSnackbarMessage(
        `${t("workspace.actions.pasteSuccessMeasure")} ${focusedModule + 1} "${
          module.name
        }" ${
          subdivisionChanged
            ? `${t("workspace.actions.stepsChange")} ${clipboard.length}`
            : ""
        }`
      );
    } else if (module.type === 2) {
      setModules((prev) => {
        let newModules = [...prev];
        newModules[focusedModule].score[selection].notes = [
          ...clipboard[1].notes,
        ];
        newModules[focusedModule].score[selection].rhythm = [
          ...clipboard[1].rhythm,
        ];
        return newModules;
      });
      setSnackbarMessage(
        `${t("workspace.actions.pasteSuccessChord")} ${focusedModule + 1} "${
          module.name
        }"`
      );
    }
    //console.log("paste", [...clipboard]);
  };

  const handleBackspace = () => {
    if (focusedModule == null) return;
    let currentMeasure = Tone.Transport.position.split(":")[0];
    let module = modules[focusedModule];

    if (module.type === 0 && module.type === 1) {
      let measureLength = Object.keys(
        modules[focusedModule].score[currentMeasure]
      ).length;
      setModules((prev) => {
        let newModules = [...prev];
        newModules[focusedModule].score[currentMeasure] = Object.assign(
          {},
          Array(measureLength).fill(0)
        );

        return newModules;
      });
      setSnackbarMessage(
        `Measure ${currentMeasure + 1} cleared, from module ${
          focusedModule + 1
        } "${module.name}"`
      );
    }
    if (module.type === 4) {
      setModules((prev) => {
        let newModules = [...prev];
        newModules[focusedModule].score = newModules[
          focusedModule
        ].score.filter((e, i) => selection.indexOf(i) === -1);
        return newModules;
      });
      setSelection([]);
    }
  };

  const handleArrowKey = (event) => {
    event.preventDefault();
    if (typeof focusedModule === "number") {
      if (modules[focusedModule].type === 4) {
        if (event.keyCode === 38) {
          for (let x = 0; x < selection.length; x++) {
            let midiNote = Tone.Frequency(
              modules[focusedModule].score[x].note
            ).toMidi();
            if (midiNote >= 107) return;
          }
          setModules((prev) => {
            let newModules = [...prev];
            selection.forEach(
              (e, i) =>
                (newModules[focusedModule].score[e].note = Tone.Frequency(
                  newModules[focusedModule].score[e].note
                )
                  .transpose(event.shiftKey ? 12 : 1)
                  .toNote())
            );

            return newModules;
          });
        }
        if (event.keyCode === 40) {
          for (let x = 0; x < selection.length; x++) {
            let midiNote = Tone.Frequency(
              modules[focusedModule].score[x].note
            ).toMidi();
            if (midiNote <= 24) return;
          }
          setModules((prev) => {
            let newModules = [...prev];
            selection.forEach(
              (e, i) =>
                (newModules[focusedModule].score[e].note = Tone.Frequency(
                  newModules[focusedModule].score[e].note
                )
                  .transpose(event.shiftKey ? -12 : -1)
                  .toNote())
            );

            return newModules;
          });
        }
      }
    }
  };

  const handleKeyDown = (e) => {
    Tone.start();
    //console.log(e);
    if (e.ctrlKey || e.metaKey) {
      switch (e.keyCode) {
        case 67:
          handleCopy();
          break;
        case 86:
          handlePaste();
          break;
        case 90:
          !e.shiftKey ? handleUndo("UNDO") : handleUndo("REDO");
          break;

        default:
          break;
      }
    }
    switch (e.keyCode) {
      case 32:
        e.target.classList[0] === "workspace" &&
          !instrumentsLoaded.includes(false) &&
          togglePlaying(e);
        break;
      case 8:
        handleBackspace();
        break;
      case 37:
      case 38:
      case 39:
      case 40:
        handleArrowKey(e);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    Tone.Transport.loop = true;
    Tone.Transport.loopStart = 0;
    instruments.forEach((e) => e.dispose());
    clearEvents("all");
    console.log("transport cleared");

    let session = {
      description: "No description",
      tags: ["musa"],
      bpm: Tone.Transport.bpm.value,
      modules: modules,
    };

    if (props.user && props.user.uid !== firebase.auth().currentUser.uid) {
      props.createNewSession(session);
      return;
    }

    loadSession();
    //!props.session.length && Tone.Transport.start()
  }, [props.user, props.session, sessionKey]);

  useEffect(() => {
    !timelineMode && adaptSessionSize();
    //registerSession();
    console.log(modules);
    //console.log(modules, instruments, instrumentsLoaded);

    savingMode === "simple" && setAreUnsavedChanges(true);

    savingMode === "collaborative" && saveToDatabase(modules, sessionData);

    modules && isLoaded && handleUndo();
  }, [modules]);

  useEffect(() => {
    isLoaded && updateMode(savingMode);
  }, [savingMode]);

  useEffect(() => {
    isLoaded && !timelineMode && adaptSessionSize();
    sessionData &&
      timelineMode !== sessionData.timeline.on &&
      setSessionData((prev) => {
        return { ...prev, timeline: { ...prev.timeline, on: timelineMode } };
      });
  }, [timelineMode]);

  useEffect(() => {
    sessionData && console.log(sessionData.timeline);
    savingMode === "simple" && setAreUnsavedChanges(true);
  }, [sessionData]);

  /*  useEffect(() => {
    console.log("sessiondata triggered", sessionData);
    if (sessionData) {
      !props.hidden && saveToDatabase(sessionData, 1);
    }
  }, [sessionData]); */

  /*   useEffect(() => {
    console.log(sessionHistory);
  }, [sessionHistory]); */

  useEffect(() => {
    if (
      modules &&
      sessionData &&
      instrumentsLoaded &&
      instruments.every((val) => typeof val === "object") &&
      instrumentsLoaded.every((val) => val === true) &&
      sessionSize > 0 &&
      !isLoaded
    ) {
      onSessionReady();
    }
    //temp
  }, [instrumentsLoaded, sessionData]);

  useEffect(() => {
    //TODO: Completely clear Tone instance, disposing context
    return () => {
      instruments.forEach((e) => e.dispose());
      clearEvents("all");
      console.log("transport cleared");
    };
  }, []);

  useEffect(() => {
    instruments.forEach((e, i) => {
      if (modules && modules[i] && e) {
        e.volume.value = modules[i].volume;
        e._volume.mute = modules[i].muted;
      }
      //console.log(modules[i].name, 1, e.volume.value);

      //console.log(modules[i].name, 2, e.volume.value);
    });
  }, [instruments]);

  useEffect(() => {
    Tone.Transport.loopEnd = Tone.Time("1m").toSeconds() * sessionSize;
    //console.log("sessionSize", sessionSize);
  }, [sessionSize]);

  useEffect(() => {
    timelineMode && getSessionSizeFromTimeline();
  }, [timelineMode]);
  /* 
  useEffect(() => {
    console.log("editMode", editMode);
    !props.hidden && props.setSessionEditMode(editMode);
  }, [editMode]);
 */

  useEffect(() => {
    //console.log(areUnsavedChanges);
    window.onbeforeunload = function (e) {
      if (!areUnsavedChanges) return;
      var dialogText = "Dialog text here";
      e.returnValue = dialogText;
      return dialogText;
    };
    if (!props.hidden && isLoaded && !areUnsavedChanges) saveToDatabase();
  }, [areUnsavedChanges]);

  /**/

  return (
    <div
      className="workspace"
      tabIndex="0"
      style={{
        display: props.hidden ? "none" : "flex",
      }}
      onClick={unfocusModules}
      onKeyDown={handleKeyDown}
    >
      {sessionKey && sessionData && (
        <WorkspaceTitle
          sessionData={sessionData}
          setSessionData={setSessionData}
          sessionKey={sessionKey}
          editMode={editMode}
          user={props.user}
          sessionSize={sessionSize}
        />
      )}
      {modules && sessionSize && sessionData.timeline && (
        <WorkspaceTimeline
          setTimelineMode={setTimelineMode}
          timelineMode={timelineMode}
          timeline={sessionData.timeline}
          setTimeline={setTimeline}
          modules={modules}
          sessionSize={sessionSize}
          setSessionSize={setSessionSize}
        />
      )}

      <div className="workspace-module-cont">
        {modules !== null && sessionData ? (
          modules.map((module, moduleIndex) => (
            <Fragment>
              <Module
                tabIndex={-1}
                key={module.id}
                index={moduleIndex}
                module={module}
                instrument={instruments[moduleIndex]}
                setInstruments={setInstruments}
                loaded={instrumentsLoaded[moduleIndex]}
                setInstrumentsLoaded={setInstrumentsLoaded}
                sessionSize={sessionSize}
                setModules={setModules}
                editMode={editMode}
                isFocused={focusedModule === moduleIndex}
                setFocusedModule={setFocusedModule}
                resetUndoHistory={() => handleUndo("RESET")}
                timeline={sessionData.timeline}
                timelineMode={sessionData.timeline.on}
                setTimeline={setTimeline}
                selection={selection}
                setSelection={setSelection}
                duplicateModule={duplicateModule}
              />
              {moduleIndex % 3 === 1 && <div className="break" />}
            </Fragment>
          ))
        ) : !modules ? (
          [1, 1, 1, 1].map(() => <PlaceholderModule />)
        ) : !modules.length && !instrumentsLoaded.length ? (
          <Fragment>
            <Typography variant="h1">:v</Typography>
            <div className="break" />
            <p>{t("workspace.empty")}</p>
          </Fragment>
        ) : (
          ""
        )}

        <div className="break" />
        {editMode && (
          <Tooltip title={t("workspace.addBtn")}>
            <IconButton
              color="primary"
              style={{ marginTop: 48 }}
              onClick={() => setModulePicker(true)}
            >
              <Icon style={{ fontSize: 40 }}>add</Icon>
            </IconButton>
          </Tooltip>
        )}
      </div>

      {modulePicker && (
        <ModulePicker
          tabIndex={-1}
          open={modulePicker}
          onClose={() => setModulePicker(false)}
          setModulePicker={setModulePicker}
          setModules={setModules}
          loadNewModuleInstrument={loadNewModuleInstrument}
          modules={modules}
          sessionSize={sessionSize}
          timeline={sessionData.timeline}
          setTimeline={setTimeline}
        />
      )}

      {mixerOpened && (
        <Mixer
          modules={modules}
          instruments={instruments}
          setModules={setModules}
        />
      )}
      {/*setModulesVolume={setModulesVolume}*/}

      <div className="ws-fab-cont">
        <Fab
          tabIndex={-1}
          color="primary"
          className="ws-fab ws-fab-copy"
          onClick={handleSessionCopy}
        >
          <Icon>content_copy</Icon>
        </Fab>

        <Fab
          tabIndex={-1}
          color="primary"
          className="ws-fab ws-fab-play"
          onClick={togglePlaying}
        >
          <Icon>{isPlaying ? "pause" : "play_arrow"}</Icon>
        </Fab>

        {editMode && (
          <Fragment>
            <Fab
              tabIndex={-1}
              className="ws-fab ws-fab-mix"
              color="primary"
              onClick={() => setMixerOpened((prev) => (prev ? false : true))}
            >
              <Icon style={{ transform: "rotate(90deg)" }}>tune</Icon>
            </Fab>
            <Tooltip title={t("misc.saveChanges")}>
              <Fab
                disabled={!areUnsavedChanges || !props.user}
                tabIndex={-1}
                className="ws-fab ws-fab-save"
                color="primary"
                onClick={() => setAreUnsavedChanges(false)}
              >
                <Icon>save</Icon>
              </Fab>
            </Tooltip>
          </Fragment>
        )}

        {!props.hidden && isLoaded && sessionData && (
          <Exporter
            sessionSize={sessionSize}
            sessionData={sessionData}
            modules={modules}
            modulesInstruments={instruments}
            timeline={sessionData.timeline}
            timelineMode={timelineMode}
            forceReschedule={forceReschedule}
          />
        )}

        <SessionSettings
          sessionData={sessionData}
          setSessionData={setSessionData}
        />
      </div>

      <Snackbar
        open={!!snackbarMessage}
        message={snackbarMessage}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        style={{ marginBottom: 96 }}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleSnackbarClose}
          >
            <Icon fontSize="small">close</Icon>
          </IconButton>
        }
      />
    </div>
  );
}

export default Workspace;

const deepCopy = (a) => JSON.parse(JSON.stringify(a));

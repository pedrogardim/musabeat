import React, { useState, useEffect, Fragment } from "react";
import { Helmet } from "react-helmet";
import * as Tone from "tone";
import firebase from "firebase";
import { useTranslation } from "react-i18next";

import { useParams } from "react-router-dom";

import {
  Fab,
  Icon,
  IconButton,
  Backdrop,
  Tooltip,
  Snackbar,
  Input,
  Paper,
  Fade,
  Button,
  Modal,
  Select,
  MenuItem,
} from "@material-ui/core";

import "./Workspace.css";

import ModuleRow from "../../Module/ModuleRow";
import ClosedTrack from "../../Module/ClosedTrack";

import WorkspaceTitle from "./WorkspaceTitle";
import WorkspaceTransport from "./WorkspaceTransport";

import ModulePicker from "../ModulePicker";
import InstrumentEditor from "../../InstrumentEditor/InstrumentEditor";

import Exporter from "../Exporter";
import SessionSettings from "../SessionSettings";
import Mixer from "../mixer/Mixer";
import SessionProgressBar from "../SessionProgressBar";
import WorkspaceGrid from "./WorkspaceGrid";
import WorkspaceRuler from "./WorkspaceRuler";

import LoadingScreen from "../LoadingScreen";
import ActionConfirm from "../Dialogs/ActionConfirm";
import NotFoundPage from "../NotFoundPage";
import NotesInput from "./NotesInput";

import {
  patchLoader,
  loadDrumPatch,
  loadSynthFromGetObject,
  adaptSequencetoSubdiv,
  loadSamplerFromObject,
  keySamplerMapping,
  keyboardMapping,
} from "../../../assets/musicutils";

import { colors } from "../../../utils/materialPalette";
import { clearEvents } from "../../../utils/TransportSchedule";

Tone.Transport.loopEnd = "1m";

const userSubmitedSessionProps = [
  "alwcp",
  "bpm",
  "description",
  "editors",
  "hid",
  "name",
  "root",
  "rte",
  "scale",
  "tags",
  "timeline",
];

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

  const [selectedModule, setSelectedModule] = useState(null);

  const [instruments, setInstruments] = useState([]);
  const [instrumentsLoaded, setInstrumentsLoaded] = useState([]);
  const [instrumentsInfo, setInstrumentsInfo] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [metronome, setMetronome] = useState(null);
  const [metronomeState, setMetronomeState] = useState(false);
  const [metronomeEvent, setMetronomeEvent] = useState(null);

  const [pressedKeys, setPressedKeys] = useState([]);
  const [playingOctave, setPlayingOctave] = useState(3);
  const [playNoteFunction, setPlayNoteFunction] = useState([
    () => {},
    () => {},
  ]);
  const [moduleRows, setModuleRows] = useState([]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [cursorMode, setCursorMode] = useState(null);
  const [gridSize, setGridSize] = useState(4);
  const [zoomPosition, setZoomPosition] = useState([0, 3]);

  const [IEOpen, setIEOpen] = useState(false);

  const [premiumMode, setPremiumMode] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const [modulePicker, setModulePicker] = useState(false);
  const [mixerOpened, setMixerOpened] = useState(false);
  const [sessionDupDialog, setSessionDupDialog] = useState(false);

  const [focusedModule, setFocusedModule] = useState(null);
  const [clipboard, setClipboard] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState(null);
  const [sessionHistory, setSessionHistory] = useState({
    past: [],
    present: null, // (?) How do we initialize the present?
    future: [],
  });

  const [editorProfiles, setEditorProfiles] = useState(null);
  const [selection, setSelection] = useState([]);
  const [selectedNotes, setSelectedNotes] = useState([]);

  const [optionsMenu, setOptionsMenu] = useState(false);

  const [notifications, setNotifications] = useState([]);

  const [listener, setListener] = useState(() => () => {});
  const [isLastChangeFromServer, setIsLastChangeFromServer] = useState(false);

  const sessionKey = useParams().key;
  const autoSaverTime = 5 * 60 * 1000; //5min

  const keyMapping =
    selectedModule !== null && modules[selectedModule].type === 0
      ? keySamplerMapping
      : keyboardMapping;

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
    props.setNewSessionDialog({ ...sessionData, modules: [...modules] });
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
      setEditMode(true);
      loadSessionInstruments(props.session.modules);
    } else if (sessionKey === null) {
      //console.log("session is null!");
      setModules([]);
    }
    //
    else if (typeof sessionKey === "string") {
      let sessionRef = firebase
        .firestore()
        .collection("sessions")
        .doc(sessionKey);

      setDBSessionRef(!sessionRef ? null : sessionRef);
      //Check for editMmode and get title
      sessionRef.get().then((snapshot) => {
        if (!snapshot.exists) {
          setSessionData(undefined);
          setModules(undefined);
          return;
        }

        let data = snapshot.data();
        if (!data) {
          console.log(
            "======================= empty session data, loading again =========================="
          );
          loadSession();
          return;
        }
        //console.log(snapshot.val().modules + "-----");
        let sessionInfo = { ...data };
        delete sessionInfo.modules;
        setSessionData(sessionInfo);

        if (data.hasOwnProperty("modules")) {
          loadSessionInstruments(data.modules);
          setModules(data.modules);
        }

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
    console.log("session instr loading");
    let array = Array(sessionModules.length).fill(false);

    setInstruments(array);

    sessionModules.forEach((module, moduleIndex) => {
      //console.log(instrument)
      //sequencer
      if (module.type === 0) {
        //console.log(`loading drums: ${module.instrument}`);
        loadDrumPatch(
          module.instrument,
          setInstrumentsLoaded,
          moduleIndex,
          "",
          setModules,
          () => {},
          setInstrumentsInfo,
          setNotifications
        ).then((r) =>
          setInstruments((prev) => {
            let a = [...prev];
            a[moduleIndex] = r;
            return a;
          })
        );
      }

      //player
      else if (module.type === 3) {
        if (module.instrument.url) {
          firebase
            .storage()
            .ref(module.instrument.url)
            .getDownloadURL()
            .then((r) => {
              let instrument = new Tone.GrainPlayer(r, () =>
                setInstrumentsLoaded((prev) => {
                  let a = [...prev];
                  a[moduleIndex] = true;
                  return a;
                })
              ).toDestination();
              setInstruments((prev) => {
                let a = [...prev];
                a[moduleIndex] = instrument;
                return a;
              });
              firebase
                .firestore()
                .collection("files")
                .doc(module.instrument.url)
                .update({ in: firebase.firestore.FieldValue.increment(1) });
            })
            .catch((er) => {
              setInstrumentsLoaded((prev) => {
                let a = [...prev];
                a[moduleIndex] = true;
                return a;
              });

              let instrument = new Tone.GrainPlayer().toDestination();
              setInstruments((prev) => {
                let a = [...prev];
                a[moduleIndex] = instrument;
                return a;
              });
              setNotifications((prev) => [...prev, module.instrument.url]);
            });
        } else {
          let instrument = new Tone.GrainPlayer();

          setInstrumentsLoaded((prev) => {
            let a = [...prev];
            a[moduleIndex] = true;
            return a;
          });

          setInstruments((prev) => {
            let a = [...prev];
            a[moduleIndex] = instrument;
            return a;
          });
        }
      }
      //load from patch id
      else if (typeof module.instrument === "string") {
        patchLoader(
          module.instrument,
          setInstrumentsLoaded,
          moduleIndex,
          setNotifications,
          setInstrumentsInfo
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

        if (module.instrument.hasOwnProperty("urls")) {
          loadSamplerFromObject(
            module.instrument,
            setInstrumentsLoaded,
            moduleIndex,
            () => {},
            setNotifications
          ).then((r) =>
            setInstruments((prev) => {
              let a = [...prev];
              a[moduleIndex] = r;
              return a;
            })
          );
        } else {
          let instrument = loadSynthFromGetObject(module.instrument);

          setInstruments((prev) => {
            let a = [...prev];
            a[moduleIndex] = instrument;
            return a;
          });
          setInstrumentsLoaded((prev) => {
            let a = [...prev];
            a[moduleIndex] = true;
            return a;
          });
        }
      }
    });

    //loadMetromome

    if (!props.compact) {
      let metro = new Tone.FMSynth({
        envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.2 },
        oscillator: { type: "sine" },
        modulationIndex: 10,
        harmonicity: 10,
        modulationEnvelope: {
          attack: 0.001,
          decay: 0.3,
          sustain: 0,
          release: 0.01,
        },
      }).toDestination();

      metro.volume.value = -9999;

      setMetronome((prev) => {
        prev && prev.dispose();
        return metro;
      });

      metronomeEvent && metronomeEvent.forEach((e) => Tone.Transport.clear(e));

      let events = [];

      for (let mse = -1; mse < 128; mse++) {
        for (let qtr = 0; qtr < 4; qtr++) {
          events.push(
            Tone.Transport.schedule((time) => {
              metro.triggerAttackRelease(qtr === 0 ? "C5" : "C4", "4n", time);
            }, `${mse}:${qtr}:0`)
          );
        }
      }

      setMetronomeEvent(events);
    }
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
      } else {
        loadDrumPatch(
          module.instrument,
          setInstrumentsLoaded,
          index,
          "",
          setModules,
          () => {},
          setInstrumentsInfo,
          setNotifications
        ).then((r) =>
          setInstruments((prev) => {
            let a = [...prev];
            a[index] = r;
            return a;
          })
        );
      }
    }
    //player
    else if (module.type === 3) {
      if (module.instrument.url) {
        firebase
          .storage()
          .ref(module.instrument.url)
          .getDownloadURL()
          .then((r) => {
            let instrument = new Tone.GrainPlayer(r, () =>
              setInstrumentsLoaded((prev) => {
                let a = [...prev];
                a[index] = true;
                return a;
              })
            ).toDestination();
            setInstruments((prev) => {
              let a = [...prev];
              a[index] = instrument;
              return a;
            });
          })
          .catch((er) => {
            setInstrumentsLoaded((prev) => {
              let a = [...prev];
              a[index] = true;
              return a;
            });

            let instrument = new Tone.GrainPlayer().toDestination();
            setInstruments((prev) => {
              let a = [...prev];
              a[index] = instrument;
              return a;
            });
            setNotifications((prev) => [...prev, module.instrument.url]);
          });
      } else {
        let instrument = new Tone.GrainPlayer().toDestination();

        setInstrumentsLoaded((prev) => {
          let a = [...prev];
          a[index] = true;
          return a;
        });

        setInstruments((prev) => {
          let a = [...prev];
          a[index] = instrument;
          return a;
        });
      }
    }
    //load from patch id
    else if (typeof module.instrument === "string") {
      patchLoader(
        module.instrument,
        setInstrumentsLoaded,
        index,
        setNotifications,
        setInstrumentsInfo
      ).then((r) =>
        setInstruments((prev) => {
          let a = [...prev];
          a[index] = r;
          return a;
        })
      );
    } //load from obj
    else if (typeof module.instrument === "object" && !instruments[index]) {
      if (module.instrument.hasOwnProperty("urls")) {
        loadSamplerFromObject(
          module.instrument,
          setInstrumentsLoaded,
          index,
          () => {},
          setNotifications
        ).then((r) =>
          setInstruments((prev) => {
            let a = [...prev];
            a[index] = r;
            return a;
          })
        );
      } else {
        instrument = loadSynthFromGetObject(module.instrument);
        setInstrumentsLoaded((prev) => {
          let a = [...prev];
          a[index] = true;
          return a;
        });
      }
    }

    setInstruments((prev) => {
      let a = [...prev];
      a[index] = instrument;
      return a;
    });
  };

  const saveToDatabase = (mod, data, a) => {
    //console.log(DBSessionRef, isLoaded);
    if (DBSessionRef !== null) {
      savingMode === "simple" && setSnackbarMessage(t("misc.changesSaved"));

      let newSessionData = !!data ? deepCopy(data) : {};

      let newModules = !!mod ? deepCopy(mod) : {};

      //temp fix: delete properties to avoid overwrites
      if (data) {
        delete newSessionData.createdOn;
        delete newSessionData.creator;
        delete newSessionData.opened;
        delete newSessionData.played;
        delete newSessionData.copied;
        delete newSessionData.likes;
      }

      if (mod) {
        newSessionData.modules = newModules;
      }

      //console.log("write");

      DBSessionRef.update({
        ...newSessionData,
      });
    }
  };

  const updateFromDatabase = (sessionSnapshot) => {
    setIsLastChangeFromServer(true);
    //console.log("read");
    setModules((prev) => {
      let index = sessionSnapshot.modules.length - 1;
      if (prev.length < sessionSnapshot.modules.length)
        loadNewModuleInstrument(sessionSnapshot.modules[index], index);
      //console.log("inside setter");
      return sessionSnapshot.modules;
    });

    let data = { ...sessionSnapshot };
    delete data.modules;

    setSessionData((prev) => {
      let check = !compareObjectProperties(data, prev);
      //console.log(check ? "It's different data" : "It's the same data");
      return check ? data : prev;
    });
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
    console.log("=====session ready!=====");
    setIsLoaded(true);
    setSavingMode(sessionData.rte ? "rte" : "simple");
  };

  const resetWorkspace = () => {
    setSavingMode("simple");
    setAutosaver(null);
    setAreUnsavedChanges(false);

    setDBSessionRef(null);

    setModules(null);
    setSessionData(null);
    setSessionSize(0);

    setInstruments([]);
    setInstrumentsLoaded([]);
    setIsLoaded(false);
    setEditMode(false);

    setIsPlaying(false);

    setModulePicker(false);
    setMixerOpened(false);

    //true: timeline ; false: loopmode
  };

  const updateSavingMode = (input) => {
    //console.log("inin", input);
    if (input === "simple") {
      listener();
      setListener(() => () => {});
      clearInterval(autosaver);
      //console.log("autosaver initialized");

      let intervalId = setInterval(() => {
        setAreUnsavedChanges((prev) => (prev ? false : prev));
      }, autoSaverTime);

      setAutosaver(intervalId);
    } else {
      //console.log(DBSessionRef);
      if (!props.hidden && DBSessionRef !== null) {
        //console.log("RTE Activated");
        listener();
        setAreUnsavedChanges(false);
        saveToDatabase(modules, sessionData);
        let DBlistener = DBSessionRef.onSnapshot(
          (snapshot) => {
            !snapshot.metadata.hasPendingWrites &&
              updateFromDatabase(snapshot.data());
          },
          (er) => {
            console.log("onSnapshot Error:", er);
          }
        );

        setListener(() => () => DBlistener());
      }
    }
  };

  const duplicateModule = (index) => {
    let newModuleId = parseInt(Math.max(...modules.map((e) => e.id))) + 1;
    let moduleToCopy = modules[modules.length - 1];
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

  const updateSelectedNotes = () => {
    setSelectedNotes(
      modules.map((mod, modIndex) => {
        if (selectedModule !== null && selectedModule !== modIndex) return [];
        let notes = [];
        for (let x = 0; x < mod.score.length; x++) {
          let note = mod.score[x];
          if (
            Tone.Time(note.time).toSeconds() +
              (note.duration ? Tone.Time(note.duration).toSeconds() : 0) >=
              (selection[0] / gridSize) * Tone.Time("1m").toSeconds() +
                (note.duration ? 0.0001 : 0) &&
            Tone.Time(note.time).toSeconds() <
              (selection[1] / gridSize) * Tone.Time("1m").toSeconds()
          )
            notes.push(x);
        }
        return notes;
      })
    );
  };

  const togglePlaying = (e) => {
    //console.log(Tone.Transport.state);
    Tone.start();
    e.preventDefault();
    //console.log(Tone.Transport.state, isLoaded, instrumentsLoaded);
    if (
      Tone.Transport.state !== "started" //&&
      //isLoaded &&
      //!instrumentsLoaded.includes(false)
    ) {
      Tone.Transport.start();
      setIsPlaying(true);
    } else {
      instruments.forEach((e) => !e.name.includes("Player") && e.releaseAll());
      Tone.Transport.pause();
      setIsRecording(false);
      setIsPlaying(false);
    }
  };

  const toggleRecording = (e) => {
    Tone.Transport.pause();
    Tone.Transport.seconds = `${
      Tone.Time(Tone.Transport.seconds).toBarsBeatsSixteenths().split(":")[0] -
      1
    }:0:0`;

    Tone.Transport.start();
    setIsPlaying(true);
    setIsRecording(true);
  };

  const playNote = (e) => {
    let sampleIndex = keyMapping[e.code];

    if (sampleIndex === undefined || selectedModule === null) return;

    let note =
      sampleIndex +
      (modules[selectedModule].type === 1 ? playingOctave * 12 : 0);

    if (pressedKeys.includes(note)) return;

    setPressedKeys((prev) => [...prev, note]);

    playNoteFunction[0](note);
  };

  const releaseNote = (e) => {
    let sampleIndex = keyMapping[e.code];

    if (sampleIndex === undefined || selectedModule === null) return;

    let note =
      sampleIndex +
      (modules[selectedModule].type === 1 ? playingOctave * 12 : 0);

    if (!pressedKeys.includes(note)) return;

    setPressedKeys((prev) => prev.filter((e) => e !== note));

    playNoteFunction[1](note);
  };

  const selectionAction = (action) => {
    if (!selection || selection.length < 0) return;
    if (action === "delete") {
      setModules((prev) =>
        prev.map((mod, modIndex) => {
          let newModule = { ...mod };
          let notesToRemove = selectedNotes[modIndex];
          newModule.score = newModule.score.filter(
            (note, noteIndex) => !notesToRemove.includes(noteIndex)
          );
          return newModule;
        })
      );
      setSelectedNotes([]);
    }
  };

  const handleCopy = () => {
    //console.log("copied", copiedData);
  };

  const handlePaste = () => {};

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

    playNote(e);

    switch (e.keyCode) {
      case 32:
        togglePlaying(e);
        break;
      case 8:
        selectionAction("delete");
        break;
      case 65:
        break;
      case 37:
      case 38:
      case 39:
      case 40:
        handleArrowKey(e);
        break;
      case 90:
        setCursorMode((prev) => (prev ? null : "edit"));
        break;
      default:
        break;
    }
  };

  const handleKeyUp = (e) => {
    Tone.start();
    releaseNote(e);
  };

  const handleArrowKey = (event) => {
    event.preventDefault();
    if (event.keyCode === 38) {
      setSessionSize((prev) => (prev === 128 ? prev : prev + 1));
    }
    if (event.keyCode === 40) {
      setSessionSize((prev) => (prev === 1 ? prev : prev - 1));
    }
    if (event.keyCode === 37) {
      setGridSize((prev) => (prev === 1 ? prev : prev / 2));
    }
    if (event.keyCode === 39) {
      setGridSize((prev) => (prev === 32 ? prev : prev * 2));
    }
  };

  /*========================================================================================*/
  /*========================================================================================*/
  /*========================================================================================*/
  /*=====================================USEEFFECTS=========================================*/
  /*========================================================================================*/
  /*========================================================================================*/
  /*========================================================================================*/

  useEffect(() => {
    //TODO: Completely clear Tone instance, disposing context
    return () => {
      instruments.forEach((e) => e.dispose());
      //clearEvents("all");
      console.log("transport cleared");
    };
  }, []);

  useEffect(() => {
    //resetWorkspace();
    Tone.Transport.loop = true;
    Tone.Transport.loopStart = 0;
    instruments.forEach((e) => e.dispose());
    //clearEvents("all");
    console.log("transport cleared");

    let session = {
      description: "",
      tags: [],
      bpm: Tone.Transport.bpm.value,
      modules: modules,
    };

    if (props.user && props.user.uid !== firebase.auth().currentUser.uid) {
      props.createNewSession(session);
      return;
    }

    loadSession();
    //!props.session.length && Tone.Transport.start()
  }, [props.session, sessionKey]);

  useEffect(() => {
    //registerSession();
    //console.log(isLastChangeFromServer ? "server change" : "local change");
    console.log(modules);
    //console.log(modules, instruments, instrumentsLoaded);
    if (isLoaded) {
      savingMode === "simple" && setAreUnsavedChanges(true);

      if (savingMode === "rte") {
        if (isLastChangeFromServer) {
        } else {
          saveToDatabase(modules, null);
        }
      }

      modules && handleUndo();
    }

    setIsLastChangeFromServer(false);
  }, [modules]);

  useEffect(() => {
    //console.log("savingMode", savingMode, isLoaded, !!props.user, editMode);
    if (isLoaded && !!props.user && editMode) updateSavingMode(savingMode);
  }, [isLoaded, editMode, savingMode, DBSessionRef, props.user]);

  useEffect(() => {
    sessionData && setSavingMode(sessionData.rte ? "rte" : "simple");
    if (isLoaded) {
      savingMode === "simple" && setAreUnsavedChanges(true);
      savingMode === "rte" && saveToDatabase(null, sessionData);
    }
    sessionData &&
      setSessionSize((prev) =>
        sessionData.size === prev ? prev : sessionData.size
      );
  }, [sessionData]);

  useEffect(() => {
    if (
      props.user &&
      sessionData &&
      sessionData.editors &&
      sessionData.editors.includes(props.user.uid)
    )
      setEditMode(true);
  }, [sessionData, props.user]);

  useEffect(() => {
    //console.log(cursorMode);
  }, [cursorMode]);

  useEffect(() => {
    Tone.Transport.pause();
    if (
      modules &&
      sessionData &&
      instrumentsLoaded &&
      instruments.every((val) => typeof val === "object") &&
      !instruments.includes(undefined) &&
      instrumentsLoaded.every((val) => val === true) &&
      !instrumentsLoaded.includes(undefined) &&
      !isLoaded
    ) {
      //console.log(instrumentsLoaded, sessionData, instruments);
      onSessionReady();
    }

    //temp
  }, [instrumentsLoaded, sessionData, instruments]);

  useEffect(() => {
    //console.log(notifications);
  }, [notifications]);

  useEffect(() => {
    //console.log("listener", listener);
  }, [listener]);

  useEffect(() => {
    console.log("WP UseEffect triggerd");
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
    //console.log(instrumentsInfo);
  }, [instrumentsInfo]);

  useEffect(() => {
    Tone.Transport.loopEnd = Tone.Time("1m").toSeconds() * sessionSize;

    setSessionData((prev) => {
      let newSesData = { ...prev };
      newSesData.size = sessionSize;
      return newSesData;
    });
    if (sessionSize < zoomPosition[1] + 1 && sessionSize > 0) {
      setZoomPosition((prev) => [prev[0], sessionSize - 1]);
    }

    //console.log("sessionSize", sessionSize);
  }, [sessionSize]);

  useEffect(() => {
    premiumMode && console.log("=====PREMIUM MODE ON=====");
  }, [premiumMode]);

  useEffect(() => {
    //console.log(areUnsavedChanges);

    if (
      !props.hidden &&
      isLoaded &&
      savingMode === "simple" &&
      !areUnsavedChanges
    )
      saveToDatabase(modules, sessionData);

    props.setUnsavedChanges && props.setUnsavedChanges(areUnsavedChanges);
  }, [areUnsavedChanges]);

  useEffect(() => {
    //console.log(editorProfiles);
  }, [editorProfiles]);

  useEffect(() => {
    if (metronome) metronome.volume.value = metronomeState ? 0 : -999;
  }, [metronomeState]);

  useEffect(() => {
    modules && updateSelectedNotes();
  }, [selection]);

  useEffect(() => {
    //console.log(selectedNotes);
  }, [selectedNotes]);

  useEffect(() => {
    let begin = zoomPosition[0] * Tone.Time("1m").toSeconds();
    Tone.Transport.setLoopPoints(
      begin,

      (zoomPosition[1] + 1) * Tone.Time("1m").toSeconds()
    );

    if (Tone.Transport.seconds < begin) {
      Tone.Transport.seconds = begin;
    }
  }, [zoomPosition]);

  useEffect(() => {
    setMenuOpen(false);
  }, [IEOpen]);

  /*================================================================ */
  /*================================================================ */
  /*===============================JSX============================== */
  /*================================================================ */
  /*================================================================ */

  return modules !== undefined ? (
    <div
      className="workspace"
      tabIndex={0}
      style={{
        display: props.hidden ? "none" : "flex",
        cursor:
          cursorMode !== null
            ? "url('edit_black_24dp.svg'),pointer"
            : "default",
      }}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      <LoadingScreen open={modules === null} />
      <div className="ws-header">
        {sessionKey && (
          <WorkspaceTitle
            sessionData={sessionData}
            setSessionData={setSessionData}
            sessionKey={sessionKey}
            editMode={editMode}
            user={props.user}
            sessionSize={sessionSize}
            setPremiumMode={setPremiumMode}
            handlePageNav={props.handlePageNav}
            editorProfiles={editorProfiles}
            setEditorProfiles={setEditorProfiles}
          />
        )}
        <div className="ws-commands" tabIndex="-1">
          <IconButton
            size="large"
            tabIndex="-1"
            onClick={() => {
              Tone.Transport.seconds = 0;
            }}
          >
            <Icon style={{ color: "white", fontSize: 36 }}>skip_previous</Icon>
          </IconButton>
          <IconButton size="large" tabIndex="-1" onClick={togglePlaying}>
            <Icon style={{ color: "white", fontSize: 36 }}>
              {isPlaying ? "pause" : "play_arrow"}
            </Icon>
          </IconButton>
          <IconButton
            size="large"
            tabIndex="-1"
            color="secondary"
            onClick={toggleRecording}
          >
            <Icon style={{ fontSize: 36 }}>fiber_manual_record</Icon>
          </IconButton>
        </div>
      </div>
      <Fragment>
        {!IEOpen && (
          <WorkspaceTransport
            modules={modules}
            sessionSize={sessionSize}
            setSessionSize={setSessionSize}
            gridSize={gridSize}
            setGridSize={setGridSize}
            selectedModule={selectedModule}
            setSelectedModule={setSelectedModule}
          />
        )}

        {!IEOpen && (
          <WorkspaceRuler
            modules={modules}
            sessionSize={sessionSize}
            zoomPosition={zoomPosition}
            setZoomPosition={setZoomPosition}
          />
        )}

        <div className="ws-grid-cont" tabIndex="-1">
          {IEOpen && (
            <InstrumentEditor
              module={modules[selectedModule]}
              instrument={instruments[selectedModule]}
              instrumentInfo={instrumentsInfo[selectedModule]}
              setInstrumentsInfo={setInstrumentsInfo}
              setModules={setModules}
              setInstruments={setInstruments}
              resetUndoHistory={() => handleUndo("RESET")}
              index={selectedModule}
              setIEOpen={setIEOpen}
            />
          )}
          <WorkspaceGrid
            modules={modules}
            sessionSize={sessionSize}
            setSessionSize={setSessionSize}
            gridSize={gridSize}
            isRecording={isRecording}
            selection={selection}
            setSelection={setSelection}
            cursorMode={cursorMode}
            zoomPosition={zoomPosition}
            selectedModule={selectedModule}
            IEOpen={IEOpen}
          >
            {selectedModule !== null ? (
              <ModuleRow
                tabIndex={-1}
                key={modules[selectedModule].id}
                index={selectedModule}
                selectedModule={selectedModule}
                module={modules[selectedModule]}
                instrument={instruments[selectedModule]}
                instruments={instruments}
                setInstruments={setInstruments}
                loaded={instrumentsLoaded[selectedModule]}
                setInstrumentsLoaded={setInstrumentsLoaded}
                sessionData={sessionData}
                sessionSize={sessionSize}
                setModules={setModules}
                editMode={editMode}
                resetUndoHistory={() => handleUndo("RESET")}
                selection={selection}
                setSelection={setSelection}
                selectedNotes={selectedNotes[selectedModule]}
                setSelectedNotes={setSelectedNotes}
                duplicateModule={duplicateModule}
                setSnackbarMessage={setSnackbarMessage}
                isLoaded={isLoaded}
                handlePageNav={props.handlePageNav}
                setAreUnsavedChanges={setAreUnsavedChanges}
                cursorMode={cursorMode}
                gridSize={gridSize}
                isRecording={isRecording}
                playingOctave={playingOctave}
                setPlayNoteFunction={setPlayNoteFunction}
                zoomPosition={zoomPosition}
                setModuleRows={setModuleRows}
              />
            ) : (
              <Fragment>
                {modules &&
                  modules.map((module, moduleIndex) => (
                    <ClosedTrack
                      tabIndex={-1}
                      key={module.id}
                      index={moduleIndex}
                      selectedModule={selectedModule}
                      setSelectedModule={setSelectedModule}
                      module={module}
                      instrument={instruments[moduleIndex]}
                      setInstruments={setInstruments}
                      loaded={instrumentsLoaded[moduleIndex]}
                      setInstrumentsLoaded={setInstrumentsLoaded}
                      sessionData={sessionData}
                      sessionSize={sessionSize}
                      setModules={setModules}
                      editMode={editMode}
                      resetUndoHistory={() => handleUndo("RESET")}
                      selection={selection}
                      setSelection={setSelection}
                      selectedNotes={selectedNotes[moduleIndex]}
                      duplicateModule={duplicateModule}
                      setSnackbarMessage={setSnackbarMessage}
                      isLoaded={isLoaded}
                      handlePageNav={props.handlePageNav}
                      setAreUnsavedChanges={setAreUnsavedChanges}
                      cursorMode={cursorMode}
                      gridSize={gridSize}
                      isRecording={isRecording}
                      zoomPosition={zoomPosition}
                    />
                  ))}
                <IconButton tabIndex="-1" onClick={() => setModulePicker(true)}>
                  <Icon>add</Icon>
                </IconButton>
              </Fragment>
            )}
          </WorkspaceGrid>
        </div>
      </Fragment>

      <div className="ws-note-input">
        {selectedModule !== null && (
          <Fragment>
            <NotesInput
              keyMapping={keyMapping}
              module={modules && modules[selectedModule]}
              instrument={instruments[selectedModule]}
              pressedKeys={pressedKeys}
              setPressedKeys={setPressedKeys}
              handlePageNav={props.handlePageNav}
              playNoteFunction={playNoteFunction}
              playingOctave={playingOctave}
              setPlayingOctave={setPlayingOctave}
              moduleRows={moduleRows}
              instrumentInfo={instrumentsInfo[selectedModule]}
            />
            <div className="ws-note-input-options">
              {modules[selectedModule].type === 1 && (
                <div style={{ marginLeft: "auto" }}>
                  Octave {playingOctave + 1}
                  <IconButton
                    onClick={() =>
                      setPlayingOctave((prev) => (prev > 0 ? prev - 1 : prev))
                    }
                  >
                    <Icon>navigate_before</Icon>
                  </IconButton>
                  <IconButton
                    onClick={() =>
                      setPlayingOctave((prev) => (prev < 6 ? prev + 1 : prev))
                    }
                  >
                    <Icon>navigate_next</Icon>
                  </IconButton>
                </div>
              )}
            </div>
          </Fragment>
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
          sessionData={sessionData}
        />
      )}
      {mixerOpened && (
        <Mixer
          modules={modules}
          instruments={instruments}
          setModules={setModules}
          setMixerOpened={setMixerOpened}
        />
      )}
      {/*setModulesVolume={setModulesVolume}*/}
      <Fab
        tabIndex={-1}
        color="primary"
        className="ws-fab-main"
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        <Icon>{menuOpen ? "close" : "menu"}</Icon>
      </Fab>
      <Modal
        BackdropProps={{
          timeout: 500,
        }}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      >
        <Fragment>
          <div
            style={{
              width: 56,
              right: 16,
              position: "fixed",
              bottom: 80,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Fab color="primary" className="ws-fab-v">
              <Icon>settings</Icon>
            </Fab>

            <Fab color="primary" className="ws-fab-v">
              <Icon>download</Icon>
            </Fab>

            <Fab color="primary" className="ws-fab-v">
              <Icon>save</Icon>
            </Fab>
          </div>
          <div
            style={{
              right: 80,
              position: "fixed",
              bottom: 16,
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Fab
              className="ws-fab-h"
              onClick={() => setCursorMode((prev) => (!prev ? "edit" : null))}
            >
              <Icon style={{ transform: !cursorMode && "rotate(-45deg)" }}>
                {cursorMode ? "edit" : "navigation"}
              </Icon>
            </Fab>
            <Fab
              className="ws-fab-h"
              onClick={() => setIEOpen((prev) => !prev)}
              color="primary"
            >
              <Icon>piano</Icon>
            </Fab>
          </div>
        </Fragment>
      </Modal>
      {/* <Paper
        className="ws-opt-btn-cont"
        style={{ height: optionsMenu ? (editMode ? 240 : 144) : 0 }}
      >
        <IconButton
          tabIndex={-1}
          className="ws-fab ws-fab-mix"
          color="primary"
          onClick={() => setMixerOpened((prev) => (prev ? false : true))}
        >
          <Icon style={{ transform: "rotate(90deg)" }}>tune</Icon>
        </IconButton>
        {editMode && (
          <Fragment>
            {sessionData && (
              <SessionSettings
                premiumMode={premiumMode}
                sessionData={sessionData}
                setSessionData={setSessionData}
                editorProfiles={editorProfiles}
                setEditorProfiles={setEditorProfiles}
              />
            )}

            <Tooltip title={t("misc.saveChanges")}>
              <IconButton
                disabled={!areUnsavedChanges || !props.user}
                tabIndex={-1}
                className="ws-fab ws-fab-save"
                color="primary"
                onClick={() => setAreUnsavedChanges(false)}
              >
                <Icon>save</Icon>
              </IconButton>
            </Tooltip>
          </Fragment>
        )}

        {!props.hidden && isLoaded && sessionData && (
          <Exporter
            sessionSize={sessionSize}
            sessionData={sessionData}
            modules={modules}
            modulesInstruments={instruments}
          />
        )}

        {sessionData && (
          <Tooltip
            title={
              !props.user
                ? "Log in to be able to copy sessions"
                : (props.user && props.user.uid) !== sessionData.creator &&
                  !sessionData.alwcp
                ? "The user doesn't allow this session to be copied"
                : "Create a copy"
            }
            placement="top"
          >
            <div>
              <IconButton
                tabIndex={-1}
                color="primary"
                className="ws-fab ws-fab-copy"
                disabled={
                  !props.user ||
                  (props.user.uid !== sessionData.creator && !sessionData.alwcp)
                }
                onClick={() => setSessionDupDialog(true)}
              >
                <Icon>content_copy</Icon>
              </IconButton>
            </div>
          </Tooltip>
        )}
      </Paper> */}
      <Snackbar
        open={!!snackbarMessage}
        message={snackbarMessage}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
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
      <ActionConfirm
        dupSession
        open={sessionDupDialog}
        onClose={() => setSessionDupDialog(false)}
        action={handleSessionCopy}
      />
    </div>
  ) : (
    <NotFoundPage
      type="workspace"
      handlePageNav={(ev) => props.handlePageNav("explore", "", ev)}
    />
  );
}

export default Workspace;

const deepCopy = (a) => JSON.parse(JSON.stringify(a));

const compareObjectProperties = (a, b) =>
  userSubmitedSessionProps
    .map(
      (e) =>
        //e === "name" && console.log(JSON.stringify(a[e]), JSON.stringify(b[e]));
        JSON.stringify(a[e]) === JSON.stringify(b[e])
    )
    .every((e) => e === true);

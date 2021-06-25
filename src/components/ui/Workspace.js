import React, { useState, useEffect, Fragment, useRef } from "react";
import * as Tone from "tone";
import firebase from "firebase";

import { useParams } from "react-router-dom";

import {
  Fab,
  Icon,
  IconButton,
  Button,
  Typography,
  Tooltip,
  Snackbar,
  Avatar,
} from "@material-ui/core";

import { instruments } from "../../assets/instrumentpatches";

import { starterSession } from "../../assets/starterSession";

import "./Workspace.css";

import Module from "../Module/Module";
import PlaceholderModule from "../Module/PlaceholderModule";

import WorkspaceTitle from "./WorkspaceTitle";

import ModulePicker from "./ModulePicker";
import Exporter from "./Exporter";
import SessionSettings from "./SessionSettings";
import Mixer from "./mixer/Mixer";
import SessionProgressBar from "./SessionProgressBar";

import {
  patchLoader,
  loadDrumPatch,
  loadSynthFromGetObject,
  adaptSequencetoSubdiv,
} from "../../assets/musicutils";

import { clearEvents } from "../../utils/TransportSchedule";
import { createNewSession } from "../../utils/sessionUtils";
import { getDefaultNormalizer } from "@testing-library/react";

Tone.Transport.loop = true;
Tone.Transport.loopStart = 0;

function Workspace(props) {
  const [modules, setModules] = useState(null);
  const [sessionData, setSessionData] = useState(null);

  const [instruments, setInstruments] = useState([]);
  const [instrumentsLoaded, setInstrumentsLoaded] = useState([]);
  const [sessionSize, setSessionSize] = useState(0);
  const [modulePicker, setModulePicker] = useState(false);
  const [mixerOpened, setMixerOpened] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [focusedModule, setFocusedModule] = useState(null);
  const [clipboard, setClipboard] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState(null);

  const sessionKey = "-" + useParams().key;

  //to avoid running startup scripts for each new instrument
  const [initialLoad, setInitialLoad] = useState(false);

  const [DBSessionRef, setDBSessionRef] = useState(null);
  //used at the time only for passing session name to Exporter

  //a copy of the instruments, to be able to use them on export function
  //to undo and redo
  const [sessionHistory, setSessionHistory] = useState([]);

  const handleSessionCopy = () => {
    DBSessionRef.get().then((r) => props.createNewSession(r.val()));
  };

  const adaptSessionSize = () => {
    //console.log("checked");
    if (modules === null) return;
    let lengths = modules.map((module) =>
      module.type === 2
        ? Math.ceil(
            module.score[module.score.length - 1].time +
              module.score[module.score.length - 1].duration
          )
        : module.type === 3
        ? Math.ceil(
            (module.score[0].duration +
              module.score[0].time +
              Tone.Time("1m").toSeconds() * 0.5) /
              Tone.Time("1m").toSeconds()
          )
        : module.type === 4
        ? module.size
        : /* Math.ceil(
            Math.max(
              ...module.score
                .sort((a, b) => a.time + a.duration - (b.time + b.duration))
                .map((e) => e.time + e.duration)
            )
          ) */
          module.score.length
    );
    let longestModule = Math.max(...lengths);
    let newSessionSize =
      longestModule > 8
        ? 16
        : longestModule > 4
        ? 8
        : longestModule > 2
        ? 4
        : longestModule > 1
        ? 2
        : 1;

    if (newSessionSize !== sessionSize) {
      setSessionSize(newSessionSize);
      Tone.Transport.loopEnd = Tone.Time("1m").toSeconds() * newSessionSize;
      console.log("Session size updated: " + newSessionSize);
    }
  };

  const loadSession = () => {
    //TODO: optimize this, avoid call from server for each session load
    console.log("loading session: ", sessionKey);
    if (props.hidden) {
      setModules(props.session.modules);
      Tone.Transport.bpm.value = props.session.bpm;
      setEditMode(true);
      loadSessionInstruments(props.session.modules);
    } else if (sessionKey === null) {
      console.log("session is null!");
      setModules([]);
    }
    //
    else if (sessionKey === "-newSession") {
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
      loadSessionInstruments(props.session.modules);
    }
    //
    else if (typeof sessionKey === "string") {
      let sessionRef =
        sessionKey !== null &&
        firebase.database().ref("sessions").child(sessionKey);
      setDBSessionRef(!sessionRef ? null : sessionRef);
      //Check for editmode and get title
      sessionRef.get().then((snapshot) => {
        let sessionData = snapshot.val();
        //console.log(snapshot.val().modules + "-----");
        let data = { ...sessionData };
        delete data.modules;
        setSessionData(data);

        if (sessionData.hasOwnProperty("modules")) {
          setInstrumentsLoaded(Array(sessionData.modules.length).fill(false));
          loadSessionInstruments(sessionData.modules);
          setModules(sessionData.modules);
        }

        Tone.Transport.bpm.value = sessionData.bpm;

        let editors = sessionData.editors;
        console.log(editors);
        props.user && editors.includes(props.user.uid) && setEditMode(true);
        let name = sessionData.name;
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
    setInstruments(Array(sessionModules.length).fill(false));

    //console.log("session instr loading");

    let moduleInstruments = [];
    sessionModules.map((module, moduleIndex) => {
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

  const loadNewModuleInstrument = (module, index) => {
    let instrument;
    //console.log("inserting new instrument on" + index);
    if (module.type === 0) {
      if (typeof module.instrument === "string") {
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

  const saveToDatabase = (input) => {
    if (DBSessionRef !== null) {
      input.length !== undefined
        ? DBSessionRef.child("modules").set(modules)
        : DBSessionRef.set({ ...sessionData, modules: modules });
    }
    /* DBSessionRef.get().then((snapshot) => {
        snapshot !== modules
          ? DBSessionRef.child("modules").set(modules)
          : console.log("Checked but not atualized");
      }); */
  };

  const updateFromDatabase = (modulesData) => {
    //if (!compareObjectsArray(modules, modulesData)) {
    //console.log("ITS DIFFERENT!!!")
    //console.log("moduled loaded from server:" + modulesData);
    let data = { ...modulesData };
    delete data.modules;
    setSessionData(data);
    setModules(modulesData.modules);
    //console.log("UPDATED");
    //} else {
    //console.log("ITS THE SAME!!!");
    //}
  };

  const onSessionReady = () => {
    if (!props.hidden && DBSessionRef !== null) {
      DBSessionRef.on("value", (snapshot) => {
        updateFromDatabase(snapshot.val());
      });
    }

    instruments.map((e, i) => {
      if (!!e) {
        e.volume.value = modules[i].volume;
        e._volume.mute = modules[i].muted;
      }
    });

    props.hidden &&
      props.setPlayingLoadingProgress(
        Math.floor(
          (instrumentsLoaded.filter((e) => e !== false).length /
            instrumentsLoaded.length) *
            100
        )
      );

    Tone.Transport.seconds = 0;
    props.hidden ? Tone.Transport.start() : Tone.Transport.pause();
    console.log("session ready!");
    setInitialLoad(true);
  };

  const unfocusModules = (e) => {
    e.target.classList.contains("workspace") && setFocusedModule(null);
  };

  const handleCopy = () => {
    if (focusedModule == null) return;
    let currentMeasure = Tone.Transport.position.split(":")[0];
    let module = modules[focusedModule];

    if (module.type !== 0 && module.type !== 1) return;

    let copiedData =
      module.type === 0 || module.type === 1
        ? [...module.score[currentMeasure]]
        : null;
    setClipboard([module.type, copiedData]);
    setSnackbarMessage(
      `Measure copied from module ${focusedModule + 1} "${module.name}"`
    );

    //console.log("copied", copiedData);
  };

  const handlePaste = () => {
    if (focusedModule == null) return;
    if (!clipboard) {
      setSnackbarMessage("Nothing to paste");
      return;
    }

    let currentMeasure = Tone.Transport.position.split(":")[0];
    let module = modules[focusedModule];

    if (clipboard[0] !== module.type) {
      setSnackbarMessage(
        "The content you are trying to paste belongs to a different type of module"
      );
      return;
    }

    if (module.type !== 0 && module.type !== 1) return;

    let subdivisionChanged = false;

    setModules((prev) => {
      let newModules = [...prev];

      if (
        clipboard.length !==
        newModules[focusedModule].score[currentMeasure].length
      ) {
        newModules[focusedModule].score = newModules[focusedModule].score.map(
          (e) => adaptSequencetoSubdiv(e, clipboard.length)
        );
        subdivisionChanged = true;
      }

      newModules[focusedModule].score[currentMeasure] = [...clipboard];

      return newModules;
    });
    setSnackbarMessage(
      `Copied measure pasted on module ${focusedModule + 1} "${module.name}" ${
        subdivisionChanged
          ? "Steps on target was changed to " + clipboard.length
          : ""
      }`
    );
    //console.log("paste", [...clipboard]);
  };

  const handleBackspace = () => {
    if (focusedModule == null) return;
    let currentMeasure = Tone.Transport.position.split(":")[0];
    let module = modules[focusedModule];
    let measureLength = modules[focusedModule].score[currentMeasure].length;

    if (module.type !== 0 && module.type !== 1) return;

    setModules((prev) => {
      let newModules = [...prev];
      newModules[focusedModule].score[currentMeasure] = new Array(
        measureLength
      ).fill(0);

      return newModules;
    });
    setSnackbarMessage(
      `Measure ${currentMeasure + 1} cleared, from module ${
        focusedModule + 1
      } "${module.name}"`
    );
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
    }
  };

  useEffect(() => {
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
  }, [props.user, props.session]);

  useEffect(() => {
    adaptSessionSize();
    //registerSession();
    console.log("Modules", modules);
    !props.hidden && saveToDatabase(modules);
  }, [modules]);

  useEffect(() => {
    if (sessionData) {
      !props.hidden && saveToDatabase(sessionData);
    }
  }, [sessionData]);

  useEffect(() => {
    //console.log(instrumentsLoaded);
    instrumentsLoaded &&
      !instrumentsLoaded.includes(false) &&
      sessionSize > 0 &&
      !initialLoad &&
      onSessionReady();
    //temp
  }, [instrumentsLoaded]);

  useEffect(() => {
    //TODO: Completely clear Tone instance, disposing context
    return () => {
      instruments.forEach((e) => e.dispose());
      clearEvents("all");
      console.log("transport cleared");
    };
  }, []);

  useEffect(() => {
    console.log("editMode", editMode);
    !props.hidden && props.setSessionEditMode(editMode);
  }, [editMode]);

  //useEffect(() => {}, [instruments]);

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
      <SessionProgressBar />

      <WorkspaceTitle
        sessionData={sessionData}
        editMode={editMode}
        user={props.user}
      />

      {modules !== null ? (
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
              setFocusedModule={setFocusedModule}
            />
            {moduleIndex % 3 == 1 && <div className="break" />}
          </Fragment>
        ))
      ) : !modules ? (
        [1, 1, 1, 1].map(() => <PlaceholderModule />)
      ) : !modules.length && !instrumentsLoaded.length ? (
        <Fragment>
          <Typography variant="h1">:v</Typography>
          <div className="break" />
          <p>No Modules!</p>
        </Fragment>
      ) : (
        ""
      )}
      <div className="break" />
      {editMode && (
        <Tooltip title="Add new module">
          <IconButton
            color="primary"
            style={{ marginTop: 48 }}
            onClick={() => setModulePicker(true)}
          >
            <Icon style={{ fontSize: 40 }}>add</Icon>
          </IconButton>
        </Tooltip>
      )}

      {modulePicker && (
        <ModulePicker
          tabIndex={-1}
          open={modulePicker}
          onClose={() => setModulePicker(false)}
          setModulePicker={setModulePicker}
          setModules={setModules}
          loadNewModuleInstrument={loadNewModuleInstrument}
          modules={modules}
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
          onClick={props.togglePlaying}
        >
          <Icon>{isPlaying ? "pause" : "play_arrow"}</Icon>
        </Fab>

        {editMode && (
          <Fab
            tabIndex={-1}
            className="ws-fab ws-fab-mix"
            color="primary"
            onClick={() => setMixerOpened((prev) => (prev ? false : true))}
          >
            <Icon style={{ transform: "rotate(90deg)" }}>tune</Icon>
          </Fab>
        )}

        {!props.hidden && (
          <Exporter
            sessionSize={sessionSize}
            sessionData={sessionData}
            modules={modules}
            modulesInstruments={instruments}
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
        autoHideDuration={4000}
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
      {/*<Button onClick={()=>{instruments.map(e=>{
        let pushedSessionRef = firebase
        .database()
        .ref("patches")
        .push(e);
      console.log(pushedSessionRef.key);
      })}}>PUSHHH</Button>*/}
    </div>
  );
}

export default Workspace;

/* const compareObjectsArray = (arr1, arr2) => {
  if (!arr1 || !arr2) return false;

  const parseArr = (parsingArray) =>
    JSON.stringify(
      parsingArray.map((parsingObj) =>
        Object.keys(parsingObj)
          .sort()
          .reduce((obj, key) => {
            obj[key] = parsingObj[key];
            return obj;
          }, {})
      )
    );

  //console.log(
  //  parseArr(arr1),
  //  "><===><",
  //  parseArr(arr2),
  //  parseArr(arr1) === parseArr(arr2) ? "equal" : "different"
  //);

  return parseArr(arr1) === parseArr(arr2);
};
 */

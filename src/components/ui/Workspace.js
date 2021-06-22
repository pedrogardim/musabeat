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
} from "@material-ui/core";

import { instruments } from "../../assets/instrumentpatches";

import { starterSession } from "../../assets/starterSession";

import "./Workspace.css";

import Module from "../Module/Module";
import PlaceholderModule from "../Module/PlaceholderModule";

import ModulePicker from "./ModulePicker";
import Exporter from "./Exporter";
import Mixer from "./mixer/Mixer";
import SessionProgressBar from "./SessionProgressBar";

import {
  patchLoader,
  loadDrumPatch,
  loadSynthFromGetObject,
  adaptSequencetoSubdiv,
} from "../../assets/musicutils";

import { clearEvents } from "../../utils/TransportSchedule";

Tone.Transport.loop = true;
Tone.Transport.loopStart = 0;

function Workspace(props) {
  const [modules, setModules] = useState(null);
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

  const [sessionTitle, setSessionTitle] = useState(false);

  const sessionKey = "-" + useParams().key;

  //to avoid running startup scripts for each new instrument
  const [initialLoad, setInitialLoad] = useState(false);

  const [DBSessionRef, setDBSessionRef] = useState(null);
  //used at the time only for passing session name to Exporter
  const [sessionData, setSessionData] = useState(null);

  //a copy of the instruments, to be able to use them on export function
  //to undo and redo
  const [sessionHistory, setSessionHistory] = useState([]);

  const handleSessionCopy = () => {
    DBSessionRef.get().then((r) => props.createNewSession(r.val()));
  };

  const adaptSessionSize = () => {
    if (modules === null) return;
    let lengths = modules.map((module) =>
      module.type === 2
        ? Math.ceil(
            module.score[module.score.length - 1].time +
              module.score[module.score.length - 1].duration
          )
        : module.type === 3
        ? Math.ceil(
            (module.score[0].duration + module.score[0].time) /
              Tone.Time("1m").toSeconds()
          )
        : module.score.length
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
      if (
        (!props.hidden &&
          props.user &&
          props.session.editors.includes(props.user.uid)) ||
        !props.session.creator
      ) {
        setEditMode(true);
        setSessionTitle(props.session.name);
      }
      loadSessionInstruments(props.session.modules);
    } else if (sessionKey === null) {
      console.log("session is null!");
      setModules([]);
    } else if (sessionKey === "-newSession") {
      if (props.session === null) {
        props.createNewSession();
        return;
      }
      setModules(props.session.modules);
      Tone.Transport.bpm.value = props.session.bpm;
      if (
        (!props.hidden &&
          props.user &&
          props.session.editors.includes(props.user.uid)) ||
        !props.session.creator
      ) {
        setEditMode(true);
        setSessionTitle(props.session.name);
      }
      loadSessionInstruments(props.session.modules);
    } else if (typeof sessionKey === "string") {
      let sessionRef =
        sessionKey !== null &&
        firebase.database().ref("sessions").child(sessionKey);
      setDBSessionRef(!sessionRef ? null : sessionRef);
      //Check for editmode and get title
      sessionRef.get().then((snapshot) => {
        let sessionData = snapshot.val();
        //console.log(snapshot.val().modules + "-----");
        setSessionData(sessionData);

        if (sessionData.hasOwnProperty("modules")) {
          setInstrumentsLoaded(Array(sessionData.modules.length).fill(false));
          loadSessionInstruments(sessionData.modules);
          setModules(sessionData.modules);
        }

        Tone.Transport.bpm.value = sessionData.bpm;

        let editors = sessionData.editors;
        props.user && editors.includes(props.user.uid) && setEditMode(true);
        let name = sessionData.name;

        setSessionTitle(name);
      });
    } else if (typeof sessionKey === "object") {
      setModules(sessionKey.modules);
      Tone.Transport.bpm.value = sessionKey.bpm;
      if (
        (!props.hidden &&
          props.user &&
          sessionKey.editors.includes(props.user.uid)) ||
        !sessionKey.creator
      ) {
        setEditMode(true);
        setSessionTitle(sessionKey.name);
      }
      loadSessionInstruments(sessionKey.modules);
    }
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

  const saveToDatabase = () => {
    DBSessionRef !== null && DBSessionRef.child("modules").set(modules);
    /* DBSessionRef.get().then((snapshot) => {
        snapshot !== modules
          ? DBSessionRef.child("modules").set(modules)
          : console.log("Checked but not atualized");
      }); */
  };

  const updateFromDatabase = (modulesData) => {
    if (!compareObjectsArray(modules, modulesData)) {
      //console.log("ITS DIFFERENT!!!")
      //console.log("moduled loaded from server:" + modulesData);
      setModules(modulesData);
      //console.log("UPDATED");
    } else {
      //console.log("ITS THE SAME!!!");
    }
  };

  const onSessionReady = () => {
    if (!props.hidden && DBSessionRef !== null) {
      DBSessionRef.child("modules").on("value", (snapshot) => {
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

    props.user &&
      props.user.uid !== firebase.auth().currentUser.uid &&
      props.createNewSession(session);
    //!props.session.length && Tone.Transport.start()
  }, [props.user]);

  useEffect(() => {
    adaptSessionSize();
    //registerSession();
    console.log("Modules", modules);
    !props.hidden && saveToDatabase(modules);
  }, [modules]);

  useEffect(() => {
    loadSession();
    //!props.session.length && Tone.Transport.start()
  }, [props.session]);

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

      <div className="app-title">
        <Typography variant="h4">{sessionTitle}</Typography>
        {!editMode && (
          <Tooltip title="View Mode: You don't have the permission to edit this session! To be able to edit it create a copy">
            <Icon className="app-title-alert">visibility</Icon>
          </Tooltip>
        )}
        {editMode && !props.user && (
          <Tooltip title="You are not logged in! Changes will not be saved">
            <Icon className="app-title-alert">no_accounts</Icon>
          </Tooltip>
        )}
      </div>

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
      {!props.hidden && (
        <Exporter
          sessionSize={sessionSize}
          sessionData={sessionData}
          modules={modules}
          modulesInstruments={instruments}
        />
      )}
      {/*<Drawer>{drawerCont}</Drawer>*/}

      {mixerOpened && (
        <Mixer
          modules={modules}
          instruments={instruments}
          setModules={setModules}
        />
      )}
      {/*setModulesVolume={setModulesVolume}*/}

      <Fab
        tabIndex={-1}
        color="primary"
        className="fixed-fab"
        style={{ right: "calc(50% - 27px)" }}
        onClick={props.togglePlaying}
      >
        <Icon>{isPlaying ? "pause" : "play_arrow"}</Icon>
      </Fab>
      {editMode && (
        <Fab
          tabIndex={-1}
          className="fixed-fab"
          color="primary"
          onClick={() => setMixerOpened((prev) => (prev ? false : true))}
        >
          <Icon style={{ transform: "rotate(90deg)" }}>tune</Icon>
        </Fab>
      )}

      <Fab
        tabIndex={-1}
        className="fixed-fab"
        color="primary"
        style={{ left: 24 }}
        onClick={handleSessionCopy}
      >
        <Icon>content_copy</Icon>
      </Fab>

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

const compareObjectsArray = (arr1, arr2) => {
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

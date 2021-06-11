import React, { useState, useEffect, Fragment, useRef } from "react";
import * as Tone from "tone";
import firebase from "firebase";

import {
  Fab,
  Icon,
  IconButton,
  Button,
  Typography,
  Tooltip,
} from "@material-ui/core";

import { instruments } from "../../assets/instrumentpatches";

import { starterSession } from "../../assets/starterSession";

import "./Workspace.css";

import Module from "../Module/Module";
import ModulePicker from "./ModulePicker";
import Exporter from "./Exporter";
import Mixer from "./mixer/Mixer";

import {
  patchLoader,
  loadDrumPatch,
  loadSynthFromGetObject,
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

  const [DBSessionRef, setDBSessionRef] = useState(null);

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
    console.log("loading session: " + props.session);
    if (props.session === null) {
      console.log("session is null!");
      setModules([]);
    } else if (typeof props.session === "string") {
      let sessionRef =
        props.session !== null &&
        firebase.database().ref("sessions").child(props.session);
      setDBSessionRef(!sessionRef ? null : sessionRef);
      //Check for editmode and get title
      sessionRef.get().then((snapshot) => {
        let sessionData = snapshot.val();
        //console.log(snapshot.val().modules + "-----");
        if (sessionData.hasOwnProperty("modules")) {
          loadSessionInstruments(sessionData.modules);
          setModules(sessionData.modules);
        }
        Tone.Transport.bpm.value = sessionData.bpm;

        let editors = sessionData.editors;
        editors.includes(props.user.uid)
          ? setEditMode(true)
          : setEditMode(false);
        let name = sessionData.name;
        props.setAppTitle(name);
      });
    } else if (typeof props.session === "object") {
      setModules(props.session.modules);
      setInstrumentsLoaded(new Array(props.session.modules.length).fill(false));
      Tone.Transport.bpm.value = props.session.bpm;
      !props.hidden && props.session.editors.includes(props.user.uid)
        ? setEditMode(true)
        : setEditMode(false);

      loadSessionInstruments(props.session.modules);
    }
  };

  const loadSessionInstruments = (sessionModules) => {
    let moduleInstruments = [];
    sessionModules.map((module, moduleIndex) => {
      //console.log(instrument)
      //sequencer
      if (module.type === 0) {
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
      //player
      else if (module.type === 3) {
        moduleInstruments[moduleIndex] = new Tone.GrainPlayer(
          module.instrument.url,
          () =>
            setInstrumentsLoaded((prev) => {
              let a = [...prev];
              a[moduleIndex] = true;
              return a;
            })
        ).toDestination();
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
      setInstrumentsLoaded((prev) => {
        let a = [...prev];
        a[index] = false;
        return a;
      });
      instrument = new Tone.Players(module.instrument.urls, () =>
        setInstrumentsLoaded((prev) => {
          let a = [...prev];
          a[index] = true;
          return a;
        })
      ).toDestination();
    }
    //player
    else if (module === 3) {
      setInstrumentsLoaded((prev) => {
        let a = [...prev];
        a[index] = false;
        return a;
      });
      instrument = new Tone.GrainPlayer(module.instrument.url, () =>
        setInstrumentsLoaded((prev) => {
          let a = [...prev];
          a[index] = true;
          return a;
        })
      ).toDestination();
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
    //console.log(JSON.stringify(modules),JSON.stringify(modulesData))
    if (JSON.stringify(modules) !== JSON.stringify(modulesData)) {
      //console.log("ITS DIFFERENT!!!")
      //console.log("moduled loaded from server:" + modulesData);
      setModules(modulesData);
    } else {
      //console.log("ITS THE SAME!!!");
    }
  };

  const handleKeyPress = (event) => {
    Tone.start();

    switch (event.code) {
      case "Space":
        event.preventDefault();
    }
  };

  useEffect(() => {
    adaptSessionSize();
    //registerSession();
    console.log(modules);
    !props.hidden && saveToDatabase(modules);
  }, [modules]);

  useEffect(() => {
    loadSession();
    //!props.session.length && Tone.Transport.start()
  }, [props.session]);

  useEffect(() => {
    if (!props.hidden && DBSessionRef !== null) {
      DBSessionRef.child("modules").on("value", (snapshot) => {
        updateFromDatabase(snapshot.val());
      });
      DBSessionRef.get().then((snapshot) => {
        const modulesData = snapshot.val();
        //setInstrumentsLoaded(new Array(modulesData.length).fill(false));
      });
    }
  }, [DBSessionRef]);

  useEffect(() => {
    //console.log(instrumentsLoaded);
    if (!instrumentsLoaded.includes(false) && sessionSize > 0) {
      //temp
      instruments.map((e, i) => {
        if (!!e) {
          //priorize loaded instrument patch volume
          e._volume.mute = modules[i].muted;
          e.volume.value = modules[i].volume;
          //setModules((prev) => {
          //  let newModules = [...prev];
          //  newModules[i].muted = newModules[i].instrument.volume =
          //    e._volume.mute;
          //  newModules[i].volume = e.volume.value;
          //  return newModules;
          //});
        }
      });
      Tone.Transport.seconds = 0;
      props.hidden ? Tone.Transport.start() : Tone.Transport.pause();
      console.log("session ready!");
    }
    props.hidden &&
      props.setPlayingLoadingProgress(
        Math.floor(
          (instrumentsLoaded.filter((e) => e !== false).length /
            instrumentsLoaded.length) *
            100
        )
      );
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
    !props.hidden && props.setSessionEditMode(editMode);
  }, [editMode]);

  useEffect(() => {
    //console.log(instruments)
  }, [instruments]);

  /**/

  return (
    <div
      className="workspace"
      tabIndex="0"
      style={{
        display: props.hidden ? "none" : "flex",
      }}
      onKeyDown={handleKeyPress}
    >
      {modules !== null && !!modules.length ? (
        modules.map((module, moduleIndex) => (
          <Fragment>
            <Module
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
            />
            {moduleIndex % 3 == 1 && <div className="break" />}
          </Fragment>
        ))
      ) : (
        <Fragment>
          <Typography variant="h1">:v</Typography>
          <div className="break" />
          <p>No Modules!</p>
        </Fragment>
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
          sessionData={starterSession}
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
        color="primary"
        className="fixed-fab"
        style={{ right: "calc(50% - 27px)" }}
        onClick={props.togglePlaying}
      >
        <Icon>{props.isPlaying ? "pause" : "play_arrow"}</Icon>
      </Fab>
      {editMode && (
        <Fab
          className="fixed-fab"
          color="primary"
          onClick={() => setMixerOpened((prev) => (prev ? false : true))}
        >
          <Icon style={{ transform: "rotate(90deg)" }}>tune</Icon>
        </Fab>
      )}

      <Fab
        className="fixed-fab"
        color="primary"
        style={{ left: 24 }}
        onClick={handleSessionCopy}
      >
        <Icon>content_copy</Icon>
      </Fab>
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

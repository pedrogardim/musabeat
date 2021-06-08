import React, { useState, useEffect, Fragment, useRef } from "react";
import * as Tone from "tone";
import firebase from "firebase";

import { Fab, Icon, IconButton, Button, Typography } from "@material-ui/core";

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

import { colors } from "../../utils/materialPalette";

Tone.Transport.bpm.value = starterSession.bpm;
Tone.Transport.loop = true;
Tone.Transport.loopStart = 0;

function Workspace(props) {
  const [modules, setModules] = useState(null);
  const [instruments, setInstruments] = useState([]);
  const [instrumentsLoaded, setInstrumentsLoaded] = useState([]);
  const [sessionSize, setSessionSize] = useState(null);
  const [modulePicker, setModulePicker] = useState(false);
  const [mixerOpened, setMixerOpened] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [DBSessionRef, setDBSessionRef] = useState(null);

  //a copy of the instruments, to be able to use them on export function
  //to undo and redo
  const [sessionHistory, setSessionHistory] = useState([]);

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

  const saveNewSession = () => {
    let parsedSession = {
      name: "New Session",
      bpm: Tone.Transport.bpm.value,
      creator: props.user.uid,
      editors: [],
      modules: modules.map((e) => {
        let module = { ...e };
        module.instrument = {};
        if (
          e.instrument.name !== "Players" &&
          e.instrument.name !== "GrainPlayer"
        )
          module.instrument = e.instrument.get();
        return module;
      }),
    };
    //console.log(parsedSession[0].instrument, parsedSession);
    let pushedSessionRef = firebase
      .database()
      .ref("sessions")
      .push(parsedSession);
    //console.log(pushedSessionRef.key);
  };

  const loadSession = () => {
    console.log("loading session: " + props.session);
    if (props.session === null) {
      console.log("session is null!");
      setModules([]);
    } else {
      let sessionRef =
        props.session !== null &&
        firebase.database().ref("sessions").child(props.session);
      setDBSessionRef(!sessionRef ? null : sessionRef);
      //Check for editmode and get title

      sessionRef.get().then((snapshot) => {
        //console.log(snapshot.val().modules + "-----");
        loadInstruments(snapshot.val().modules);
        setModules(snapshot.val().modules);
        let editors = snapshot.val().editors;
        !props.hidden && editors.includes(props.user.uid)
          ? setEditMode(true)
          : setEditMode(false);
        let name = snapshot.val().name;
        !props.hidden && props.setAppTitle(name);
      });
    }
  };

  const loadInstruments = (sessionModules) => {
    let moduleInstruments = [];
    sessionModules.map((module, moduleIndex) => {
      //console.log(instrument)
      //sequencer
      if (module.type === 0) {
        setInstrumentsLoaded((prev) => {
          let a = [...prev];
          a[moduleIndex] = false;
          return a;
        });
        moduleInstruments.push(
          new Tone.Players(module.instrument.urls, () =>
            setInstrumentsLoaded((prev) => {
              let a = [...prev];
              a[moduleIndex] = true;
              return a;
            })
          ).toDestination()
        );
      }
      //player
      else if (module.type === 3) {
        setInstrumentsLoaded((prev) => {
          let a = [...prev];
          a[moduleIndex] = false;
          return a;
        });
        moduleInstruments.push(
          new Tone.GrainPlayer(module.instrument.url, () =>
            setInstrumentsLoaded((prev) => {
              let a = [...prev];
              a[moduleIndex] = true;
              return a;
            })
          ).toDestination()
        );
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
      else if (
        typeof module.instrument === "object" &&
        module.instrument.name !== "Players" &&
        module.instrument.name !== "GrainPlayer" &&
        instruments[moduleIndex] === null
      ) {
        moduleInstruments.push(loadSynthFromGetObject(props.module.instrument));
      }
    });
    setInstruments(moduleInstruments);
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
    if (!instrumentsLoaded.includes(false)) {
      console.log("started!");
      Tone.Transport.seconds = 0;
      props.hidden ? Tone.Transport.start() : Tone.Transport.pause();
    }
  }, [instrumentsLoaded]);

  useEffect(() => {
    Tone.Transport.cancel(0);
    console.log("transport cleared");
    return () => {
      instruments.forEach((e) => e.dispose());
    };
  }, []);

  useEffect(() => {
    //console.log(instruments);
  }, [instruments]);

  /**/

  return (
    <div
      className="workspace"
      tabIndex="0"
      style={{
        pointerEvents: editMode ? "auto" : "none",
        display: props.hidden ? "none" : "flex",
      }}
      onKeyDown={handleKeyPress}
    >
      {modules !== null && !!modules.length ? (
        modules.map((module, moduleIndex) => (
          <Fragment>
            <Module
              key={module.id}
              index={module.id}
              module={module}
              instrument={instruments[moduleIndex]}
              setInstruments={setInstruments}
              loaded={instrumentsLoaded[moduleIndex]}
              sessionSize={sessionSize}
              setModules={setModules}
            />
            {moduleIndex % 3 == 1 && <div className="break" />}
          </Fragment>
        ))
      ) : (
        <Fragment>
          <Typography variant="h1">😛</Typography>
          <div className="break" />
          <p>No Modules!</p>
        </Fragment>
      )}
      <div className="break" />
      {editMode && (
        <IconButton
          color="primary"
          style={{ marginTop: 48 }}
          onClick={() => setModulePicker(true)}
        >
          <Icon>add</Icon>
        </IconButton>
      )}

      {modulePicker && (
        <ModulePicker
          open={modulePicker}
          onClose={() => setModulePicker(false)}
          setModulePicker={setModulePicker}
          setModules={setModules}
          modules={modules}
        />
      )}
      <Exporter
        sessionSize={sessionSize}
        sessionData={starterSession}
        modules={modules}
        modulesInstruments={instruments}
      />
      {/*<Drawer>{drawerCont}</Drawer>*/}

      {mixerOpened && <Mixer modules={modules} setModules={setModules} />}
      {/*setModulesVolume={setModulesVolume}*/}

      <Fab
        color="primary"
        className="fixed-fab"
        style={{ right: "calc(50% - 12px)" }}
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
        onClick={() => setMixerOpened((prev) => (prev ? false : true))}
        style={{ left: 24 }}
        onClick={saveNewSession}
      >
        <Icon>save</Icon>
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

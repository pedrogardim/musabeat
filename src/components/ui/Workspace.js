import React, { useState, useEffect, Fragment, useRef } from "react";
import * as Tone from "tone";
import firebase from "firebase";

import { Fab, Icon, IconButton, Button } from "@material-ui/core";

import { instruments } from "../../assets/instrumentpatches";

import { starterSession } from "../../assets/starterSession";

import "./Workspace.css";

import Module from "../Module/Module";
import ModulePicker from "./ModulePicker";
import Exporter from "./Exporter";
import Mixer from "./mixer/Mixer";

import { colors } from "../../utils/materialPalette";

Tone.Transport.bpm.value = starterSession.bpm;
Tone.Transport.loop = true;
Tone.Transport.loopStart = 0;

function Workspace(props) {
  const [modules, setModules] = useState([]);
  const [sessionSize, setSessionSize] = useState(null);
  const [modulePicker, setModulePicker] = useState(false);
  const [mixerOpened, setMixerOpened] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [DBSessionRef, setDBSessionRef] = useState(null);

  //a copy of the instruments, to be able to use them on export function
  const [modulesInstruments, setModulesInstruments] = useState([]);

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
    if (props.session === null) {
      console.log("session is null!");
      setModules([]);
    } else {
      console.log(props.session);
      let sessionRef =
        props.session !== null &&
        firebase.database().ref("sessions").child(props.session);
      console.log(`loaded session: ${sessionRef}`);
      setDBSessionRef(!sessionRef ? null : sessionRef);

      //Check for editmode and get title
      sessionRef.get().then((snapshot) => {
        let editors = snapshot.val().editors;
        editors.includes(props.user.uid)
          ? setEditMode(true)
          : setEditMode(false);
        let name = snapshot.val().name;
        props.setAppTitle(name);
      });
    }
  };

  const saveToDatabase = () => {
    DBSessionRef !== null &&
      DBSessionRef.get().then((snapshot) => {
        snapshot !== modules
          ? DBSessionRef.child("modules").set(modules)
          : console.log("Checked but not atualized");
      });
  };

  ////TODO: UNDO
  /* 
  const undoSession = () => {
    setModules(sessionHistory[sessionHistory.length - 2]);
    setSessionHistory((prev) => {
      let newArray = [...prev];
      newArray.pop();
      newArray.pop();
      return newArray;
    });
    console.log(sessionHistory.map((e) => e[0].score[0][0]));
  };

  const registerSession = () => {
    setSessionHistory((prev) => {
      let newInput = [...prev];
      newInput.push([...modules]);
      return newInput;
    });
    console.log("change registered");
  };

  //KEY EVENTS

  const handleKeyPress = (event) => {
    Tone.start();
    switch (event.code) {
      
      case "KeyZ":
        event.preventDefault();
        if (event.metaKey || event.ctrlKey) {
          sessionHistory.length > 1
            ? undoSession()
            : alert("Nothing to be undone");
        }
        break;
      case "KeyX":
        event.preventDefault();
        console.log(sessionHistory);

        break;
    }
  }; 
  */

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
    saveToDatabase(modules);
  }, [modules]);

  useEffect(() => {
    loadSession();
  }, [props.session]);

  useEffect(() => {
    DBSessionRef !== null &&
      DBSessionRef.child("modules").on("value", (snapshot) => {
        const data = snapshot.val();
        setModules(data);
      });
  }, [DBSessionRef]);

  /**/

  return (
    <div
      className="workspace"
      tabIndex="0"
      style={{ pointerEvents: editMode ? "auto" : "none" }}
      onKeyDown={handleKeyPress}
    >
      {modules !== null && !!modules.length ? (
        modules.map((module, moduleIndex) => (
          <Fragment>
            <Module
              key={module.id}
              index={module.id}
              module={module}
              sessionSize={sessionSize}
              setModules={setModules}
              setModulesInstruments={setModulesInstruments}
            />
            {moduleIndex % 3 == 1 && <div className="break" />}
          </Fragment>
        ))
      ) : (
        <p>No Modules!</p>
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
        modulesInstruments={modulesInstruments}
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

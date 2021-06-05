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

  const [isPlaying, setIsPlaying] = useState(false);
  const [modules, setModules] = useState(starterSession.modules);
  const [sessionSize, setSessionSize] = useState(null);
  const [modulePickerVisibility, chooseNewModule] = useState(false);
  const [mixerOpened, setMixerOpened] = useState(false);

  const [DBModulesRef, setDBModulesRef] = useState(null);


  //a copy of the instruments, to be able to use them on export function
  const [modulesInstruments, setModulesInstruments] = useState([]);

  //to undo and redo
  const [sessionHistory, setSessionHistory] = useState([]);



  const handlePlaying = (state) => {
    if (state !== "started") {
      setIsPlaying(true);
    } else {
      
      setIsPlaying(false);
    }
  };

  const addModule = (moduletype) => {
    let module = {
      id: Math.max(...modules.map((e) => e.id)) + 1,
      name: "New Module",
      type: moduletype,
      subdiv: 16,
      patch: 0,
      score: [],
      instrument: {},
      color: colors[Math.floor(Math.random() * colors.length)],
    };
    setModules((prevModules) => [...prevModules, module]);
    chooseNewModule(false);
  };

  const adaptSessionSize = () => {
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
    console.log(parsedSession[0].instrument, parsedSession);
    let pushedSessionRef = firebase
      .database()
      .ref("sessions")
      .push(parsedSession);
    console.log(pushedSessionRef.key);
  };

  const loadSession = () => {
    if(props.session === null){
      setModules([]);
      return;
    }
    else if(typeof props.session === "object"){
      setModules(props.session.modules);
      return;
    }
    else if(typeof props.session === "string"){
      let sessionRef = firebase.database().ref('sessions').child(props.session);
      sessionRef.get().then(snapshot=>setModules(snapshot.val().modules))
      
    }
  };

  const saveToDatabase = () => {
    DBModulesRef !== null && DBModulesRef.set(modules)

  }

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



  useEffect(() => {
    adaptSessionSize();
    //registerSession();
    console.log(modules);
    saveToDatabase(modules);

  }, [modules]);

  useEffect(() => {
    loadSession();
    console.log(props.session);
    let sessionRef = props.session !== null && firebase.database().ref('sessions').child(props.session).child('modules');
    console.log(sessionRef);
    setDBModulesRef(!sessionRef ? null : sessionRef);
  }, [props.session]);

  useEffect(() => {
    handlePlaying(Tone.Transport.state);
  }, [Tone.Transport.state]);


  /*onKeyDown={handleKeyPress}*/

  return (
    <div className="workspace" tabIndex="0">
      {modules.map((module, moduleIndex) => (
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
      ))}
      <div className="break" />
      <IconButton
        color="primary"
        style={{ marginTop: 48 }}
        onClick={() => chooseNewModule(true)}
      >
        <Icon>add</Icon>
      </IconButton>

      {modulePickerVisibility && (
        <ModulePicker
          toggleVisibility={chooseNewModule}
          addNewModule={addModule}
        />
      )}
      <Exporter
        sessionSize={sessionSize}
        sessionData={starterSession}
        modules={modules}
        modulesInstruments={modulesInstruments}

      />
      {/*<Drawer>{drawerCont}</Drawer>*/}

      {mixerOpened && (
        <Mixer
          modules={modules}
          setModules={setModules}
        />

      )}
                  {/*setModulesVolume={setModulesVolume}*/}

      <Fab

        color="primary"
        className="fixed-fab"
        style={{ right: "calc(50% - 12px)" }}
        onClick={() =>
          Tone.Transport.state !== "started"
            ? Tone.Transport.pause()
            : Tone.Transport.start()
        }
      >
        <Icon>{isPlaying ? "pause" : "play_arrow"}</Icon>
      </Fab>
      <Fab
        className="fixed-fab"
        color="primary"
        onClick={() => setMixerOpened((prev) => (prev ? false : true))}
      >
        <Icon style={{ transform: "rotate(90deg)" }}>tune</Icon>
      </Fab>

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

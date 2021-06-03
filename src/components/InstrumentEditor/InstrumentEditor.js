import React, { useState, useEffect, Fragment, useRef } from "react";

import * as Tone from "tone";
import firebase from "firebase";

import {
  Select,
  Typography,
  Slider,
  List,
  Divider,
  InputLabel,
  FormControl,
  CircularProgress,
} from "@material-ui/core";

import AudioFileItem from "./AudioFileItem";
import EnvelopeControl from "./EnvelopeControl";
import SynthParameters from "./SynthParameters";
import OscillatorEditor from "./OscillatorEditor";

import { instruments } from "../../assets/instrumentpatches";
import { kits } from "../../assets/drumkits";
import {
  patchLoader,
  loadDrumPatch,
  detectPitch,
} from "../../assets/musicutils";

import { FileDrop } from "react-file-drop";

import "./InstrumentEditor.css";
import { LocalConvenienceStoreOutlined } from "@material-ui/icons";

function InstrumentEditor(props) {
  const [selectedPatch, setSelectedPatch] = useState("");
  const [instrument, setInstrument] = useState(props.instrument);
  const [draggingOver, setDraggingOver] = useState(false);
  const [patchesList, setPatchesList] = useState([]);

  const ieWrapper = useRef(null);
  /* 
  const lookForPatch = () => {
    //temp
    let instrumentOptions = Object.toJSON(instrument.get());
    instruments.map((e,i)=>Object.toJSON(e.options) === instrumentOptions && setSelectedPatch(i))

  }
 */
  const loadDBPatches = () => {
    //temp
    firebase
      .database()
      .ref("/patches/")
      .once("value")
      .then((snapshot) => {
        let array = Object.keys(snapshot.val()).map((e, i, a) => [
          e,
          snapshot.val()[e].name,
        ]);
        //console.log(array);
        setPatchesList(array);
      });
  };

  const handlePatchSelect = (event) => {
    setSelectedPatch(event.target.value);
    patchLoader(event.target.value,"",setInstrument);

    props.updateModules((previous) =>
      previous.map((module, i) => {
        if (i === props.index) {
          let newModule = { ...module };
          newModule.instrument = event.target.value;
          return newModule;
        } else {
          return module;
        }
      })
    );
  };

  const handleFileDrop = (files, event) => {
    event.preventDefault();
    Tone.Transport.pause();
    let file = files[0];

    setDraggingOver(false);

    file.arrayBuffer().then((arraybuffer) => {
      instrument.context.rawContext.decodeAudioData(
        arraybuffer,
        (audiobuffer) => {
          if (audiobuffer.duration > 5) {
            alert("Try importing a smaller audio file");
            return;
          }

          let fileName =
            instrument.name === "Sampler"
              ? Tone.Frequency(detectPitch(audiobuffer)[0]).toNote()
              : file.name.split(".")[0];

          instrument.add(fileName, audiobuffer, (e) => {
            setSelectedPatch(null);
          });
        },
        (e) => {
          alert(
            "Upps.. there was an error decoding your audio file, try to convert it to other format"
          );
        }
      );
    });
  };

  const handlePlayersFileDelete = (fileName) => {
    //temp solution, Tone.Players doesn't allow .remove()

    //let filteredScore = props.module.score.map((msre)=>msre.map(beat=>beat.filter(el=>JSON.stringify(el)!==fileName)));

    let newInstrument = new Tone.Players().toDestination();
    let deletedBufferName = JSON.stringify(fileName);

    props.instrument._buffers._buffers.forEach((value, key) => {
      if (JSON.stringify(key) !== deletedBufferName)
        newInstrument.add(key, value);
    });

    props.instrument.dispose();

    props.updateModules((previous) =>
      previous.map((module, i) => {
        if (i === props.index) {
          let newModule = { ...module };
          newModule.instrument = {};
          newModule.instrument = newInstrument;
          //newModule.score = [];
          //newModule.score = filteredScore;
          return newModule;
        } else {
          return module;
        }
      })
    );
  };

  const handleSamplerFileDelete = (fileName) => {
    let newInstrument = new Tone.Sampler().toDestination();

    props.instrument._buffers._buffers.forEach((value, key) => {
      if (parseInt(key) !== fileName) newInstrument.add(key, value);
    });

    props.instrument.dispose();

    props.updateModules((previous) =>
      previous.map((module, i) => {
        if (i === props.index) {
          let newModule = { ...module };
          newModule.instrument = {};
          newModule.instrument = newInstrument;
          //newModule.score = [];
          //newModule.score = filteredScore;
          return newModule;
        } else {
          return module;
        }
      })
    );
  };

  let mainContent = "Nothing Here";

  let list = [];

  if (instrument.name === "Players") {
    let bufferObjects = [];

    instrument._buffers._buffers.forEach((e, i, a) =>
      bufferObjects.push([e, i])
    );
    mainContent = (
      <Fragment>
        <List style={{ width: "100%", height: "calc(100% - 78px)" }}>
          {bufferObjects.map((e, i) => (
            <Fragment>
              <AudioFileItem
                key={i}
                index={i}
                instrument={instrument}
                handleFileDelete={handlePlayersFileDelete}
                buffer={e[0]}
                fileName={e[1]}
              />
              <Divider />
            </Fragment>
          ))}
        </List>
      </Fragment>
    );
  } else if (instrument.name === "Sampler") {
    let bufferObjects = [];
    instrument._buffers._buffers.forEach((e, i, a) =>
      bufferObjects.push([e, i])
    );
    mainContent = (
      <Fragment>
        <List style={{ width: "100%", height: "calc(100% - 78px)" }}>
          {bufferObjects.map((e, i) => (
            <Fragment>
              <AudioFileItem
                key={i}
                index={i}
                instrument={instrument}
                handleFileDelete={handleSamplerFileDelete}
                buffer={e[0]}
                fileName={Tone.Frequency(e[1], "midi").toNote()}
              />
              <Divider />
            </Fragment>
          ))}
        </List>
      </Fragment>
    );
  } else {
    list.push(
      <div className="instrument-editor-column" key={0}>
        <OscillatorEditor instrument={instrument} />
      </div>
    );
    list.push(
      <div className="instrument-editor-column" key={1}>
        <SynthParameters instrument={instrument} />
      </div>
    );
    list.push(
      <div
        className="instrument-editor-column"
        style={{ flexDirection: "column" }}
        key={2}
      >
        {Object.keys(instrument.get()).map(
          (envelope, envelopeIndex) =>
            envelope.toLowerCase().includes("envelope") && (
              <EnvelopeControl
                instrument={instrument}
                envelopeType={envelope}
              />
            )
        )}
      </div>
    );
    mainContent = list;
  }

  useEffect(() => {
    props.module.type !== 0 && loadDBPatches();
  }, []);

  useEffect(() => {
    setInstrument(props.instrument);
  }, [props.instrument]);
/* 
  useEffect(() => {
    console.log(patchesList);
  }, [selectedPatch]); */

  return (
    <div
      className="instrument-editor"
      onDragEnter={() => {
        setDraggingOver(true);
        ieWrapper.current.scrollTop = 0;
      }}
      ref={ieWrapper}
    >
        <Select
          native
          className="instrument-editor-patch-select"
          value={selectedPatch}
          onChange={handlePatchSelect}
        >
          {props.module.type === 0
            ? kits.map((kit, kitIndex) => (
                <option key={kitIndex} value={kitIndex}>
                  {kit.name}
                </option>
              ))
            : patchesList.map((kit, kitIndex) => (
                <option key={kitIndex} value={kit[0]}>
                  {kit[1]}
                </option>
              ))}
        </Select>
      

      <div className="break" />

      {mainContent}
      {draggingOver && instrument.name !== "PolySynth" && (
        <FileDrop
          onDragLeave={(e) => {
            setDraggingOver(false);
          }}
          onDrop={(files, event) => handleFileDrop(files, event)}
          className={"file-drop"}
          style={{
            backgroundColor: props.module.color[300],
          }}
        >
          Drop your files here!
        </FileDrop>
      )}
    </div>
  );
}

export default InstrumentEditor;

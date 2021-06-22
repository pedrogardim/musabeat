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
import PatchExplorer from "./PatchExplorer";

import { instruments } from "../../assets/instrumentpatches";
import { kits } from "../../assets/drumkits";
import {
  patchLoader,
  loadDrumPatch,
  detectPitch,
} from "../../assets/musicutils";

import { FileDrop } from "react-file-drop";

import "./InstrumentEditor.css";
import { colors } from "../../utils/materialPalette";

function InstrumentEditor(props) {
  const [draggingOver, setDraggingOver] = useState(false);
  const [patchExplorer, setPatchExplorer] = useState(false);

  const ieWrapper = useRef(null);
  /* 
  const lookForPatch = () => {
    //temp
    let instrumentOptions = Object.toJSON(instrument.get());
    instruments.map((e,i)=>Object.toJSON(e.options) === instrumentOptions && setSelectedPatch(i))

  }
 */

  const handleFileDrop = (files, event) => {
    event.preventDefault();
    Tone.Transport.pause();
    let file = files[0];

    setDraggingOver(false);

    props.setInstrumentLoaded(false);

    file.arrayBuffer().then((arraybuffer) => {
      props.instrument.context.rawContext.decodeAudioData(
        arraybuffer,
        (audiobuffer) => {
          if (audiobuffer.duration > 5) {
            alert("Try importing a smaller audio file");
            return;
          }

          let fileName =
            props.instrument.name === "Sampler"
              ? Tone.Frequency(detectPitch(audiobuffer)[0]).toNote()
              : file.name.split(".")[0];

          props.instrument.name === "Players"
            ? props.instrument.add(
                fileName,
                audiobuffer,
                props.setInstrumentLoaded(true)
              )
            : props.intrument.add(
                Tone.Frequency(detectPitch(audiobuffer)[0]).toNote(),
                audiobuffer,
                props.setInstrumentLoaded(true)
              );

          const user = firebase.auth().currentUser;

          if (user) {
            const storageRef = firebase
              .storage()
              .ref(`/${user.uid}/${file.name.split(".")[0]}`);
            const task = storageRef.put(file);

            task.on(
              "state_changed",
              (snapshot) => {
                console.log(
                  (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                );
              },
              (error) => {
                console.log(error);
              },
              () => {
                storageRef.getDownloadURL().then((r) => {
                  props.onInstrumentMod(r, fileName);
                });
              }
            );
          }
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

    props.setInstrument(newInstrument);
    props.onInstrumentMod("", fileName, true);
  };

  const handleSamplerFileDelete = (fileName) => {
    let newInstrument = new Tone.Sampler().toDestination();

    props.instrument._buffers._buffers.forEach((value, key) => {
      if (parseInt(key) !== fileName) newInstrument.add(key, value);
    });

    props.instrument.dispose();

    props.setInstrument(newInstrument);

    props.setModules((previous) =>
      previous.map((module, i) => {
        if (i === props.index) {
          let newModule = { ...module };
          newModule.instrument = {};
          //newModule.instrument = newInstrument;
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

  if (props.instrument) {
    if (props.module.type === 0) {
      //console.log(props.instrument);
      let bufferObjects = [];
      props.instrument._buffers._buffers.forEach((e, i, a) =>
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
                  instrument={props.instrument}
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
    } else if (props.instrument.name === "Sampler") {
      let bufferObjects = [];
      props.instrument._buffers._buffers.forEach((e, i, a) =>
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
                  instrument={props.instrument}
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
      mainContent = (
        <Fragment>
          <div className="instrument-editor-column" key={0}>
            <OscillatorEditor
              onInstrumentMod={props.onInstrumentMod}
              instrument={props.instrument}
            />
          </div>
          <div className="instrument-editor-column" key={1}>
            <SynthParameters
              onInstrumentMod={props.onInstrumentMod}
              instrument={props.instrument}
            />
          </div>
          <div
            className="instrument-editor-column"
            style={{ flexDirection: "column" }}
            key={2}
          >
            {Object.keys(props.instrument.get()).map(
              (envelope, envelopeIndex) =>
                envelope.toLowerCase().includes("envelope") && (
                  <EnvelopeControl
                    onInstrumentMod={props.onInstrumentMod}
                    instrument={props.instrument}
                    envelopeType={envelope}
                  />
                )
            )}
          </div>
        </Fragment>
      );
    }
  }
  /* 
  useEffect(() => {
    setInstrument(props.instrument);
  }, [props.instrument]); */
  /* 
  useEffect(() => {
    console.log(patchesList);
  }, [selectedPatch]); */

  return (
    <div
      className="instrument-editor"
      style={{
        overflowY:
          props.instrument.name === "Sampler" ||
          props.instrument.name === "Players" ||
          props.instrument.name === "GrainPlayer"
            ? "overlay"
            : "hidden",
      }}
      onDragEnter={() => {
        setDraggingOver(true);
        ieWrapper.current.scrollTop = 0;
      }}
      ref={ieWrapper}
    >
      <PatchExplorer
        patchExplorer={patchExplorer}
        index={props.index}
        setModules={props.setModules}
        setPatchExplorer={setPatchExplorer}
        instrument={props.instrument}
        setInstruments={props.setInstruments}
        setInstrumentsLoaded={props.setInstrumentsLoaded}
        module={props.module}
      />

      <div className="break" />

      {!patchExplorer && mainContent}
      {draggingOver && props.instrument.name !== "PolySynth" && (
        <FileDrop
          onDragLeave={(e) => {
            setDraggingOver(false);
          }}
          onDrop={(files, event) => handleFileDrop(files, event)}
          className={"file-drop"}
          style={{
            backgroundColor: colors[props.module.color][300],
          }}
        >
          Drop your files here!
        </FileDrop>
      )}
    </div>
  );
}

export default InstrumentEditor;

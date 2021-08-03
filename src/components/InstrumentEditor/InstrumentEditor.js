import React, { useState, Fragment, useRef, useEffect } from "react";

import * as Tone from "tone";
import firebase from "firebase";

import { List, Divider } from "@material-ui/core";

import AudioFileItem from "./AudioFileItem";
import EnvelopeControl from "./EnvelopeControl";
import SynthParameters from "./SynthParameters";
import OscillatorEditor from "./OscillatorEditor";
import PatchExplorer from "./PatchExplorer";
import FileUploader from "../ui/Dialogs/FileUploader/FileUploader";

import { FileDrop } from "react-file-drop";

import { detectPitch } from "../../assets/musicutils";

import "./InstrumentEditor.css";
import { colors } from "../../utils/materialPalette";

function InstrumentEditor(props) {
  const [draggingOver, setDraggingOver] = useState(false);
  const [patchExplorer, setPatchExplorer] = useState(true);

  const [filesName, setFilesName] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);

  const oscColumn = useRef(null);
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
    //let file = files[0];
    setDraggingOver(false);
    setUploadingFiles(files);
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

  const getFilesName = () => {
    const getFilesNameFromId = (ids) => {
      Promise.all(
        ids.map(async (e, i) => {
          let filedata = (
            await firebase.firestore().collection("files").doc(e).get()
          ).data();
          return (
            filedata.name +
            "." +
            (filedata.type.replace("audio/", "") === "mpeg" ? "mp3" : "wav")
          );
        })
      ).then((values) => {
        setFilesName(values);
        console.log(values);
      });
    };

    if (typeof props.module.instrument === "string") {
      firebase
        .firestore()
        .collection(props.module.type === 0 ? "drumpatches" : "patches")
        .doc(props.module.instrument)
        .get()
        .then((r) => {
          getFilesNameFromId(Object.values(r.get("urls")));
        });
    } else {
      getFilesNameFromId(Object.values(props.module.instrument.urls));
    }
  };

  let mainContent = "Nothing Here";

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
                  fileLabel={e[1]}
                  fileName={filesName[i]}
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
          <div ref={oscColumn} className="instrument-editor-column" key={0}>
            <OscillatorEditor
              onInstrumentMod={props.onInstrumentMod}
              instrument={props.instrument}
              columnRef={oscColumn}
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

  useEffect(() => {
    getFilesName();
  }, []);

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
        setModulePage={props.setModulePage}
        setPatchExplorer={setPatchExplorer}
        instrument={props.instrument}
        setInstruments={props.setInstruments}
        setInstrument={props.setInstrument}
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

      <FileUploader
        open={uploadingFiles.length > 0}
        files={uploadingFiles}
        setUploadingFiles={setUploadingFiles}
        onInstrumentMod={props.onInstrumentMod}
        instrument={props.instrument}
        setInstrumentLoaded={props.setInstrumentLoaded}
        setFilesName={setFilesName}
      />
    </div>
  );
}

export default InstrumentEditor;

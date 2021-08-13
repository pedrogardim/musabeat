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
import NameInput from "../ui/Dialogs/NameInput";

import { FileDrop } from "react-file-drop";

import {
  detectPitch,
  fileTypes,
  fileExtentions,
} from "../../assets/musicutils";

import "./InstrumentEditor.css";
import { colors } from "../../utils/materialPalette";

function InstrumentEditor(props) {
  const [draggingOver, setDraggingOver] = useState(false);
  const [patchExplorer, setPatchExplorer] = useState(true);

  const [filesName, setFilesName] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [filesId, setFilesId] = useState([]);

  const [renamingLabel, setRenamingLabel] = useState(null);

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
      let labelsWithFilename = { ...ids };
      Promise.all(
        Object.keys(ids).map(async (e, i) => {
          let filedata = (
            await firebase.firestore().collection("files").doc(ids[e]).get()
          ).data();
          labelsWithFilename[e] =
            filedata.name + "." + fileExtentions[parseInt(filedata.type)];
          return filedata.name + "." + fileExtentions[parseInt(filedata.type)];
        })
      ).then((values) => {
        setFilesName(labelsWithFilename);

        //console.log(labelsWithFilename);
      });
    };

    if (typeof props.module.instrument === "string") {
      firebase
        .firestore()
        .collection(props.module.type === 0 ? "drumpatches" : "patches")
        .doc(props.module.instrument)
        .get()
        .then((r) => {
          getFilesNameFromId(r.get("urls"));
          setFilesId(Object.values(r.get("urls")));
        });
    } else {
      getFilesNameFromId(props.module.instrument.urls);
      setFilesId(Object.values(props.module.instrument.urls));
    }
  };

  const renamePlayersLabel = (input, newName) => {
    let labelName = !isNaN(input) ? parseInt(input) : input;
    console.log(labelName, newName);

    let drumMap = props.instrument._buffers._buffers;
    if (drumMap.has(newName)) return;
    drumMap.set(newName, drumMap.get(input));
    drumMap.delete(input);
    if (typeof props.module.instrument === "string") {
      firebase
        .firestore()
        .collection("drumpatches")
        .doc(props.module.instrument)
        .get()
        .then((urls) => {
          setFilesName((prev) => {
            let newFileNames = { ...prev };
            newFileNames[newName] = newFileNames[labelName];
            delete newFileNames[labelName];
            return newFileNames;
          });

          let urlsObj = urls.data().urls;
          urlsObj[newName] = urlsObj[labelName];
          delete urlsObj[labelName];

          props.setModules((prev) => {
            let newModules = [...prev];
            newModules[props.index].instrument = { urls: urlsObj };

            newModules[props.index].score.forEach((measure, msreIndex) => {
              Object.keys(measure).forEach((key) => {
                if (measure[key] !== 0) {
                  newModules[props.index].score[msreIndex][key] = measure[
                    key
                  ].map((e) => (e === labelName ? newName : e));
                }
              });
            });

            return newModules;
          });
        });
    } else {
      setFilesName((prev) => {
        let newFileNames = { ...prev };
        newFileNames[newName] = newFileNames[labelName];
        delete newFileNames[labelName];
        return newFileNames;
      });

      let urlsObj = { ...props.module.instrument.urls };
      urlsObj[newName] = urlsObj[labelName];
      delete urlsObj[labelName];

      props.setModules((prev) => {
        let newModules = [...prev];
        newModules[props.index].instrument = { urls: urlsObj };
        newModules[props.index].score.forEach((measure, msreIndex) => {
          console.log(measure);
          Object.keys(measure).forEach((key) => {
            console.log(
              measure[key],
              labelName,
              measure[key].includes(labelName)
            );
            if (measure[key] !== 0 && measure[key].includes(labelName)) {
              newModules[props.index].score[msreIndex][key] = measure[key].map(
                (e) => {
                  console.log(e, labelName, newName);
                  return e == labelName ? newName : e;
                }
              );
            }
          });
        });
        return newModules;
      });
    }
    setRenamingLabel(null);
  };

  const openFilePage = (id) => {
    //console.log(id);
    const win = window.open("/file/" + id, "_blank");
    win.focus();
  };

  let mainContent = "Nothing Here";

  if (props.instrument) {
    if (props.module.type === 0) {
      //console.log(props.instrument);
      let bufferObjects = [];
      props.instrument._buffers._buffers.forEach((e, i, a) => {
        bufferObjects.push([e, i]);
      });
      //bufferObjects.sort((a, b) => a[1] - b[1]);
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
                  fileName={filesName[e[1]]}
                  setRenamingLabel={setRenamingLabel}
                  openFilePage={() => openFilePage(filesId[i])}
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
                  openFilePage={() => openFilePage(filesId[i])}
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
        module={props.module}
        instrument={props.instrument}
        setInstrumentLoaded={props.setInstrumentLoaded}
        setFilesName={setFilesName}
        renamePlayersLabel={renamePlayersLabel}
        setRenamingLabel={setRenamingLabel}
      />

      {renamingLabel !== null && (
        <NameInput
          select
          open={renamingLabel !== null}
          onClose={() => setRenamingLabel(null)}
          onSubmit={(i) => renamePlayersLabel(renamingLabel, i)}
        />
      )}
    </div>
  );
}

export default InstrumentEditor;

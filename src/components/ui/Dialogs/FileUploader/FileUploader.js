import React, { useState, useEffect } from "react";

import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Icon,
  Chip,
  CircularProgress,
  IconButton,
} from "@material-ui/core";

import * as Tone from "tone";
import firebase from "firebase";

import NameInput from "../../Dialogs/NameInput";

import { useTranslation } from "react-i18next";
import {
  fileTags,
  detectPitch,
  fileTypes,
  fileExtentions,
} from "../../../../assets/musicutils";

import "./FileUploader.css";

function FileUploader(props) {
  const { t } = useTranslation();
  const [uploadState, setUploadState] = useState([]);
  const [uploadingFileIds, setUploadingFileIds] = useState([]);
  const [duplicatedFilesInfo, setDuplicatedFilesInfo] = useState([]);
  const [uploadingFileTags, setUploadingFileTags] = useState([]);
  const [labelsOnInstrument, setLabelsOnInstrument] = useState([]);

  const onClose = () => {
    props.setUploadingFiles([]);
    setUploadingFileTags([]);
    setUploadingFileIds([]);
    setDuplicatedFilesInfo([]);
    setUploadState([]);
    setLabelsOnInstrument([]);
  };

  const uploadFiles = () => {
    props.setInstrumentLoaded(false);

    for (let i = 0; i < props.files.length; i++) {
      let file = props.files[i];
      let isLastFile = i === props.files.length - 1;
      //file to arraybuffer
      console.log(file);
      file.arrayBuffer().then((arraybuffer) => {
        console.log(arraybuffer);

        //arraybuffer to audiobuffer
        props.instrument.context.rawContext.decodeAudioData(
          arraybuffer,
          (audiobuffer) => {
            console.log(audiobuffer);

            //skip if audio is too large
            if (audiobuffer.duration > 10) {
              /* alert(
                `Error on file: "${file.name}" - Try importing a smaller audio file`
              ); */
              setUploadState((prev) => {
                let newState = [...prev];
                newState[i] = "importSmallerFile";
                return newState;
              });
              return;
            }

            //set sound label on instrument
            let labelOnInstrument =
              props.instrument.name === "Sampler"
                ? Tone.Frequency(detectPitch(audiobuffer)[0]).toNote()
                : file.name.split(".")[0];

            //console.log(labelOnInstrument);

            let labelVersion = 2;

            while (
              props.instrument.name === "Players" &&
              props.instrument._buffers._buffers.has(labelOnInstrument)
            ) {
              labelOnInstrument =
                labelOnInstrument.replace(/[0-9]/g, "").replace(" ", "") +
                " " +
                labelVersion;
              labelVersion++;
            }

            setLabelsOnInstrument((prev) => {
              let newLbls = [...prev];
              newLbls[i] = labelOnInstrument;
              return newLbls;
            });

            //add buffer directly to instrument

            props.instrument.name === "Players"
              ? props.instrument.add(
                  labelOnInstrument,
                  audiobuffer,
                  () => isLastFile && props.setInstrumentLoaded(true)
                )
              : props.intrument.add(
                  labelOnInstrument,
                  audiobuffer,
                  () => isLastFile && props.setInstrumentLoaded(true)
                );

            /////
            //UPLOAD FILE
            /////

            const user = firebase.auth().currentUser;
            if (user) {
              let fileInfo = {
                name: file.name.split(".")[0],
                size: file.size,
                dur: parseFloat(audiobuffer.duration.toFixed(3)),
                loaded: 1,
                liked: 0,
                dl: 0,
                user: user.uid,
                categ: [],
                type: fileTypes.indexOf(file.type),
                upOn: firebase.firestore.FieldValue.serverTimestamp(),
              };

              if (props.module.type === 0) fileInfo.categ.push(0);
              if (props.instrument.name === "Sampler") fileInfo.categ.push(1);

              setUploadingFileTags((prev) => {
                let newTags = [...prev];
                newTags[i] = [...fileInfo.categ];
                return newTags;
              });

              //Prevent duplicated files: check for existing file

              const filesRef = firebase.firestore().collection("files");

              filesRef
                .where("dur", "==", fileInfo.dur)
                .where("user", "==", user.uid)
                .where("size", "==", file.size)
                .get()
                .then((result) => {
                  //no matches to uploaded file, then upload it
                  if (result.empty) {
                    filesRef.add(fileInfo).then((ref) => {
                      //upload file to storage
                      const storageRef = firebase.storage().ref(ref.id);
                      const task = storageRef.put(file);

                      setUploadingFileIds((prev) => {
                        let newFileIds = [...prev];
                        newFileIds[i] = ref.id;
                        return newFileIds;
                      });

                      task.on(
                        "state_changed",
                        (snapshot) => {
                          setUploadState((prev) => {
                            let newState = [...prev];
                            newState[i] =
                              (snapshot.bytesTransferred /
                                snapshot.totalBytes) *
                              100;
                            return newState;
                          });
                        },
                        (error) => {
                          console.log(error);
                          filesRef.doc(ref.id).remove();

                          setUploadState((prev) => {
                            let newState = [...prev];
                            newState[i] = "uploadError";
                            return newState;
                          });

                          return;
                        },
                        () => {
                          /////IF UPLOAD SUCCEDS

                          //update instrument on "modules"

                          Boolean(props.onInstrumentMod) &&
                            props.onInstrumentMod(ref.id, labelOnInstrument);

                          //add file id to user in db

                          const userRef = firebase
                            .firestore()
                            .collection("users")
                            .doc(user.uid);

                          userRef.update({
                            files: firebase.firestore.FieldValue.arrayUnion(
                              ref.id
                            ),
                          });
                        }
                      );
                    });
                  }
                  //the file is already uploaded to server, get its id
                  else {
                    let fileid = result.docs[0].id;

                    const originalFileRef = firebase
                      .firestore()
                      .collection("files")
                      .doc(fileid);

                    setUploadingFileIds((prev) => {
                      let newFileIds = [...prev];
                      newFileIds[i] = fileid;
                      return newFileIds;
                    });

                    originalFileRef.update({
                      loaded: firebase.firestore.FieldValue.increment(1),
                    });

                    originalFileRef.get().then((result) => {
                      setDuplicatedFilesInfo((prev) => {
                        let newDPInfo = [...prev];
                        newDPInfo[i] = result.data();
                        return newDPInfo;
                      });
                    });

                    Boolean(props.onInstrumentMod) &&
                      props.onInstrumentMod(fileid, labelOnInstrument);

                    setUploadState((prev) => {
                      let newState = [...prev];
                      newState[i] = "duplicatedFound";
                      return newState;
                    });
                  }
                });

              //add file info in database
            }
          },
          (e) => {
            /* alert(
              `Error on file "${file.name}" - There was an error decoding your audio file, try to convert it to other format`
            ); */
            setUploadState((prev) => {
              let newState = [...prev];
              newState[i] = "decodingError";
              return newState;
            });
            return;
          }
        );
      });
    }
    props.setInstrumentLoaded(true);
  };

  const openFilePage = (id) => {
    //console.log(id);
    const win = window.open("/file/" + id, "_blank");
    win.focus();
  };

  useEffect(() => {
    console.log(props.files);
    if (props.files.length > 0) {
      uploadFiles();
      setUploadState([]);
    }
  }, [props.files]);

  useEffect(() => {
    console.log(uploadState);
  }, [uploadState]);

  return (
    <Dialog open={props.open} onClose={onClose} fullWidth maxWidth={"md"}>
      <DialogTitle>Uploading</DialogTitle>
      <DialogContent>
        <List>
          {Array(props.files.length)
            .fill(0)
            .map((e, i) => (
              <ListItem divider>
                <ListItemText
                  primary={labelsOnInstrument[i]}
                  primaryTypographyProps={{
                    onClick: () =>
                      props.setRenamingLabel(labelsOnInstrument[i]),
                    className: "file-label",
                  }}
                  secondaryTypographyProps={{
                    onClick: () =>
                      uploadingFileIds[i] && openFilePage(uploadingFileIds[i]),
                    variant: "overline",
                    className: uploadingFileIds[i] && "clickable-filename",
                  }}
                  secondary={
                    duplicatedFilesInfo[i]
                      ? `(${duplicatedFilesInfo[i].name}.${
                          fileExtentions[duplicatedFilesInfo[i].type]
                        })`
                      : props.files[i].name
                  }
                />
                {duplicatedFilesInfo[i]
                  ? duplicatedFilesInfo[i].categ.map((e) => (
                      <Chip className={"file-tag-chip"} label={fileTags[e]} />
                    ))
                  : uploadingFileTags[i] &&
                    [uploadingFileTags[i], 1, 1].map((e) => (
                      <Chip
                        clickable
                        onClick={() => openFilePage}
                        className={"file-tag-chip"}
                        label={fileTags[e]}
                      />
                    ))}

                <ListItemSecondaryAction>
                  <Tooltip title={uploadState[i]}>
                    {typeof uploadState[i] === "number" &&
                    uploadState[i] !== 100 ? (
                      <CircularProgress
                        variant={
                          uploadState[i] === 0 ? "indeterminate" : "determinate"
                        }
                        value={uploadState}
                      />
                    ) : (
                      <Icon color="primary">
                        {uploadState[i] === 100
                          ? "done"
                          : uploadState[i] === "uploadError"
                          ? "error"
                          : uploadState[i] === "duplicatedFound"
                          ? "done_all"
                          : uploadState[i] === "importSmallerFile"
                          ? "warning"
                          : uploadState[i] === "decodingError"
                          ? "warning"
                          : uploadState[i]}
                      </Icon>
                    )}
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("dialogs.submit")}</Button>
        {/* <Button color="secondary" onClick={handleConfirm}>
          {t("dialogs.delete")}
        </Button> */}
      </DialogActions>
      <IconButton onClick={onClose} className="mp-closebtn" color="primary">
        <Icon>close</Icon>
      </IconButton>
    </Dialog>
  );
}

export default FileUploader;

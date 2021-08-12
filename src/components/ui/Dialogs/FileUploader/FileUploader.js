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
  CircularProgress,
} from "@material-ui/core";

import * as Tone from "tone";
import firebase from "firebase";

import NameInput from "../../Dialogs/NameInput";

import { useTranslation } from "react-i18next";
import { detectPitch, fileTypes } from "../../../../assets/musicutils";

function FileUploader(props) {
  const { t } = useTranslation();
  const [uploadState, setUploadState] = useState([]);

  const onClose = () => {
    props.setUploadingFiles([]);
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

            console.log(labelOnInstrument);

            let labelVersion = 2;

            while (
              props.instrument.name === "Players" &&
              props.instrument._buffers._buffers.has(labelOnInstrument)
            ) {
              labelOnInstrument = labelOnInstrument + " " + labelVersion;
              labelVersion++;
            }

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
                categ: [0, 0, 0],
                ch: audiobuffer.numberOfChannels,
                type: fileTypes.indexOf(file.type),
                upOn: firebase.firestore.FieldValue.serverTimestamp(),
              };

              console.log(fileInfo);

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

                    console.log(result.docs, fileid);

                    firebase
                      .firestore()
                      .collection("files")
                      .doc(fileid)
                      .update({
                        loaded: firebase.firestore.FieldValue.increment(1),
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
    <Dialog open={props.open} onClose={onClose}>
      <DialogTitle>Uploading:</DialogTitle>
      <DialogContent>
        <List>
          {Array(props.files.length)
            .fill(0)
            .map((e, i) => (
              <ListItem divider>
                <ListItemText primary={props.files[i].name} />
                <ListItemSecondaryAction>
                  <Tooltip title={uploadState}>
                    {typeof uploadState[i] === "number" ||
                    uploadState[i] !== 100 ? (
                      <CircularProgress
                        variant={
                          uploadState[i] === 0 ? "indeterminate" : "determinate"
                        }
                        value={uploadState}
                      />
                    ) : (
                      <Icon>
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
        <Button onClick={onClose}>{t("dialogs.cancel")}</Button>
        {/* <Button color="secondary" onClick={handleConfirm}>
          {t("dialogs.delete")}
        </Button> */}
      </DialogActions>
    </Dialog>
  );
}

export default FileUploader;

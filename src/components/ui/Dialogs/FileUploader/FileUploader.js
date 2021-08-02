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
} from "@material-ui/core";

import * as Tone from "tone";
import firebase from "firebase";

import { useTranslation } from "react-i18next";
import { detectPitch } from "../../../../assets/musicutils";

function FileUploader(props) {
  const { t } = useTranslation();
  const [uploadState, setUploadState] = useState([]);

  const onClose = () => {
    //props.setUploadingFiles([]);
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
              alert(
                `Error on file: "${file.name}" - Try importing a smaller audio file`
              );
              //break;
            }

            //add buffer directly to instrument
            let nameOnInstrument =
              props.instrument.name === "Sampler"
                ? Tone.Frequency(detectPitch(audiobuffer)[0]).toNote()
                : file.name.split(".")[0];

            console.log(nameOnInstrument);

            props.instrument.name === "Players"
              ? props.instrument.add(
                  nameOnInstrument,
                  audiobuffer,
                  () => isLastFile && props.setInstrumentLoaded(true)
                )
              : props.intrument.add(
                  nameOnInstrument,
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
                dur: audiobuffer.duration,
                loaded: 1,
                user: user.uid,
                categ: [0, 0, 0],
                ch: audiobuffer.numberOfChannels,
                type: file.type,
              };

              console.log(fileInfo);

              //add file info in database
              const filesRef = firebase.firestore().collection("files");
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
                        (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                      return newState;
                    });
                  },
                  (error) => {
                    console.log(error);
                    filesRef.doc(ref.id).remove();
                    //break;
                  },
                  () => {
                    /////IF UPLOAD SUCCEDS

                    //update instrument on "modules"

                    Boolean(props.onInstrumentMod) &&
                      props.onInstrumentMod(ref.id, nameOnInstrument);

                    //add file id to user in db

                    const userRef = firebase
                      .firestore()
                      .collection("users")
                      .doc(user.uid);

                    userRef.update({
                      files: firebase.firestore.FieldValue.arrayUnion(ref.id),
                    });
                  }
                );
              });
            }
          },
          (e) => {
            alert(
              `Error on file "${file.name}" - There was an error decoding your audio file, try to convert it to other format`
            );
            //break;
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
      setUploadState();
    }
  }, [props.files]);

  return (
    <Dialog open={props.open} onClose={onClose}>
      <DialogTitle>{t("dialogs.areYouSure")}</DialogTitle>
      <DialogContent>
        <List>
          {Array(props.files.length)
            .fill(0)
            .map((e, i) => (
              <ListItem divider>
                <ListItemText primary={props.files[i].name} />
                {}
              </ListItem>
            ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>{t("dialogs.cancel")}</Button>
        {/* <Button color="secondary" onClick={handleConfirm}>
          {t("dialogs.delete")}
        </Button> */}
      </DialogActions>
    </Dialog>
  );
}

export default FileUploader;

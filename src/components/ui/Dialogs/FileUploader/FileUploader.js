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
  Menu,
  MenuItem,
  LinearProgress,
  Typography,
} from "@material-ui/core";

import * as Tone from "tone";
import firebase from "firebase";

import { useTranslation } from "react-i18next";
import {
  fileTags,
  detectPitch,
  fileTypes,
  fileExtentions,
  encodeAudioFile,
} from "../../../../assets/musicutils";

import "./FileUploader.css";

function FileUploader(props) {
  const { t } = useTranslation();
  const [uploadState, setUploadState] = useState([]);
  const [uploadingFileIds, setUploadingFileIds] = useState([]);
  const [duplicatedFilesInfo, setDuplicatedFilesInfo] = useState([]);
  const [uploadingFileTags, setUploadingFileTags] = useState([]);

  const [userInfo, setUserInfo] = useState(null);
  const [userStorageUsage, setUserStorageUsage] = useState(0);
  const [userStorageMax, setUserStorageMax] = useState(0);

  const [uploadingFilesBuffer, setUploadingFilesBuffer] = useState([]);

  const [labelsOnInstrument, setLabelsOnInstrument] = useState([]);

  const [tagSelectionTarget, setTagSelectionTarget] = useState(null);

  const fileTagDrumComponents = fileTags.filter((_, i) => i > 4 && i < 15);
  const fileTagDrumGenres = fileTags.filter((_, i) => i > 14 && i < 19);

  const user = firebase.auth().currentUser;

  const userRef = firebase.firestore().collection("users").doc(user.uid);

  const onClose = () => {
    props.setUploadingFiles([]);
    setUploadingFileTags([]);
    setUploadingFileIds([]);
    setDuplicatedFilesInfo([]);
    setUploadState([]);
    setLabelsOnInstrument([]);
    setUploadingFilesBuffer([]);
  };

  const getInitialUserInfo = () => {
    user &&
      userRef.get().then((r) => {
        let checkPr = r.data().pr.seconds > ~~(+new Date() / 1000);
        setUserStorageMax(checkPr ? 10737418240 : 536870912);
        setUserStorageUsage(r.data().sp);
      });
  };

  const uploadFiles = () => {
    props.setInstrumentLoaded(false);

    for (let i = 0; i < props.files.length; i++) {
      let file = props.files[i];
      let isLastFile = i === props.files.length - 1;
      //file to arraybuffer
      console.log(file);
      file.arrayBuffer().then((arraybuffer) => {
        //console.log(arraybuffer);

        //arraybuffer to audiobuffer
        props.instrument.context.rawContext.decodeAudioData(
          arraybuffer,
          (audiobuffer) => {
            setUploadingFilesBuffer((prev) => {
              let newBuffers = [...prev];
              newBuffers[i] = audiobuffer;
              return newBuffers;
            });

            console.log(audiobuffer);

            //skip if audio is too large for sampler/sequencer
            if (
              audiobuffer.duration > 20 &&
              (props.instrument.name === "Sampler" || props.module.type === 0)
            ) {
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

            //find slot

            let slotToInsetFile = 0;

            while (
              props.module.type === 0 &&
              props.instrument._buffers._buffers.has(
                JSON.stringify(slotToInsetFile)
              )
            ) {
              slotToInsetFile++;
            }

            console.log(slotToInsetFile);

            setLabelsOnInstrument((prev) => {
              let newLbls = [...prev];
              newLbls[slotToInsetFile] = labelOnInstrument;
              return newLbls;
            });

            //add buffer directly to instrument

            if (props.module.type === 3) {
              props.loadPlayer(audiobuffer);
            } else if (props.module.type === 0) {
              props.instrument.add(
                slotToInsetFile,
                audiobuffer,
                () => isLastFile && props.setInstrumentLoaded(true)
              );
              props.setLabels(slotToInsetFile, labelOnInstrument);
            } else {
              props.instrument.add(
                labelOnInstrument,
                audiobuffer,
                () => isLastFile && props.setInstrumentLoaded(true)
              );
            }

            /////
            //UPLOAD FILE
            /////

            if (user) {
              let fileInfo = {
                name: file.name.split(".")[0],
                size: file.size,
                dur: parseFloat(audiobuffer.duration.toFixed(3)),
                ld: 1,
                in: 0,
                likes: 0,
                dl: 0,
                user: user.uid,
                categ: [],
                type: fileTypes.indexOf(file.type),
                upOn: firebase.firestore.FieldValue.serverTimestamp(),
              };

              if (props.module.type === 0) fileInfo.categ.push(0);
              //if (props.module.type === 3) fileInfo.categ.push(1);
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
                .where("name", "==", fileInfo.name)
                .where("user", "==", user.uid)
                .where("size", "==", file.size)
                .get()
                .then((result) => {
                  //no matches to uploaded file, then upload it
                  if (result.empty) {
                    filesRef.add(fileInfo).then((ref) => {
                      //upload file to storage
                      const storageRef = firebase.storage().ref(ref.id);

                      userRef.get().then((r) => {
                        let checkPr =
                          r.data().pr.seconds > ~~(+new Date() / 1000);

                        setUserStorageMax(checkPr ? 10737418240 : 536870912);
                        setUserStorageUsage(r.data().sp);

                        let finalFile =
                          file.type !== "audio/mpeg" && !checkPr
                            ? encodeAudioFile(audiobuffer, "mp3")
                            : file;

                        if (
                          r.data().sp + finalFile.size >
                          (checkPr ? 10737418240 : 536870912)
                        ) {
                          setUploadState((prev) => {
                            let newState = [...prev];
                            newState[i] = "noSpace";
                            return newState;
                          });

                          return;
                        }

                        const task = storageRef.put(finalFile);

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
                              props.onInstrumentMod(
                                ref.id,
                                labelOnInstrument,
                                slotToInsetFile
                              );

                            props.updateOnFileLoaded &&
                              props.updateOnFileLoaded();

                            props.module.type !== 3 && props.getFilesName();

                            //add file id to user in db

                            const userRef = firebase
                              .firestore()
                              .collection("users")
                              .doc(user.uid);

                            userRef.update({
                              files: firebase.firestore.FieldValue.arrayUnion(
                                ref.id
                              ),
                              sp: firebase.firestore.FieldValue.increment(
                                finalFile.size
                              ),
                            });

                            setUserStorageUsage(r.data().sp + finalFile.size);
                          }
                        );
                      });
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
                      ld: firebase.firestore.FieldValue.increment(1),
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

                    props.module.type !== 3 && props.getFilesName();

                    setUploadState((prev) => {
                      let newState = [...prev];
                      newState[i] = "duplicatedFound";
                      return newState;
                    });
                  }
                });

              //add file info in database
            } else {
              setUploadState((prev) => {
                let newState = [...prev];
                newState[i] = "importedLocally";
                return newState;
              });
              return;
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

  const handleTagSelect = (tagName) => {
    let tag = fileTags.indexOf(tagName);
    let fileIndex = tagSelectionTarget[1];
    let tagIndex = tagSelectionTarget[2];

    let hasTag = uploadingFileTags[fileIndex][tagIndex] === tag;

    //console.log(tag, fileIndex, tagIndex, hasTag);

    if (!hasTag) {
      let finalCateg;
      setUploadingFileTags((prev) => {
        let newUpTags = [...prev];
        newUpTags[fileIndex][tagIndex] = tag;
        finalCateg = newUpTags[fileIndex];
        return newUpTags;
      });
      firebase
        .firestore()
        .collection("files")
        .doc(uploadingFileIds[fileIndex])
        .update({ categ: finalCateg });
    }

    setTagSelectionTarget(null);
  };

  useEffect(() => {
    //console.log(props.files);
    if (props.files.length > 0) {
      uploadFiles();
      setUploadState([]);
    }
  }, [props.files]);

  useEffect(() => {
    getInitialUserInfo();
  }, []);

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
                  secondary={
                    duplicatedFilesInfo[i]
                      ? `(${duplicatedFilesInfo[i].name}.${
                          fileExtentions[duplicatedFilesInfo[i].type]
                        })`
                      : props.files[i].name
                  }
                  secondaryTypographyProps={{
                    onClick: () =>
                      uploadingFileIds[i] &&
                      props.handlePageNav("file", uploadingFileIds[i], true),
                    variant: "overline",
                    className: uploadingFileIds[i] && "clickable-filename",
                  }}
                />
                {duplicatedFilesInfo[i]
                  ? duplicatedFilesInfo[i].categ.map((e) => (
                      <Chip className={"file-tag-chip"} label={fileTags[e]} />
                    ))
                  : uploadingFileTags[i] &&
                    [
                      uploadingFileTags[i][0],
                      uploadingFileTags[i][1] ? uploadingFileTags[i][1] : "/",
                      uploadingFileTags[i][2] ? uploadingFileTags[i][2] : "/",
                    ].map((e, chipIndex) => (
                      <Chip
                        clickable={chipIndex !== 0}
                        variant={chipIndex === 0 ? "outline" : "default"}
                        onClick={(e) =>
                          chipIndex !== 0 &&
                          setTagSelectionTarget([e.target, i, chipIndex])
                        }
                        className={"file-tag-chip"}
                        label={e === "/" ? "..." : fileTags[e]}
                      />
                    ))}

                <ListItemSecondaryAction>
                  <Tooltip title={uploadState[i]}>
                    {uploadState[i] === undefined ||
                    (typeof uploadState[i] === "number" &&
                      uploadState[i] !== 100) ? (
                      <CircularProgress
                        variant={
                          !uploadState[i] ? "indeterminate" : "determinate"
                        }
                        value={uploadState}
                      />
                    ) : (
                      <Icon
                        color={
                          typeof uploadState[i] !== "number" &&
                          uploadState[i] !== "duplicatedFound" &&
                          uploadState[i] !== "importedLocally"
                            ? "secondary"
                            : "primary"
                        }
                      >
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
                          : uploadState[i] === "importedLocally"
                          ? "offline_pin"
                          : uploadState[i] === "noSpace"
                          ? "inventory_2"
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

      <div style={{ position: "absolute", bottom: 8, width: "60%", left: 16 }}>
        <LinearProgress
          variant="determinate"
          value={userStorageUsage / userStorageMax}
        />
        <Typography variant="overline">{`Space Used: ${formatBytes(
          userStorageUsage
        )} / ${formatBytes(userStorageMax)}`}</Typography>
      </div>

      <Menu
        anchorEl={tagSelectionTarget && tagSelectionTarget[0]}
        keepMounted
        open={Boolean(tagSelectionTarget)}
        onClose={() => setTagSelectionTarget(null)}
      >
        {tagSelectionTarget &&
          (props.module.type === 0 ? (
            tagSelectionTarget[2] === 1 ? (
              fileTagDrumComponents.map((e, i) => (
                <MenuItem onClick={() => handleTagSelect(e)}>{e}</MenuItem>
              ))
            ) : (
              fileTagDrumGenres.map((e, i) => (
                <MenuItem onClick={() => handleTagSelect(e)}>{e}</MenuItem>
              ))
            )
          ) : (
            <MenuItem>a</MenuItem>
          ))}
      </Menu>
    </Dialog>
  );
}

export default FileUploader;

function formatBytes(a, b = 2) {
  if (0 === a) return "0 Bytes";
  const c = 0 > b ? 0 : b,
    d = Math.floor(Math.log(a) / Math.log(1024));
  return (
    parseFloat((a / Math.pow(1024, d)).toFixed(c)) +
    " " +
    ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][d]
  );
}

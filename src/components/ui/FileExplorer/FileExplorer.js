import React, { useState, useEffect, Fragment } from "react";
import * as Tone from "tone";

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Icon,
  IconButton,
  Divider,
  List,
  ListItem,
  Typography,
  Chip,
  Menu,
  MenuItem,
} from "@material-ui/core";

import "./FileExplorer.css";

import firebase from "firebase";

import DeleteConfirm from "../Dialogs/DeleteConfirm";

import { fileExtentions, fileTags } from "../../../assets/musicutils";

const fileTagDrumComponents = fileTags.filter((_, i) => i > 4 && i < 15);
const fileTagDrumGenres = fileTags.filter((_, i) => i > 14 && i < 19);

function FileExplorer(props) {
  const [filedata, setFiledata] = useState([]);
  const [fileIdList, setFileIdList] = useState([]);
  const [filesUrl, setFilesUrl] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loadingPlay, setLoadingPlay] = useState(null);
  const [currentPlaying, setCurrentPlaying] = useState(null);

  const [deletingFile, setDeletingFile] = useState(null);

  const [tagSelectionTarget, setTagSelectionTarget] = useState(null);

  const user = firebase.auth().currentUser;

  //const [userOption, setUserOption] = useState(false);
  //const [sideMenu, setSideMenu] = useState(false);

  const handleFileSelect = (e, index) => {
    if (props.compact && !e.target.classList.contains("MuiIcon-root")) {
      let url = filesUrl[index];

      props.onFileClick(
        url,
        players[index] !== undefined && players[index].buffer
      );
    }
  };

  const getUserFilesList = async () => {
    /* const user = firebase.auth().currentUser;
    const dbRef = firebase.storage().ref().child(user.uid);
    const fileIdList = (await dbRef.list()).items;
    setFileIdList(fileIdList);

    const filesMetadata = await Promise.all(
      fileIdList.map((e, i) => e.getMetadata())
    );
    setFiledata(filesMetadata); */

    const user = firebase.auth().currentUser;
    const dbUserRef = firebase.firestore().collection("users").doc(user.uid);
    const dbFilesRef = firebase.firestore().collection("files");
    const storageRef = firebase.storage();

    const fileIdList = (await dbUserRef.get()).get("files");

    //console.log(fileIdList);
    setFileIdList(fileIdList);

    const filesData = await Promise.all(
      fileIdList.map(async (e, i) => {
        return (await dbFilesRef.doc(e).get()).data();
      })
    );
    //console.log(filesMetadata);

    setFiledata(filesData);

    const filesUrl = await Promise.all(
      fileIdList.map(async (e, i) => {
        return await storageRef.ref(e).getDownloadURL();
      })
    );

    //console.log(filesUrl);
    setFilesUrl(filesUrl);
  };

  const handleDownload = (index) => {
    let url = filesUrl[index];
    console.log(url);
    var xhr = new XMLHttpRequest();
    xhr.responseType = "blob";
    xhr.onload = function (event) {
      var blob = xhr.response;
      var a = document.createElement("a");
      a.href = window.URL.createObjectURL(blob);
      a.download = filedata[index].name;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
    };
    xhr.open("GET", url);
    xhr.send();
  };

  const playSound = (index) => {
    if (players[index] !== undefined) {
      players[index].start();
      setCurrentPlaying(index);
    } else {
      setLoadingPlay(index);
      let url = filesUrl[index];

      let player = new Tone.Player(url, () => {
        player.state !== "started" && player.start();
        setCurrentPlaying(index);
        setLoadingPlay(null);
      }).toDestination();
      player.onstop = () => {
        setCurrentPlaying(null);
      };
      setPlayers((prev) => {
        let newPlayers = [...prev];

        newPlayers[index] = player;
        return newPlayers;
      });
    }
  };

  const stopSound = (index) => {
    players[index].stop();
    setCurrentPlaying(null);
  };

  const openFilePage = (id) => {
    //console.log(id);
    const win = window.open("/file/" + id, "_blank");
    win.focus();
  };

  const handleTagSelect = (tagName) => {
    let tag = fileTags.indexOf(tagName);
    let fileIndex = tagSelectionTarget[1];
    let tagIndex = tagSelectionTarget[2];

    let hasTag = filedata[fileIndex].categ[tagIndex] === tag;

    //console.log(tag, fileIndex, tagIndex, hasTag);

    if (!hasTag) {
      let finalCateg;
      setFiledata((prev) => {
        let newUpTags = [...prev];
        newUpTags[fileIndex].categ[tagIndex] = tag;
        finalCateg = newUpTags[fileIndex].categ;
        return newUpTags;
      });
      firebase
        .firestore()
        .collection("files")
        .doc(fileIdList[fileIndex])
        .update({ categ: finalCateg });
    }

    setTagSelectionTarget(null);
  };

  const deleteFile = (index) => {
    let fileId = fileIdList[index];

    firebase.storage().ref(fileId).delete();

    firebase.firestore().collection("files").doc(fileId).delete();

    firebase
      .firestore()
      .collection("users")
      .doc(filedata[index].user)
      .update({
        files: firebase.firestore.FieldValue.arrayRemove(fileId),
      });

    setFiledata((prev) => prev.filter((e, i) => i !== index));
    setFileIdList((prev) => prev.filter((e, i) => i !== index));
    setFilesUrl((prev) => prev.filter((e, i) => i !== index));
  };

  useEffect(() => {
    user && getUserFilesList();
  }, [user]);

  useEffect(() => {
    return () => {
      players.forEach((player) => !!player && player.dispose());
    };
  }, []);

  useEffect(() => {
    //console.log(players);
  }, [players]);

  return (
    <div className="file-explorer">
      {props.compact && (
        <Fragment>
          <div className="file-explorer-column">
            <List className="fet-list">
              <ListItem divider button>
                User Files
              </ListItem>
            </List>
          </div>
          <Divider orientation="vertical" />
        </Fragment>
      )}
      <div className="file-explorer-column">
        {!!filedata.length ? (
          <TableContainer className="file-explorer-table">
            <Table
              component={!props.compact ? Paper : "div"}
              size="small"
              className={props.compact ? "fet-compact" : "fet-normal"}
            >
              {!props.compact && (
                <TableHead>
                  <TableRow>
                    <TableCell style={{ width: 50 }}></TableCell>
                    <TableCell>Name</TableCell>
                    <Fragment>
                      <TableCell>Categories</TableCell>

                      <TableCell align="right">Size</TableCell>
                      <TableCell style={{ width: 50 }} align="right">
                        Download
                      </TableCell>
                      <TableCell style={{ width: 50 }} align="right">
                        Delete
                      </TableCell>
                    </Fragment>
                  </TableRow>
                </TableHead>
              )}
              <TableBody>
                {filedata.map((row, index) => (
                  <TableRow
                    key={row.name}
                    onClick={(e) => handleFileSelect(e, index)}
                  >
                    <TableCell style={{ width: props.compact ? 20 : 50 }}>
                      {loadingPlay === index ? (
                        <CircularProgress size={27} />
                      ) : currentPlaying === index ? (
                        <IconButton onClick={() => stopSound(index)}>
                          <Icon>stop</Icon>
                        </IconButton>
                      ) : (
                        <IconButton onClick={() => playSound(index)}>
                          <Icon>play_arrow</Icon>
                        </IconButton>
                      )}
                    </TableCell>
                    <TableCell component="th" scope="row">
                      <Typography
                        variant="overline"
                        className="fe-filename"
                        onClick={() => openFilePage(fileIdList[index])}
                      >
                        {`${row.name}.${fileExtentions[row.type]}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {filedata &&
                        [
                          filedata[index].categ[0],
                          filedata[index].categ[1]
                            ? filedata[index].categ[1]
                            : "/",
                          filedata[index].categ[2]
                            ? filedata[index].categ[2]
                            : "/",
                        ].map((chip, chipIndex) => (
                          <Chip
                            clickable={chipIndex !== 0}
                            onClick={(e) =>
                              chipIndex !== 0 &&
                              setTagSelectionTarget([
                                e.target,
                                index,
                                chipIndex,
                              ])
                            }
                            className={"file-tag-chip"}
                            label={chip === "/" ? "..." : fileTags[chip]}
                          />
                        ))}
                    </TableCell>
                    {!props.compact && (
                      <Fragment>
                        <TableCell align="right">
                          {formatBytes(row.size)}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton onClick={() => handleDownload(index)}>
                            <Icon>file_download</Icon>
                          </IconButton>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton onClick={() => setDeletingFile(index)}>
                            <Icon>delete</Icon>
                          </IconButton>
                        </TableCell>
                      </Fragment>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <CircularProgress />
        )}
        {!props.compact && (
          <Menu
            anchorEl={tagSelectionTarget && tagSelectionTarget[0]}
            keepMounted
            open={Boolean(tagSelectionTarget)}
            onClose={() => setTagSelectionTarget(null)}
          >
            {tagSelectionTarget && tagSelectionTarget[2] === 1
              ? fileTagDrumComponents.map((e, i) => (
                  <MenuItem onClick={() => handleTagSelect(e)}>{e}</MenuItem>
                ))
              : fileTagDrumGenres.map((e, i) => (
                  <MenuItem onClick={() => handleTagSelect(e)}>{e}</MenuItem>
                ))}
          </Menu>
        )}
      </div>
      <DeleteConfirm
        fileExplore
        open={deletingFile !== null}
        action={() => deleteFile(deletingFile)}
        onClose={() => setDeletingFile(null)}
      />
    </div>
  );
}

export default FileExplorer;

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

import React, { useState, useEffect, Fragment } from "react";
import * as Tone from "tone";

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  InputAdornment,
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
  Tooltip,
  Avatar,
  BottomNavigationAction,
  BottomNavigation,
  TextField,
  Fab,
  Dialog,
} from "@material-ui/core";

import { Skeleton, Autocomplete, useAutocomplete } from "@material-ui/lab";

import "./FileExplorer.css";

import firebase from "firebase";
import { useTranslation } from "react-i18next";

import ActionConfirm from "../Dialogs/ActionConfirm";
import NameInput from "../Dialogs/NameInput";
import NotFoundPage from "../NotFoundPage";

import { fileExtentions, fileTags } from "../../../assets/musicutils";

const fileTagDrumComponents = fileTags.filter((_, i) => i > 4 && i < 15);
const fileTagDrumGenres = fileTags.filter((_, i) => i > 14 && i < 19);

function FileExplorer(props) {
  const { t } = useTranslation();

  const [filedata, setFiledata] = useState([]);
  const [fileIdList, setFileIdList] = useState([]);
  const [filesUrl, setFilesUrl] = useState([]);
  const [filesUserData, setFilesUserData] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [userLikedFiles, setUserLikedFiles] = useState([]);

  const [players, setPlayers] = useState([]);
  const [loadingPlay, setLoadingPlay] = useState(null);
  const [currentPlaying, setCurrentPlaying] = useState(null);

  const [deletingFile, setDeletingFile] = useState(null);
  const [renamingFile, setRenamingFile] = useState(null);

  const [isFirstQuery, setIsFirstQuery] = useState(true);
  const [isQueryEnd, setIsQueryEnd] = useState(false);

  const [lastItem, setLastItem] = useState(null);

  const [showingLiked, setShowingLiked] = useState(false);

  const [searchTags, setSearchTags] = useState([]);
  const [searchValue, setSearchValue] = useState("");

  const [tagSelectionTarget, setTagSelectionTarget] = useState(null);

  const itemsPerPage = 25;
  const user = props.user ? props.user : firebase.auth().currentUser;

  //const [userOption, setUserOption] = useState(false);
  //const [sideMenu, setSideMenu] = useState(false);

  const handleFileSelect = (e, index) => {
    if (props.compact && !e.target.classList.contains("MuiIcon-root")) {
      if (props.isDrum && filedata[index].dur > 5) {
        props.setSnackbarMessage &&
          props.setSnackbarMessage("Try picking a file shorter than 5 seconds");
        return;
      }

      props.setInstrumentLoaded(false);

      if (props.compact && props.instrument.name === "Sampler") {
        let url = filesUrl[index];
        //console.log(url);
        var xhr = new XMLHttpRequest();
        xhr.responseType = "blob";
        xhr.onload = function (event) {
          var blob = xhr.response;
          //console.log(blob);
          blob.arrayBuffer().then((arraybuffer) => {
            //console.log(arraybuffer);
            props.instrument.context.rawContext.decodeAudioData(
              arraybuffer,
              (audiobuffer) => {
                //console.log(audiobuffer);
                props.onFileClick(
                  fileIdList[index],
                  filesUrl[index],
                  audiobuffer,
                  filedata[index].name
                );
                props.setInstrumentLoaded(true);

                props.setFileExplorer && props.setFileExplorer(false);
              }
            );
          });
        };
        xhr.open("GET", url);
        xhr.send();
      } else {
        props.onFileClick(
          fileIdList[index],
          filesUrl[index],
          players[index] !== undefined && players[index].buffer,
          filedata[index].name
        );
        props.setFileExplorer && props.setFileExplorer(false);
      }
    }
  };

  const getFilesList = async (clear) => {
    const usersRef = firebase.firestore().collection("users");
    const storageRef = firebase.storage();

    setIsLoading(true);

    let queryRules = () => {
      let rules = firebase.firestore().collection("files");

      if (searchValue) {
        console.log("text");
        rules = rules
          .where("name", ">=", searchValue)
          .where("name", "<=", searchValue + "\uf8ff");
      }
      if (searchTags && searchTags.length > 0) {
        console.log("tags");
        let tagsIds = searchTags
          .map((e) => fileTags.indexOf(e))
          .filter((e) => e !== -1);
        rules = rules.where("categ", "array-contains-any", tagsIds);
      }
      if (!clear && !isFirstQuery && lastItem) {
        console.log("next page");
        rules = rules.startAfter(lastItem);
      }

      return rules;
    };

    let fileQuery = await queryRules().limit(itemsPerPage).get();

    setLastItem(fileQuery.docs[fileQuery.docs.length - 1]);

    if (fileQuery.docs.length < itemsPerPage) {
      setIsQueryEnd(true);
    }

    let filesData = fileQuery.docs.map((e) => e.data());
    let fileIdList = fileQuery.docs.map((e) => e.id);

    setFiledata((prev) => [...prev, ...filesData]);
    setFileIdList((prev) => [...prev, ...fileIdList]);

    setIsLoading(filesData === false);

    //get files url

    const filesUrl = await Promise.all(
      fileIdList.map(async (e, i) => {
        return await storageRef.ref(e).getDownloadURL();
      })
    );

    setFilesUrl((prev) => [...prev, ...filesUrl]);

    //fetch user info

    let usersToFetch = [
      ...new Set(
        filesData
          .map((e) => e.user)
          .filter((e) => e)
          .filter((e) => !filesUserData.hasOwnProperty(e))
      ),
    ];

    if (usersToFetch.length > 0) {
      let usersData = await Promise.all(
        usersToFetch.map(async (e, i) => [
          e,
          (await usersRef.doc(e).get()).get("profile"),
        ])
      );

      setFilesUserData((prev) => {
        return { ...prev, ...Object.fromEntries(usersData) };
      });
    }

    setIsFirstQuery(filesData === false);
  };

  const getUserFilesList = async (liked) => {
    const dbUserRef = firebase.firestore().collection("users").doc(user.uid);
    const dbFilesRef = firebase.firestore().collection("files");
    const storageRef = firebase.storage();

    const fileIdList = (await dbUserRef.get()).get(
      liked ? "likedFiles" : "files"
    );

    setIsLoading(false);

    if (fileIdList.length === 0) {
      setFiledata(null);
      return;
    }

    //console.log(fileIdList);

    setFileIdList(fileIdList);

    const filesData = await Promise.all(
      fileIdList.map(async (e, i) => {
        return (await dbFilesRef.doc(e).get()).data();
      })
    );

    setFiledata(filesData);

    const filesUrl = await Promise.all(
      fileIdList.map(async (e, i) => {
        return await storageRef.ref(e).getDownloadURL();
      })
    );

    setFilesUrl(filesUrl);
  };

  const getUserLikes = () => {
    firebase
      .firestore()
      .collection("users")
      .doc(user.uid)
      .get()
      .then((r) => setUserLikedFiles(r.get("likedFiles")));
  };

  const handleDownload = (index) => {
    let url = filesUrl[index];
    //console.log(url);
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

  const handleLike = (index) => {
    if (user === null) return;
    let likedFileId = fileIdList[index];

    const dbUserRef = firebase.firestore().collection("users").doc(user.uid);
    const dbFileRef = firebase.firestore().collection("files").doc(likedFileId);

    if (!userLikedFiles.includes(likedFileId)) {
      dbUserRef.update({
        likedFiles: firebase.firestore.FieldValue.arrayUnion(likedFileId),
      });

      dbFileRef.update({ likes: firebase.firestore.FieldValue.increment(1) });
      setUserLikedFiles((prev) => [...prev, likedFileId]);
      setFiledata((prev) => {
        let newPatchdata = [...prev];
        newPatchdata[index].likes = newPatchdata[index].likes + 1;
        return newPatchdata;
      });
    } else {
      dbUserRef.update({
        likedFiles: firebase.firestore.FieldValue.arrayRemove(likedFileId),
      });

      dbFileRef.update({ likes: firebase.firestore.FieldValue.increment(-1) });
      setUserLikedFiles((prev) => prev.filter((e) => e !== likedFileId));
      setFiledata((prev) => {
        let newPatchdata = [...prev];
        newPatchdata[index].likes = newPatchdata[index].likes - 1;
        return newPatchdata;
      });
    }
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

  const renameFile = (newValue) => {
    let index = renamingFile;
    //console.log(fileIdList[index]);
    firebase
      .firestore()
      .collection("files")
      .doc(fileIdList[index])
      .update({ name: newValue });
    setFiledata((prev) => {
      let newFiledata = [...prev];
      newFiledata[index].name = newValue;
      return newFiledata;
    });
  };

  const clearFiles = () => {
    setLastItem(null);
    setIsFirstQuery(true);
    setFiledata([]);
    setFileIdList([]);
    setFilesUrl([]);
  };

  const detectScrollToBottom = (e) => {
    if (e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight)
      !isQueryEnd && !isLoading && getFilesList();
  };

  useEffect(() => {
    //clearFiles();
    (props.explore || props.compact) && getFilesList();
    return () => {
      players.forEach((player) => !!player && player.dispose());
    };
  }, []);

  useEffect(() => {
    if (filedata === null || filedata.length > 0) setIsLoading(false);
    //console.log(filedata);
  }, [filedata]);

  useEffect(() => {
    if (props.userFiles && props.user) {
      clearFiles();
      setIsLoading(false);
      getUserFilesList(showingLiked);
    }
  }, [props.userFiles, props.user, showingLiked]);

  useEffect(() => {
    user && getUserLikes();
  }, [user]);

  useEffect(() => {
    clearFiles();
    !isLoading && getFilesList("clear");

    //console.log("change triggered");
  }, [searchTags, searchValue]);

  useEffect(() => {
    //console.log("isLoading", isLoading);
  }, [isLoading]);

  const mainContent = (
    <Fragment>
      {props.compact || props.explore ? (
        <Fragment>
          <Autocomplete
            multiple
            freeSolo
            className={`file-explorer-searchbar ${
              props.compact && "file-explorer-searchbar-compact"
            }`}
            options={fileTags}
            onChange={(e, v) => {
              setSearchTags(v);
              setSearchValue("");
            }}
            value={searchTags}
            /*             getOptionLabel={(option) => option.title}
             */ renderInput={(params) => (
              <TextField
                {...params}
                style={{ fontSize: 24 }}
                variant="outlined"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <Fragment>
                      <InputAdornment position="start">
                        <Icon>search</Icon>
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </Fragment>
                  ),
                }}
                onChange={(e) => setSearchValue(e.target.value)}
                value={searchValue}
              />
            )}
          />
          <div className="break" />
        </Fragment>
      ) : (
        <div className="break" style={{ height: 32 }} />
      )}

      {filedata !== null ? (
        <TableContainer
          className={props.compact ? "fet-cont-compact" : "fet-cont"}
          onScroll={props.compact && detectScrollToBottom}
          style={{ marginTop: props.userFiles && 32 }}
        >
          <Table
            component={props.compact ? "div" : Paper}
            size="small"
            className={`file-explorer-table ${
              props.compact ? "fet-compact" : "fet-normal"
            }`}
          >
            {/* !props.compact && (
        <TableHead>
          <TableRow>
            <TableCell style={{ width: 50 }}></TableCell>
            <TableCell>Name</TableCell>
            <Fragment>
              <TableCell>Categories</TableCell>
              {(props.explore || !!showingLiked) && (
                <TableCell style={{ width: 50 }} align="center">
                  Like
                </TableCell>
              )}

              <TableCell
                className="fet-collapsable-column"
                align="center"
              >
                Size
              </TableCell>
              <TableCell style={{ width: 50 }} align="center">
                Download
              </TableCell>
              {props.userFiles && (
                <TableCell style={{ width: 50 }} align="center">
                  Delete
                </TableCell>
              )}
            </Fragment>
          </TableRow>
        </TableHead>
      ) */}
            <TableBody>
              {filedata.map((row, index) => (
                <TableRow
                  key={row.name + index}
                  onClick={(e) => handleFileSelect(e, index)}
                >
                  <TableCell style={{ width: 50 }}>
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
                    <div
                      style={{
                        maxWidth: 200,
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        variant="overline"
                        className="fe-filename"
                        onClick={() =>
                          props.handlePageNav("file", fileIdList[index], true)
                        }
                      >
                        {row.name}
                      </Typography>
                      <Tooltip title={fileExtentions[row.type]}>
                        <Typography
                          variant="overline"
                          style={{
                            border: "solid 1px #3f51b5",
                            color: "#3f51b5",
                            borderRadius: "8px",
                            marginLeft: 8,
                            padding: "4px",
                            height: "0.6rem",
                            fontSize: "0.6rem",
                            lineHeight: 1,
                            userSelect: "none",
                          }}
                        >
                          {fileExtentions[row.type]}
                        </Typography>
                      </Tooltip>
                      {props.userFiles && filedata[index].user === user.uid && (
                        <IconButton onClick={() => setRenamingFile(index)}>
                          <Icon>edit</Icon>
                        </IconButton>
                      )}
                      {filesUserData[filedata[index].user] && (
                        <Tooltip
                          title={filesUserData[filedata[index].user].username}
                        >
                          <Avatar
                            style={{
                              height: 24,
                              width: 24,
                              marginLeft: 8,
                            }}
                            alt={filesUserData[filedata[index].user].username}
                            src={filesUserData[filedata[index].user].photoURL}
                            onClick={() =>
                              props.handlePageNav(
                                "user",
                                filedata[index].user,
                                true
                              )
                            }
                          />
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="fet-collapsable-column-667">
                    <div className="fet-chip-cell">
                      {filedata && props.userFiles
                        ? [
                            filedata[index].categ[0],
                            filedata[index].categ[1]
                              ? filedata[index].categ[1]
                              : "/",
                            filedata[index].categ[2]
                              ? filedata[index].categ[2]
                              : "/",
                          ].map((chip, chipIndex) => (
                            <Chip
                              clickable={!!props.userFiles && chipIndex !== 0}
                              onClick={(e) =>
                                !!props.userFiles
                                  ? chipIndex !== 0 &&
                                    setTagSelectionTarget([
                                      e.target,
                                      index,
                                      chipIndex,
                                    ])
                                  : setSearchTags([fileTags[chip]])
                              }
                              className={"file-tag-chip"}
                              label={chip === "/" ? "..." : fileTags[chip]}
                            />
                          ))
                        : filedata[index].categ.map((chip, chipIndex) => (
                            <Chip
                              clickable={chipIndex !== 0}
                              onClick={(e) =>
                                !!props.userFiles
                                  ? chipIndex !== 0 &&
                                    setTagSelectionTarget([
                                      e.target,
                                      index,
                                      chipIndex,
                                    ])
                                  : setSearchTags([fileTags[chip]])
                              }
                              className={"file-tag-chip"}
                              label={chip === "/" ? "..." : fileTags[chip]}
                            />
                          ))}
                    </div>
                  </TableCell>

                  <Fragment>
                    {(props.explore || props.compact || !!showingLiked) && (
                      <TableCell style={{ width: 50 }} align="center">
                        <IconButton onClick={() => handleLike(index)}>
                          <Icon
                            color={
                              userLikedFiles.includes(fileIdList[index])
                                ? "secondary"
                                : "inherit"
                            }
                          >
                            favorite
                          </Icon>
                          <Typography
                            className="like-btn-label"
                            variant="overline"
                          >
                            {row.likes}
                          </Typography>
                        </IconButton>
                      </TableCell>
                    )}
                    <TableCell
                      className="fet-collapsable-column-800"
                      align="center"
                    >
                      <Typography variant="overline">
                        {formatBytes(row.size)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => handleDownload(index)}>
                        <Icon>file_download</Icon>
                      </IconButton>
                    </TableCell>
                    {props.userFiles && (
                      <TableCell align="center">
                        <IconButton onClick={() => setDeletingFile(index)}>
                          <Icon>delete</Icon>
                        </IconButton>
                      </TableCell>
                    )}
                  </Fragment>
                </TableRow>
              ))}
              {isLoading &&
                Array(10)
                  .fill(1)
                  .map((e) => (
                    <TableRow style={{ height: 61 }}>
                      <TableCell style={{ width: 50 }}>
                        <IconButton>
                          <Icon>play_arrow</Icon>
                        </IconButton>
                      </TableCell>
                      <TableCell component="th" scope="row">
                        <Typography variant="overline" className="fe-filename">
                          <Skeleton variant="text" />
                        </Typography>
                      </TableCell>
                      <TableCell className="fet-collapsable-column-667">
                        <div className="fet-chip-cell">
                          {["    ", "    ", "    "].map((chip, chipIndex) => (
                            <Chip
                              clickable={false}
                              className={"file-tag-chip"}
                              label={chip}
                            />
                          ))}
                        </div>
                      </TableCell>
                      <Fragment>
                        {props.explore && (
                          <TableCell style={{ width: 50 }} align="center">
                            <IconButton>
                              <Icon>favorite</Icon>
                            </IconButton>
                          </TableCell>
                        )}

                        <TableCell
                          className="fet-collapsable-column-800"
                          align="center"
                        >
                          <Typography variant="overline">
                            <Skeleton variant="text" />
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton>
                            <Icon>file_download</Icon>
                          </IconButton>
                        </TableCell>
                        {props.userFiles && (
                          <TableCell align="center">
                            <IconButton>
                              <Icon>delete</Icon>
                            </IconButton>
                          </TableCell>
                        )}
                      </Fragment>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <NotFoundPage type="fileExplorer" />
      )}

      <div className="break" />

      {props.compact && (
        <BottomNavigation
          className="file-explorer-compact-bottom-nav"
          value={showingLiked}
          onChange={(e, v) =>
            v === 0 ? getUserFilesList() : getUserFilesList(true)
          }
          showLabels
        >
          <BottomNavigationAction label="User" icon={<Icon>person</Icon>} />
          <BottomNavigationAction label="Liked" icon={<Icon>favorite</Icon>} />
        </BottomNavigation>
      )}

      {!props.compact && props.userFiles && (
        <Fab
          className="fe-fab"
          color={showingLiked ? "secondary" : "primary"}
          onClick={() => setShowingLiked((prev) => !prev)}
        >
          <Icon>{showingLiked ? "favorite" : "person"}</Icon>
        </Fab>
      )}

      {props.userFiles && (
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

      {props.userFiles && (
        <ActionConfirm
          delete
          fileExplore
          open={deletingFile !== null}
          action={() => deleteFile(deletingFile)}
          onClose={() => setDeletingFile(null)}
        />
      )}
      {props.userFiles && (
        <NameInput
          open={renamingFile !== null}
          onSubmit={(newValue) => renameFile(newValue)}
          onClose={() => setRenamingFile(null)}
        />
      )}
    </Fragment>
  );

  return props.compact ? (
    <Dialog
      open={true}
      onClose={() => props.setFileExplorer(false)}
      maxWidth="xl"
      fullWidth="true"
      PaperProps={{ style: { minHeight: "calc(100% - 64px)" } }}
    >
      {mainContent}
    </Dialog>
  ) : (
    <div
      className={`file-explorer ${props.compact && "file-explorer-compact"}`}
    >
      {mainContent}
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

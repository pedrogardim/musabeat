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
  Tooltip,
  Avatar,
  BottomNavigationAction,
  BottomNavigation,
  TextField,
} from "@material-ui/core";

import { Skeleton, Autocomplete, useAutocomplete } from "@material-ui/lab";

import "./PatchExplorer.css";

import firebase from "firebase";

import DeleteConfirm from "../Dialogs/DeleteConfirm";
import NameInput from "../Dialogs/NameInput";

import {
  fileExtentions,
  fileTags,
  instrumentsCategories,
  patchLoader,
  loadSynthFromGetObject,
  loadSamplerFromObject,
} from "../../../assets/musicutils";

function PatchExplorer(props) {
  const [patchdata, setPatchdata] = useState([]);
  const [patchIdList, setPatchIdList] = useState([]);
  const [patchesUserData, setPatchesUserData] = useState([]);

  const [loaded, isLoaded] = useState(false);

  const [userLikedPatches, setUserLikedPatches] = useState([]);

  const [instruments, setInstruments] = useState([]);

  const [loadingPlay, setLoadingPlay] = useState(null);
  const [currentPlaying, setCurrentPlaying] = useState(null);

  const [deletingPatch, setDeletingPatch] = useState(null);
  const [renamingPatch, setRenamingPatch] = useState(null);

  const [tagSelectionTarget, setTagSelectionTarget] = useState(null);

  const [lastVisible, setLastVisible] = useState(null);

  const [showingLiked, setShowingLiked] = useState(false);

  const [searchTags, setSearchTags] = useState([]);
  const [searchValue, setSearchValue] = useState("");

  const user = firebase.auth().currentUser;

  //const [userOption, setUserOption] = useState(false);
  //const [sideMenu, setSideMenu] = useState(false);

  const handlePatchSelect = (e, index) => {
    if (props.compact && !e.target.classList.contains("MuiIcon-root")) {
      props.onPatchClick();
    }
  };

  const getPatchesList = async (tags, name) => {
    const dbPatchesRef = firebase.firestore().collection("patches");
    const usersRef = firebase.firestore().collection("users");

    //isLoaded(false);

    let queryRules = () => {
      let rules = dbPatchesRef;

      if (name) {
        rules = rules
          .where("name", ">=", name)
          .where("name", "<=", name + "\uf8ff");
      }
      if (tags && tags.length > 0) {
        let tagsIds = tags
          .map((e) => instrumentsCategories.indexOf(e))
          .filter((e) => e !== -1);
        //console.log(tagsIds);
        rules = rules.where("categ", "in", tagsIds);
      }

      return rules;
    };

    let patchQuery = await queryRules().limit(10).get();

    //setLastVisible(fileQuery.docs[fileQuery.docs.length - 1]);

    if (patchQuery.empty) {
      setPatchdata(null);
      return;
    }

    let patchesData = patchQuery.docs.map((e) => e.data());
    let patchIdList = patchQuery.docs.map((e) => e.id);

    setPatchdata(patchesData);
    setPatchIdList(patchIdList);

    const usersData = await Promise.all(
      patchesData.map(async (e, i) => {
        return e.creator
          ? (await usersRef.doc(e.creator).get()).get("profile")
          : {};
      })
    );

    setPatchesUserData(usersData);
  };

  const getUserPatchesList = async (liked) => {
    const user = firebase.auth().currentUser;
    const dbUserRef = firebase.firestore().collection("users").doc(user.uid);
    const dbPatchesRef = firebase.firestore().collection("files");
    const storageRef = firebase.storage();

    const patchIdList = (await dbUserRef.get()).get(
      liked ? "likedPatches" : "files"
    );

    //isLoaded(false);

    if (patchIdList.length === 0) {
      setPatchdata(null);
      return;
    }

    //console.log(patchIdList);

    setPatchIdList(patchIdList);

    const filesData = await Promise.all(
      patchIdList.map(async (e, i) => {
        return (await dbPatchesRef.doc(e).get()).data();
      })
    );

    setPatchdata(filesData);

    const filesUrl = await Promise.all(
      patchIdList.map(async (e, i) => {
        return await storageRef.ref(e).getDownloadURL();
      })
    );
  };

  const getUserLikes = () => {
    firebase
      .firestore()
      .collection("users")
      .doc(user.uid)
      .get()
      .then((r) => setUserLikedPatches(r.get("likedPatches")));
  };

  const handleLike = (index) => {
    if (user === null) return;
    let likedPatchId = patchIdList[index];

    const dbUserRef = firebase.firestore().collection("users").doc(user.uid);
    const dbPatchRef = firebase
      .firestore()
      .collection("patches")
      .doc(likedPatchId);

    if (!userLikedPatches.includes(likedPatchId)) {
      dbUserRef.update({
        likedPatches: firebase.firestore.FieldValue.arrayUnion(likedPatchId),
      });

      dbPatchRef.update({ likes: firebase.firestore.FieldValue.increment(1) });
      setUserLikedPatches((prev) => [...prev, likedPatchId]);
    } else {
      dbUserRef.update({
        likedPatches: firebase.firestore.FieldValue.arrayRemove(likedPatchId),
      });

      dbPatchRef.update({ likes: firebase.firestore.FieldValue.increment(-1) });
      setUserLikedPatches((prev) => prev.filter((e) => e !== likedPatchId));
    }
  };

  const playSequence = (input, i) => {
    console.log("playSequence trieggered");
    let instr = typeof input === "number" ? instruments[input] : input;
    let index = i ? i : input;
    setCurrentPlaying(index);
    instr
      .triggerAttackRelease("C3", "8n", "+0:0:2")
      .triggerAttackRelease("E3", "8n", "+0:1:0")
      .triggerAttackRelease("G3", "8n", "+0:1:2")
      .triggerAttackRelease("B3", "8n", "+0:2")
      .triggerAttackRelease("C4", "8n", "+0:2:2")
      .triggerAttackRelease("E4", "8n", "+0:3:0")
      .triggerAttackRelease("G4", "8n", "+0:3:2")
      .triggerAttackRelease("B4", "8n", "+1:0:0");

    Tone.Draw.schedule(function () {
      setCurrentPlaying(null);
    }, "+1:0:2");
  };

  const playPatch = (index) => {
    if (instruments[index] !== undefined) {
      let instr = instruments[index];
      setCurrentPlaying(index);

      playSequence(instr, index);
    } else {
      setLoadingPlay(index);

      if (patchdata[index].base === "Sampler") {
        loadSamplerFromObject(
          patchdata[index],
          () => {},
          index,
          (sampler) => {
            playSequence(sampler, index);
            setLoadingPlay(null);
          }
        ).then((instr) => {
          setInstruments((prev) => {
            let newInstruments = [...prev];
            newInstruments[index] = instr;
            return newInstruments;
          });
        });
      } else {
        let instr = loadSynthFromGetObject(patchdata[index]);
        console.log(patchdata[index].base, instr);

        setInstruments((prev) => {
          let newInstruments = [...prev];
          newInstruments[index] = instr;
          return newInstruments;
        });
        playSequence(instr, index);
        setCurrentPlaying(index);
        setLoadingPlay(null);
      }
    }
  };

  const stopPatch = (index) => {
    instruments[index].releaseAll();
    setCurrentPlaying(null);
  };

  const openPatchPage = (id) => {
    //console.log(id);
    const win = window.open("/instrument/" + id, "_blank");
    win.focus();
  };

  const handleTagSelect = (tagName) => {
    let tag = fileTags.indexOf(tagName);
    let patchIndex = tagSelectionTarget[1];
    let tagIndex = tagSelectionTarget[2];

    let hasTag = patchdata[patchIndex].categ[tagIndex] === tag;

    //console.log(tag, patchIndex, tagIndex, hasTag);

    if (!hasTag) {
      setPatchdata((prev) => {
        let newUpTags = [...prev];
        newUpTags[patchIndex].categ = tag;
        return newUpTags;
      });
      firebase
        .firestore()
        .collection("files")
        .doc(patchIdList[patchIndex])
        .update({ categ: tag });
    }

    setTagSelectionTarget(null);
  };

  const deletePatch = (index) => {
    let fileId = patchIdList[index];

    firebase.storage().ref(fileId).delete();

    firebase.firestore().collection("files").doc(fileId).delete();

    firebase
      .firestore()
      .collection("users")
      .doc(patchdata[index].user)
      .update({
        files: firebase.firestore.FieldValue.arrayRemove(fileId),
      });

    setPatchdata((prev) => prev.filter((e, i) => i !== index));
    setPatchIdList((prev) => prev.filter((e, i) => i !== index));
  };

  const renamePatch = (newValue) => {
    let index = renamingPatch;
    //console.log(patchIdList[index]);
    firebase
      .firestore()
      .collection("files")
      .doc(patchIdList[index])
      .update({ name: newValue });
    setPatchdata((prev) => {
      let newPatchdata = [...prev];
      newPatchdata[index].name = newValue;
      return newPatchdata;
    });
  };

  const clearPatches = () => {
    setPatchdata([]);
    setPatchIdList([]);
    setPatchesUserData([]);
  };

  useEffect(() => {
    if (patchdata === null || patchdata.length > 0) isLoaded(true);
  }, [patchdata]);

  useEffect(() => {
    clearPatches();
    !!props.userPatches && user && getUserPatchesList();
  }, [props.userPatches, user]);

  useEffect(() => {
    clearPatches();
    props.explore && getPatchesList();
    user && getUserLikes();
  }, [props.explore, user]);

  useEffect(() => {
    return () => {
      instruments.forEach((instr) => !!instr && instr.dispose());
    };
  }, []);

  useEffect(() => {
    isLoaded(false);
  }, [showingLiked]);

  useEffect(() => {
    //console.log(loaded);
  }, [loaded]);

  useEffect(() => {
    getPatchesList(searchTags, searchValue);
    //console.log("change triggered");
  }, [searchTags, searchValue]);

  return (
    <div className="patch-explorer">
      {props.compact && (
        <Fragment>
          <div className="patch-explorer-column">
            <List className="pet-list">
              <ListItem divider button>
                User Patches
              </ListItem>
            </List>
          </div>
          <Divider orientation="vertical" />
        </Fragment>
      )}

      {!props.compact && props.explore && (
        <Fragment>
          <Autocomplete
            multiple
            freeSolo
            className="patch-explorer-searchbar"
            options={instrumentsCategories}
            onChange={(e, v) => {
              setSearchTags(v);
              setSearchValue("");
            }}
            value={searchTags}
            /*             getOptionLabel={(option) => option.title}
             */ renderInput={(params) => (
              <TextField
                {...params}
                variant="standard"
                label="Search"
                placeholder="Pick categories or search by file's or user's name"
                onChange={(e) => setSearchValue(e.target.value)}
                value={searchValue}
              />
            )}
          />
          <div className="break" />
        </Fragment>
      )}

      {patchdata !== null ? (
        <Table
          component={props.compact ? "div" : Paper}
          size="small"
          className={`patch-explorer-table ${
            props.compact ? "pet-compact" : "pet-normal"
          }`}
        >
          {!props.compact && (
            <TableHead>
              <TableRow>
                <TableCell style={{ width: 50 }}></TableCell>
                <TableCell>Name</TableCell>
                {props.explore && (
                  <TableCell
                    className="pet-collapsable-column"
                    style={{ width: 50 }}
                  >
                    User
                  </TableCell>
                )}
                <Fragment>
                  <TableCell>Category</TableCell>
                  {(props.explore || !!showingLiked) && (
                    <TableCell style={{ width: 50 }} align="center">
                      Like
                    </TableCell>
                  )}

                  {/* <TableCell className="pet-collapsable-column" align="center">
                    Size
                  </TableCell>
                  <TableCell style={{ width: 50 }} align="center">
                    Download
                  </TableCell> */}
                  {props.userPatches && (
                    <TableCell style={{ width: 50 }} align="center">
                      Delete
                    </TableCell>
                  )}
                </Fragment>
              </TableRow>
            </TableHead>
          )}
          <TableBody>
            {loaded
              ? patchdata.map((row, index) => (
                  <TableRow
                    key={row.name}
                    onClick={(e) => handlePatchSelect(e, index)}
                  >
                    <TableCell style={{ width: props.compact ? 20 : 50 }}>
                      {loadingPlay === index ? (
                        <CircularProgress size={27} />
                      ) : currentPlaying === index ? (
                        <IconButton onClick={() => stopPatch(index)}>
                          <Icon>stop</Icon>
                        </IconButton>
                      ) : (
                        <IconButton onClick={() => playPatch(index)}>
                          <Icon>play_arrow</Icon>
                        </IconButton>
                      )}
                    </TableCell>
                    <TableCell component="th" scope="row">
                      <Typography
                        variant="overline"
                        className="fe-filename"
                        onClick={() => openPatchPage(patchIdList[index])}
                      >
                        {row.name}
                      </Typography>
                      {patchdata[index].base === "Sampler" && (
                        <Tooltip arrow placement="top" title="Sampler">
                          <Icon style={{ fontSize: 16, marginLeft: 4 }}>
                            graphic_eq
                          </Icon>
                        </Tooltip>
                      )}
                      {props.userPatches && patchdata[index].user === user.uid && (
                        <IconButton onClick={() => setRenamingPatch(index)}>
                          <Icon>edit</Icon>
                        </IconButton>
                      )}
                    </TableCell>
                    {props.explore && (
                      <TableCell
                        className="pet-collapsable-column"
                        style={{ width: 50 }}
                      >
                        {patchesUserData[index] && (
                          <Tooltip title={patchesUserData[index].displayName}>
                            <Avatar
                              alt={patchesUserData[index].displayName}
                              src={patchesUserData[index].photoURL}
                            />
                          </Tooltip>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="pet-chip-cell">
                        <Chip
                          clickable={true}
                          onClick={(e) =>
                            !!props.userPatches &&
                            setTagSelectionTarget([e.target, index])
                          }
                          className={"file-tag-chip"}
                          label={instrumentsCategories[patchdata[index].categ]}
                        />
                      </div>
                    </TableCell>
                    {!props.compact && (
                      <Fragment>
                        {(props.explore || !!showingLiked) && (
                          <TableCell style={{ width: 50 }} align="center">
                            <IconButton onClick={() => handleLike(index)}>
                              <Icon
                                color={
                                  userLikedPatches.includes(patchIdList[index])
                                    ? "secondary"
                                    : "inherit"
                                }
                              >
                                favorite
                              </Icon>
                            </IconButton>
                          </TableCell>
                        )}
                        {/* <TableCell
                          className="pet-collapsable-column"
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
                        </TableCell> */}
                        {props.userPatches && (
                          <TableCell align="center">
                            <IconButton onClick={() => setDeletingPatch(index)}>
                              <Icon>delete</Icon>
                            </IconButton>
                          </TableCell>
                        )}
                      </Fragment>
                    )}
                  </TableRow>
                ))
              : Array(10)
                  .fill(1)
                  .map((e) => (
                    <TableRow style={{ height: 61 }}>
                      <TableCell style={{ width: props.compact ? 20 : 50 }}>
                        <IconButton>
                          <Icon>play_arrow</Icon>
                        </IconButton>
                      </TableCell>
                      <TableCell component="th" scope="row">
                        <Typography variant="overline" className="fe-filename">
                          <Skeleton variant="text" />
                        </Typography>
                      </TableCell>
                      {props.explore && (
                        <TableCell
                          className="pet-collapsable-column"
                          style={{ width: 50 }}
                        >
                          <Avatar />
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="pet-chip-cell">
                          <Chip
                            clickable={false}
                            className={"file-tag-chip"}
                            label={"    "}
                          />
                        </div>
                      </TableCell>
                      {!props.compact && (
                        <Fragment>
                          {props.explore && (
                            <TableCell style={{ width: 50 }} align="center">
                              <IconButton>
                                <Icon>favorite</Icon>
                              </IconButton>
                            </TableCell>
                          )}

                          {/* <TableCell
                            className="pet-collapsable-column"
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
                          </TableCell> */}
                          {props.userPatches && (
                            <TableCell align="center">
                              <IconButton>
                                <Icon>delete</Icon>
                              </IconButton>
                            </TableCell>
                          )}
                        </Fragment>
                      )}
                    </TableRow>
                  ))}
          </TableBody>
        </Table>
      ) : (
        "Nothing Found"
      )}

      <div className="break" />

      {props.userPatches && (
        <BottomNavigation
          className="pet-user-bottom-nav"
          value={showingLiked}
          onChange={(event, newValue) => {
            getUserPatchesList(newValue);
            setShowingLiked(newValue);
          }}
          showLabels
        >
          <BottomNavigationAction label="User" icon={<Icon>person</Icon>} />
          <BottomNavigationAction label="Liked" icon={<Icon>favorite</Icon>} />
        </BottomNavigation>
      )}
      {props.userPatches && (
        <Menu
          anchorEl={tagSelectionTarget && tagSelectionTarget[0]}
          keepMounted
          open={Boolean(tagSelectionTarget)}
          onClose={() => setTagSelectionTarget(null)}
        >
          {instrumentsCategories.map((e, i) => (
            <MenuItem onClick={() => handleTagSelect(e)}>{e}</MenuItem>
          ))}
        </Menu>
      )}

      {props.userPatches && (
        <DeleteConfirm
          fileExplore
          open={deletingPatch !== null}
          action={() => deletePatch(deletingPatch)}
          onClose={() => setDeletingPatch(null)}
        />
      )}
      {props.userPatches && (
        <NameInput
          open={renamingPatch !== null}
          onSubmit={(newValue) => renamePatch(newValue)}
          onClose={() => setRenamingPatch(null)}
        />
      )}
    </div>
  );
}

export default PatchExplorer;
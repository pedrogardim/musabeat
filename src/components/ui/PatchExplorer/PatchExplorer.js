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
import SavePatch from "../Dialogs/SavePatch";

import {
  fileExtentions,
  fileTags,
  instrumentsCategories,
  drumCategories,
  patchLoader,
  loadSynthFromGetObject,
  loadSamplerFromObject,
  loadDrumPatch,
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
  const [savePatchDialog, setSavePatchDialog] = useState(false);

  const [tagSelectionTarget, setTagSelectionTarget] = useState(null);

  const [selectedPatch, setSelectedPatch] = useState(
    props.module && typeof props.module.instrument === "string"
      ? props.module.instrument
      : null
  );
  const [selectedPatchInfo, setSelectedPatchInfo] = useState(null);

  const [lastVisible, setLastVisible] = useState(null);

  const [showingLiked, setShowingLiked] = useState(false);

  const [searchTags, setSearchTags] = useState([]);
  const [searchValue, setSearchValue] = useState("");

  const user = firebase.auth().currentUser;
  const categories = props.isDrum ? drumCategories : instrumentsCategories;

  //const [userOption, setUserOption] = useState(false);
  //const [sideMenu, setSideMenu] = useState(false);

  const handlePatchSelect = (e, index) => {
    if (props.compact && !e.target.classList.contains("MuiIcon-root")) {
      if (props.isDrum) {
        loadDrumPatch(patchdata[index], () => {}, index).then((instr) => {
          props.setInstrument(instr);
        });
      } else if (patchdata[index].base === "Sampler") {
        loadSamplerFromObject(patchdata[index], () => {}, index).then(
          (instr) => {
            props.setInstrument(instr);
          }
        );
      } else {
        let instr = loadSynthFromGetObject(patchdata[index]);
        props.setInstrument(instr);
      }

      props.setModules((previous) =>
        previous.map((module, i) => {
          if (i === props.index) {
            let newModule = { ...module };
            newModule.instrument = patchIdList[index];
            newModule.volume = patchdata[index].volume;

            return newModule;
          } else {
            return module;
          }
        })
      );
      setSelectedPatch(patchIdList[index]);
      //props.setPatchExplorer(false);
      props.setModulePage(null);
    }
  };

  const getPatchesList = async (tags, name) => {
    const dbPatchesRef = firebase
      .firestore()
      .collection(props.isDrum ? "drumpatches" : "patches");
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
          .map((e) =>
            props.isDrum
              ? drumCategories.indexOf(e)
              : instrumentsCategories.indexOf(e)
          )
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

    let patchesData = patchQuery.docs
      .filter((e) => e.id !== selectedPatch)
      .map((e) => e.data());
    let patchIdList = patchQuery.docs
      .filter((e) => e.id !== selectedPatch)
      .map((e) => e.id);

    setPatchdata(patchesData);
    setPatchIdList(patchIdList);

    let usersToFetch = [
      ...new Set(patchesData.map((e) => e.creator).filter((e) => e)),
    ];

    //console.log(usersToFetch);

    let usersData = await Promise.all(
      usersToFetch.map(async (e, i) => [
        e,
        (await usersRef.doc(e).get()).get("profile"),
      ])
    );

    //console.log(Object.fromEntries(usersData));

    setPatchesUserData(Object.fromEntries(usersData));
  };

  const getUserPatchesList = async (liked) => {
    const dbUserRef = firebase.firestore().collection("users").doc(user.uid);
    const dbPatchesRef = firebase
      .firestore()
      .collection(props.isDrum ? "drumpatches" : "patches");

    let patchIdList = (await dbUserRef.get())
      .get(
        liked ? (props.isDrum ? "likedDrumPatches" : "likedPatches") : "patches"
      )
      .filter((e) => e !== selectedPatch);

    //isLoaded(false);

    if (!patchIdList || patchIdList.length === 0) {
      setPatchdata(null);
      return;
    }

    //console.log(patchIdList);

    setPatchIdList(patchIdList);

    let filesData = await Promise.all(
      patchIdList.map(async (e, i) => {
        return (await dbPatchesRef.doc(e).get()).data();
      })
    );

    setPatchdata(filesData);
  };

  const getSelectedPatchInfo = async () => {
    let info = await firebase
      .firestore()
      .collection(props.isDrum ? "drumpatches" : "patches")
      .doc(selectedPatch)
      .get();

    setSelectedPatchInfo(info.data());

    if (!patchesUserData.hasOwnProperty(info.data().creator)) {
      let userInfo = await firebase
        .firestore()
        .collection("users")
        .doc(info.data().creator)
        .get();
      setPatchesUserData((prev) => {
        let newUserData = { ...prev };
        newUserData[info.data().creator] = userInfo.data().profile;
        return newUserData;
      });
    }
  };

  const getUserLikes = () => {
    firebase
      .firestore()
      .collection("users")
      .doc(user.uid)
      .get()
      .then((r) =>
        setUserLikedPatches(
          r.get(props.isDrum ? "likedDrumPatches" : "likedPatches")
        )
      );
  };

  const handleLike = (index) => {
    if (user === null) return;
    let likedPatchId = patchIdList[index];

    const dbUserRef = firebase.firestore().collection("users").doc(user.uid);
    const dbPatchRef = firebase
      .firestore()
      .collection(props.isDrum ? "drumpatches" : "patches")
      .doc(likedPatchId);

    if (!userLikedPatches.includes(likedPatchId)) {
      dbUserRef.update(
        props.isDrum
          ? {
              likedDrumPatches:
                firebase.firestore.FieldValue.arrayUnion(likedPatchId),
            }
          : {
              likedPatches:
                firebase.firestore.FieldValue.arrayUnion(likedPatchId),
            }
      );

      dbPatchRef.update({ likes: firebase.firestore.FieldValue.increment(1) });
      setUserLikedPatches((prev) => [...prev, likedPatchId]);
    } else {
      dbUserRef.update(
        props.isDrum
          ? {
              likedDrumPatches:
                firebase.firestore.FieldValue.arrayRemove(likedPatchId),
            }
          : {
              likedPatches:
                firebase.firestore.FieldValue.arrayRemove(likedPatchId),
            }
      );

      dbPatchRef.update({ likes: firebase.firestore.FieldValue.increment(-1) });
      setUserLikedPatches((prev) => prev.filter((e) => e !== likedPatchId));
    }
  };

  const playSequence = (input, i) => {
    let instr = typeof input === "number" ? instruments[input] : input;
    let index = i ? i : input;
    setCurrentPlaying(index);
    if (props.isDrum) {
      let playerIndex = 0;
      let keysArray = [];
      instr._buffers._buffers.forEach((v, key) => {
        keysArray.push(key);
      });

      keysArray.forEach((e, i) => {
        i < 7 && instr.player(e).start("+" + i * 0.2);
      });

      Tone.Draw.schedule(() => {
        setCurrentPlaying(null);
      }, "+1.2");
    } else {
      instr
        .triggerAttackRelease("C3", "8n", "+0:0:2")
        .triggerAttackRelease("E3", "8n", "+0:1:0")
        .triggerAttackRelease("G3", "8n", "+0:1:2")
        .triggerAttackRelease("B3", "8n", "+0:2")
        .triggerAttackRelease("C4", "8n", "+0:2:2")
        .triggerAttackRelease("E4", "8n", "+0:3:0")
        .triggerAttackRelease("G4", "8n", "+0:3:2")
        .triggerAttackRelease("B4", "8n", "+1:0:0");

      Tone.Draw.schedule(() => {
        setCurrentPlaying(null);
      }, "+1:0:2");
    }
  };

  const playPatch = (index) => {
    if (instruments[index] !== undefined) {
      let instr = instruments[index];
      setCurrentPlaying(index);

      playSequence(instr, index);
    } else {
      setLoadingPlay(index);

      if (props.isDrum) {
        loadDrumPatch(
          patchdata[index],
          () => {},
          index,
          (instr) => {
            console.log("loaded!");
            playSequence(instr, index);
            setLoadingPlay(null);
          }
        ).then((instr) => {
          setInstruments((prev) => {
            let newInstruments = [...prev];
            newInstruments[index] = instr;
            return newInstruments;
          });
        });
      } else if (patchdata[index].base === "Sampler") {
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
    !props.isDrum
      ? instruments[index].releaseAll()
      : instruments[index].stopAll();
    setCurrentPlaying(null);
  };

  const openPatchPage = (id) => {
    //console.log(id);
    const win = window.open(
      (props.isDrum ? "/drumset/" : "/instrument/") + id,
      "_blank"
    );
    win.focus();
  };

  const handleTagSelect = (tagName) => {
    /* let tag = fileTags.indexOf(tagName);
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

    setTagSelectionTarget(null); */
  };

  const deletePatch = (index) => {
    let patchId = patchIdList[index];

    firebase
      .firestore()
      .collection(props.isDrum ? "drumpatches" : "patches")
      .doc(patchId)
      .delete();

    firebase
      .firestore()
      .collection("users")
      .doc(patchdata[index].user)
      .update(
        props.isDrum
          ? {
              drumPatches: firebase.firestore.FieldValue.arrayRemove(patchId),
            }
          : {
              patches: firebase.firestore.FieldValue.arrayRemove(patchId),
            }
      );

    setPatchdata((prev) => prev.filter((e, i) => i !== index));
    setPatchIdList((prev) => prev.filter((e, i) => i !== index));
  };

  const renamePatch = (newValue) => {
    let index = renamingPatch;
    //console.log(patchIdList[index]);
    firebase
      .firestore()
      .collection(props.isDrum ? "drumpatches" : "patches")
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
    selectedPatch && getSelectedPatchInfo(selectedPatch);
  }, [selectedPatch]);

  useEffect(() => {
    getPatchesList(searchTags, searchValue);
    //console.log("change triggered");
  }, [searchTags, searchValue]);

  return (
    <div
      className={`patch-explorer ${props.compact && "patch-explorer-compact"}`}
    >
      {(props.compact || props.explore) && (
        <Fragment>
          <Autocomplete
            multiple
            freeSolo
            className={`patch-explorer-searchbar ${
              props.compact && "patch-explorer-searchbar-compact"
            }`}
            options={categories}
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
        <TableContainer
          className={props.compact ? "pet-cont-compact" : "pet-cont"}
        >
          <Table
            component={props.compact ? "div" : Paper}
            size={"small"}
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
              {props.compact && (
                <TableRow component="th" scope="row">
                  <TableCell style={{ width: props.compact ? 20 : 50 }}>
                    {selectedPatchInfo ? (
                      <Icon>done</Icon>
                    ) : (
                      <IconButton onClick={() => setSavePatchDialog(true)}>
                        <Icon>save</Icon>
                      </IconButton>
                    )}
                  </TableCell>
                  <TableCell scope="row">
                    <div
                      style={{
                        maxWidth: 200,
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="overline">
                        {selectedPatchInfo
                          ? selectedPatchInfo.name
                          : "Save Instrument"}
                      </Typography>
                      {selectedPatchInfo &&
                        selectedPatchInfo.base === "Sampler" && (
                          <Tooltip arrow placement="top" title="Sampler">
                            <Icon style={{ fontSize: 16, marginLeft: 4 }}>
                              graphic_eq
                            </Icon>
                          </Tooltip>
                        )}
                      {selectedPatchInfo &&
                        patchesUserData[selectedPatchInfo.creator] && (
                          <Tooltip
                            title={
                              patchesUserData[selectedPatchInfo.creator].name
                            }
                          >
                            <Avatar
                              style={{ height: 24, width: 24, marginLeft: 8 }}
                              alt={
                                patchesUserData[selectedPatchInfo.creator]
                                  .displayName
                              }
                              src={
                                patchesUserData[selectedPatchInfo.creator]
                                  .photoURL
                              }
                            />
                          </Tooltip>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {selectedPatchInfo && (
                      <div className="pet-chip-cell">
                        <Chip
                          className={"file-tag-chip"}
                          label={categories[selectedPatchInfo.categ]}
                        />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}

              {loaded
                ? patchdata.map((row, index) => (
                    <TableRow
                      key={row.name}
                      onClick={(e) => handlePatchSelect(e, index)}
                      component="tr"
                      scope="row"
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
                      <TableCell scope="row">
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
                          {props.userPatches &&
                            patchdata[index].user === user.uid && (
                              <IconButton
                                onClick={() => setRenamingPatch(index)}
                              >
                                <Icon>edit</Icon>
                              </IconButton>
                            )}
                          {props.compact &&
                            patchesUserData[patchdata[index].creator] && (
                              <Tooltip
                                title={
                                  patchesUserData[patchdata[index].creator]
                                    .displayName
                                }
                              >
                                <Avatar
                                  style={{
                                    height: 24,
                                    width: 24,
                                    marginLeft: 8,
                                  }}
                                  alt={
                                    patchesUserData[patchdata[index].creator]
                                      .displayName
                                  }
                                  src={
                                    patchesUserData[patchdata[index].creator]
                                      .photoURL
                                  }
                                />
                              </Tooltip>
                            )}
                        </div>
                      </TableCell>
                      {props.explore && (
                        <TableCell
                          className="pet-collapsable-column"
                          style={{ width: 50 }}
                        >
                          {patchesUserData[patchdata[index].creator] && (
                            <Tooltip
                              title={
                                patchesUserData[patchdata[index].creator]
                                  .displayName
                              }
                            >
                              <Avatar
                                alt={
                                  patchesUserData[patchdata[index].creator]
                                    .displayName
                                }
                                src={
                                  patchesUserData[patchdata[index].creator]
                                    .photoURL
                                }
                              />
                            </Tooltip>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="pet-chip-cell">
                          {categories[patchdata[index].categ] && (
                            <Chip
                              clickable={true}
                              onClick={(e) =>
                                !!props.userPatches &&
                                setTagSelectionTarget([e.target, index])
                              }
                              className={"file-tag-chip"}
                              label={categories[patchdata[index].categ]}
                            />
                          )}
                        </div>
                      </TableCell>
                      {!props.compact && (
                        <Fragment>
                          {(props.explore || !!showingLiked) && (
                            <TableCell style={{ width: 50 }} align="center">
                              <IconButton onClick={() => handleLike(index)}>
                                <Icon
                                  color={
                                    userLikedPatches.includes(
                                      patchIdList[index]
                                    )
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
                              <IconButton
                                onClick={() => setDeletingPatch(index)}
                              >
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
                      <TableRow>
                        <TableCell
                          style={{ width: props.compact ? 20 : 50 }}
                          component="th"
                          scope="row"
                        >
                          <IconButton>
                            <Icon>play_arrow</Icon>
                          </IconButton>
                        </TableCell>
                        <TableCell component="th" scope="row">
                          <Typography
                            variant="overline"
                            className="fe-filename"
                          >
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
        </TableContainer>
      ) : (
        "Nothing Found"
      )}

      <div className="break" />

      {props.compact && (
        <BottomNavigation
          className="patch-explorer-compact-bottom-nav"
          value={showingLiked}
          onChange={(e, v) =>
            v === "ie"
              ? props.setPatchExplorer(false)
              : v === 0
              ? getUserPatchesList()
              : getUserPatchesList(true)
          }
          showLabels
        >
          <BottomNavigationAction label="User" icon={<Icon>person</Icon>} />
          <BottomNavigationAction label="Liked" icon={<Icon>favorite</Icon>} />
          <BottomNavigationAction
            label="Instrument Editor"
            icon={<Icon>tune</Icon>}
            value={"ie"}
          />
        </BottomNavigation>
      )}

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
          {categories.map((e, i) => (
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

      {savePatchDialog && (
        <SavePatch
          isDrum={props.isDrum}
          onClose={() => setSavePatchDialog(false)}
          onSubmit={props.saveUserPatch}
        />
      )}
    </div>
  );
}

export default PatchExplorer;

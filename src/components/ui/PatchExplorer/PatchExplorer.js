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
  OutlinedInput,
  InputAdornment,
  Fab,
} from "@material-ui/core";

import { Skeleton, Autocomplete } from "@material-ui/lab";

import "./PatchExplorer.css";

import firebase from "firebase";
import { useTranslation } from "react-i18next";

import ActionConfirm from "../Dialogs/ActionConfirm";
import NameInput from "../Dialogs/NameInput";
import SavePatch from "../Dialogs/SavePatch";
import NotFoundPage from "../NotFoundPage";

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
  const { t } = useTranslation();

  const [patchdata, setPatchdata] = useState([]);
  const [patchIdList, setPatchIdList] = useState([]);

  const [patchesUserData, setPatchesUserData] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

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

  const [isFirstQuery, setIsFirstQuery] = useState(true);
  const [isQueryEnd, setIsQueryEnd] = useState(false);

  const [lastItem, setLastItem] = useState(null);

  const [showingLiked, setShowingLiked] = useState(false);

  const [searchTags, setSearchTags] = useState([]);
  const [searchValue, setSearchValue] = useState("");

  const [notifications, setNotifications] = useState([]);

  const categories = props.isDrum ? drumCategories : instrumentsCategories;

  const usersRef = firebase.firestore().collection("users");

  const itemsPerPage = 15;

  const handlePatchSelect = (e, index) => {
    if (props.compact && !e.target.classList.contains("MuiIcon-root")) {
      props.updateFilesStatsOnChange();
      let id = patchIdList[index];

      //increment "ld" & "in" counters for patch and files

      firebase
        .firestore()
        .collection(props.isDrum ? "drumpatches" : "patches")
        .doc(id)
        .update({
          ld: firebase.firestore.FieldValue.increment(1),
          in: firebase.firestore.FieldValue.increment(1),
        });

      if (props.isDrum || patchdata[index].base === "Sampler") {
        firebase
          .firestore()
          .collection(props.isDrum ? "drumpatches" : "patches")
          .doc(id)
          .get((e) =>
            Object.values(e.data().urls)
              .map((e) => firebase.firestore().collection("files").doc(e))
              .update({
                ld: firebase.firestore.FieldValue.increment(1),
                in: firebase.firestore.FieldValue.increment(1),
              })
          );
      }

      //load patch

      if (props.isDrum) {
        loadDrumPatch(
          patchdata[index],
          props.compact ? props.setInstrumentsLoaded : () => {},
          props.index,
          setNotifications
        ).then((instr) => {
          props.setInstrument(instr);
        });
      } else if (patchdata[index].base === "Sampler") {
        loadSamplerFromObject(
          patchdata[index],
          props.compact ? props.setInstrumentsLoaded : () => {},
          props.index,
          () => {},
          setNotifications
        ).then((instr) => {
          props.setInstrument(instr);
        });
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

  const getPatchesList = async (clear) => {
    //TODO: Scroll load in /instruments/

    setIsLoading(true);

    let queryRules = () => {
      let rules = firebase
        .firestore()
        .collection(props.isDrum ? "drumpatches" : "patches");

      if (searchValue) {
        rules = rules
          .where("name", ">=", searchValue)
          .where("name", "<=", searchValue + "\uf8ff");
      }
      if (searchTags && searchTags.length > 0) {
        let tagsIds = searchTags
          .map((e) =>
            props.isDrum
              ? drumCategories.indexOf(e)
              : instrumentsCategories.indexOf(e)
          )
          .filter((e) => e !== -1);
        //console.log(tagsIds);
        rules = rules.where("categ", "in", tagsIds);
      }
      if (!clear && !isFirstQuery && lastItem) {
        //console.log("next page");
        rules = rules.startAfter(lastItem);
      }

      return rules;
    };

    let patchQuery = await queryRules().limit(itemsPerPage).get();

    setLastItem(patchQuery.docs[patchQuery.docs.length - 1]);

    if (patchQuery.docs.length < itemsPerPage) {
      setIsQueryEnd(true);
    }

    let patchesData = patchQuery.docs
      .filter((e) => e.id !== selectedPatch)
      .map((e) => e.data());
    let patchIdList = patchQuery.docs
      .filter((e) => e.id !== selectedPatch)
      .map((e) => e.id);

    setPatchdata((prev) => [...prev, ...patchesData]);
    setPatchIdList((prev) => [...prev, ...patchIdList]);

    setIsLoading(patchesData === false);

    let usersToFetch = [
      ...new Set(
        patchesData
          .map((e) => e.creator)
          .filter((e) => e)
          .filter((e) => !patchesUserData.hasOwnProperty(e))
      ),
    ];

    if (usersToFetch.length > 0) {
      let usersData = await Promise.all(
        usersToFetch.map(async (e, i) => [
          e,
          (await usersRef.doc(e).get()).get("profile"),
        ])
      );

      setPatchesUserData((prev) => {
        return { ...prev, ...Object.fromEntries(usersData) };
      });
    }
    setIsFirstQuery(patchesData === false);
  };

  const getUserPatchesList = async (liked) => {
    const dbUserRef = firebase
      .firestore()
      .collection("users")
      .doc(props.user.uid);
    const dbPatchesRef = firebase
      .firestore()
      .collection(props.isDrum ? "drumpatches" : "patches");

    let patchIdList = (await dbUserRef.get())
      .get(
        liked
          ? props.isDrum
            ? "likedDrumPatches"
            : "likedPatches"
          : props.isDrum
          ? "drumPatches"
          : "patches"
      )
      .filter((e) => e !== selectedPatch);

    setIsLoading(true);

    //console.log(patchIdList);

    if (!patchIdList || patchIdList.length === 0) {
      setPatchdata(undefined);
      return;
    }

    setPatchIdList(patchIdList);

    let patchesData = await Promise.all(
      patchIdList.map(async (e, i) => {
        return (await dbPatchesRef.doc(e).get()).data();
      })
    );

    setPatchdata(patchesData);

    if (liked) {
      let usersToFetch = [
        ...new Set(
          patchesData
            .map((e) => e.creator)
            .filter((e) => e)
            .filter((e) => !patchesUserData.hasOwnProperty(e))
        ),
      ];

      if (usersToFetch.length > 0) {
        let usersData = await Promise.all(
          usersToFetch.map(async (e, i) => [
            e,
            (await usersRef.doc(e).get()).get("profile"),
          ])
        );

        setPatchesUserData((prev) => {
          return { ...prev, ...Object.fromEntries(usersData) };
        });
      }
    }
  };

  const getSelectedPatchInfo = async () => {
    let info = await firebase
      .firestore()
      .collection(props.isDrum ? "drumpatches" : "patches")
      .doc(selectedPatch)
      .get();

    setSelectedPatchInfo(info.data());

    if (
      info.data().creator &&
      !patchesUserData.hasOwnProperty(info.data().creator)
    ) {
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
      .doc(props.user.uid)
      .get()
      .then((r) =>
        setUserLikedPatches(
          r.get(props.isDrum ? "likedDrumPatches" : "likedPatches")
        )
      );
  };

  const handleLike = (index) => {
    if (props.user === null) return;
    let likedPatchId = patchIdList[index];

    const dbUserRef = firebase
      .firestore()
      .collection("users")
      .doc(props.user.uid);
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
      setPatchdata((prev) => {
        let newPatchdata = [...prev];
        newPatchdata[index].likes = newPatchdata[index].likes + 1;
        return newPatchdata;
      });
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
      setPatchdata((prev) => {
        let newPatchdata = [...prev];
        newPatchdata[index].likes = newPatchdata[index].likes - 1;
        return newPatchdata;
      });
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
            //console.log("loaded!");
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
          },
          setNotifications
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
      .doc(patchdata[index].creator)
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
  };

  const detectScrollToBottom = (e) => {
    if (e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight)
      !isQueryEnd && !isLoading && getPatchesList();
  };

  const onAppWrapperScrollTrigger = () => {
    !isQueryEnd && !isLoading && props.explore && getPatchesList();
    !props.compact && props.setBottomScroll(false);
  };

  useEffect(() => {
    if ((props.explore || props.compact) && !props.userPatches) {
      getPatchesList();
    }

    return () => {
      instruments.forEach((instr) => !!instr && instr.dispose());
    };
  }, []);

  useEffect(() => {
    if (patchdata === undefined || (patchdata && patchdata.length > 0))
      setIsLoading(false);
    if (patchdata && patchdata.length === 0) setIsLoading(true);

    //console.log(patchdata);
  }, [patchdata]);

  useEffect(() => {
    if (props.userPatches && props.user) {
      clearPatches();
      getUserPatchesList(showingLiked);
    }
  }, [props.userPatches, props.user, showingLiked]);

  useEffect(() => {
    props.user && getUserLikes();
  }, [props.user]);

  useEffect(() => {
    props.compact && selectedPatch && getSelectedPatchInfo(selectedPatch);
  }, [selectedPatch]);

  useEffect(() => {
    clearPatches();
    if (!isLoading && ((searchTags && searchTags.length > 0) || searchValue)) {
      getPatchesList("clear");
    }

    //console.log("change triggered");
  }, [searchTags, searchValue]);

  useEffect(() => {
    if (isLoading === false) {
      clearPatches();
      getPatchesList("clear");
    }

    //console.log("change triggered");
  }, [props.isDrum]);

  useEffect(() => onAppWrapperScrollTrigger(), [props.bottomScroll]);

  /* useEffect(() => {
    !isQueryEnd && !isLoading && getPatchesList();
  }, [props.isScrollBottom]); */

  return (
    <div
      className={`patch-explorer ${props.compact && "patch-explorer-compact"}`}
      style={{ marginTop: props.userPatches && 32 }}
    >
      {props.compact || props.explore ? (
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

      {patchdata !== undefined ? (
        <TableContainer
          className={props.compact ? "pet-cont-compact" : "pet-cont"}
          onScroll={props.compact && detectScrollToBottom}
        >
          <Table
            component={props.compact ? "div" : Paper}
            size={"small"}
            className={`patch-explorer-table ${
              props.compact ? "pet-compact" : "pet-normal"
            }`}
          >
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
                  <TableCell>
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
                              patchesUserData[selectedPatchInfo.creator]
                                .username
                            }
                          >
                            <Avatar
                              style={{ height: 24, width: 24, marginLeft: 8 }}
                              alt={
                                patchesUserData[selectedPatchInfo.creator]
                                  .username
                              }
                              src={
                                patchesUserData[selectedPatchInfo.creator]
                                  .photoURL
                              }
                              onClick={() =>
                                props.handlePageNav(
                                  "user",
                                  patchesUserData[selectedPatchInfo.creator]
                                    .username,
                                  true
                                )
                              }
                            />
                          </Tooltip>
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="pet-collapsable-column">
                    {selectedPatchInfo && (
                      <div className="pet-chip-cell">
                        <Chip
                          clickable
                          onClick={() =>
                            setSearchTags([selectedPatchInfo.categ])
                          }
                          className={"file-tag-chip"}
                          label={categories[selectedPatchInfo.categ]}
                        />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}

              {patchdata.map(
                (patch, index) =>
                  patch && (
                    <TableRow
                      key={"row" + index}
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
                            onClick={() =>
                              props.handlePageNav(
                                props.isDrum ? "drumset" : "instrument",
                                patchIdList[index],
                                true
                              )
                            }
                          >
                            {patch.name}
                          </Typography>
                          {patch.base === "Sampler" && (
                            <Tooltip arrow placement="top" title="Sampler">
                              <Icon style={{ fontSize: 16, marginLeft: 4 }}>
                                graphic_eq
                              </Icon>
                            </Tooltip>
                          )}
                          {props.userPatches &&
                            patch.creator === props.user.uid && (
                              <IconButton
                                onClick={() => setRenamingPatch(index)}
                              >
                                <Icon>edit</Icon>
                              </IconButton>
                            )}
                          {patchesUserData[patch.creator] &&
                            (!props.userPatches ||
                              (props.userPatches && showingLiked)) && (
                              <Tooltip
                                title={patchesUserData[patch.creator].username}
                              >
                                <Avatar
                                  style={{
                                    height: 24,
                                    width: 24,
                                    marginLeft: 8,
                                  }}
                                  alt={patchesUserData[patch.creator].username}
                                  src={patchesUserData[patch.creator].photoURL}
                                  onClick={() =>
                                    props.handlePageNav(
                                      "user",
                                      patchesUserData[patch.creator].username,
                                      true
                                    )
                                  }
                                />
                              </Tooltip>
                            )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div
                          className="pet-chip-cell"
                          className="pet-collapsable-column"
                        >
                          {categories[patch.categ] && (
                            <Chip
                              clickable
                              onClick={(e) =>
                                props.userPatches
                                  ? setTagSelectionTarget([e.target, index])
                                  : setSearchTags([categories[patch.categ]])
                              }
                              className={"file-tag-chip"}
                              label={categories[patch.categ]}
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
                                <Typography
                                  className="like-btn-label"
                                  variant="overline"
                                >
                                  {patch.likes}
                                </Typography>
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
                  )
              )}
              {isLoading &&
                Array(10)
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
                        <Typography variant="overline" className="fe-filename">
                          <Skeleton variant="text" />
                        </Typography>
                      </TableCell>
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
        <NotFoundPage type="patchExplorer" />
      )}

      <div className="break" />

      {props.compact && (
        <BottomNavigation
          className="patch-explorer-compact-bottom-nav"
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

      {!props.compact && props.userPatches && (
        <Fab
          className="pe-fab"
          color={showingLiked ? "secondary" : "primary"}
          onClick={() => setShowingLiked((prev) => !prev)}
        >
          <Icon>{showingLiked ? "favorite" : "person"}</Icon>
        </Fab>
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
        <ActionConfirm
          delete
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

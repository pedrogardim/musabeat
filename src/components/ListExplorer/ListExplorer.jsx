import React, { useState, useEffect } from "react";
import * as Tone from "tone";

import {
  Paper,
  Table,
  TableBody,
  TableContainer,
  InputAdornment,
  Icon,
  Menu,
  MenuItem,
  TextField,
  Fab,
  Dialog,
  Box,
} from "@mui/material";

import { Autocomplete } from "@mui/material";

import "./style.css";

import firebase from "firebase";

import Confirm from "../dialogs/Confirm";
import NameInput from "../dialogs/NameInput";
import SavePatch from "../dialogs/SavePatch";
import NotFoundPage from "../../pages/NotFoundPage";

import ListExplorerRow from "./ListExplorerRow";
import ListExplorerRowSelected from "./ListExplorerRowSelected";
import ListExplorerRowPlaceholder from "./ListExplorerRowPlaceholder";

import { fileTags } from "../../services/MiscData";

const fileTagDrumComponents = Object.values(fileTags).filter(
  (_, i) => i > 4 && i < 20
);
const fileTagDrumGenres = Object.values(fileTags).filter(
  (_, i) => i >= 20 && i < 24
);

const typeDBMapping = {
  files: "files",
  seq: "drumpatches",
  instr: "patches",
};

function ListExplorer(props) {
  const {
    type,
    userPage,
    compact,
    explore,
    setBottomScroll,
    bottomScroll,
    tags,
    fileEditor,
    setFileExplorer,
    selectedItem,
    saveUserPatch,
  } = props;
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLikes, setUserLikes] = useState([]);

  const [openDialog, setOpenDialog] = useState([]);

  const [isFirstQuery, setIsFirstQuery] = useState(true);
  const [isQueryEnd, setIsQueryEnd] = useState(false);

  const [lastItem, setLastItem] = useState(null);

  const [showingLiked, setShowingLiked] = useState(false);
  const [showingUser, setShowingUser] = useState(false);

  const [searchTags, setSearchTags] = useState(tags ? tags : []);
  const [searchValue, setSearchValue] = useState("");

  const [tagSelectionTarget, setTagSelectionTarget] = useState(null);

  const itemsPerPage = 15;
  const user = firebase.auth().currentUser;

  const patchSizeLimit = 5242880;

  //const [userOption, setUserOption] = useState(false);
  //const [sideMenu, setSideMenu] = useState(false);

  const onItemClick = () => {};

  const handleFileSelect = (e, index) => {
    /*   if (compact && !e.target.classList.contains("MuiIcon-root")) {
      if (isDrum && items[index].data.dur > 5) {
        setSnackbarMessage &&
          setSnackbarMessage("Try picking a file shorter than 5 seconds");
        return;
      }

      if (
        compact &&
        items[index].data.size + patchSize >= patchSizeLimit
      ) {
        setFileLimitDialog(true);
        console.log("limit");
        return;
      }

      setInstrumentLoaded(false);

      if (
        (compact && instrument.name === "Sampler") ||
        audioTrack
      ) {
        let url = filesUrl[index];
        //console.log(url);
        var xhr = new XMLHttpRequest();
        xhr.responseType = "blob";
        xhr.onload = function (event) {
          var blob = xhr.response;
          //console.log(blob);
          blob.arrayBuffer().then((arraybuffer) => {
            //console.log(arraybuffer);
            instrument.context.rawContext.decodeAudioData(
              arraybuffer,
              (audiobuffer) => {
                //console.log(audiobuffer);
                onFileClick(
                  fileIdList[index],
                  filesUrl[index],
                  audiobuffer,
                  Tone.Frequency(item, "midi").toNote(),
                  filedata[index]
                );
                setInstrumentLoaded(true);

                setFileExplorer && setFileExplorer(false);
              }
            );
          });
        };
        xhr.open("GET", url);
        xhr.send();
      } else {
        onFileClick(
          fileIdList[index],
          filesUrl[index],
          players[index] !== undefined && players[index].buffer,
          item,
          filedata[index]
        );
        onClose && onClose();
      }
    } */
  };

  const queryItems = async (clear) => {
    //TODO: Scroll load in /files/
    const usersRef = firebase.firestore().collection("users");
    const storageRef = firebase.storage();

    setIsLoading(true);

    const fileIdList = user
      ? (await usersRef.doc(user.uid).get()).get(
          showingLiked ? "liked" + typeDBMapping[type] : typeDBMapping[type]
        )
      : [];

    let queryRules = () => {
      let rules = firebase.firestore().collection(typeDBMapping[type]);

      if (user && (userPage || showingLiked || showingUser)) {
        rules = rules.where(
          firebase.firestore.FieldPath.documentId(),
          "in",
          fileIdList
        );
      }

      if (searchValue) {
        console.log(searchValue);
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
        //console.log("next page");
        rules = rules.startAfter(lastItem);
      }

      return rules;
    };

    const fileQuery = await queryRules().limit(itemsPerPage).get();

    setLastItem(fileQuery.docs[fileQuery.docs.length - 1]);

    if (fileQuery.docs.length < itemsPerPage) {
      setIsQueryEnd(true);
    }

    setIsLoading(fileQuery === false);

    const filesUrl =
      type === "files"
        ? await Promise.all(
            fileQuery.docs.map(async (e, i) => {
              return await storageRef.ref(e.id).getDownloadURL();
            })
          )
        : [];

    const usersToFetch = [
      ...new Set(
        fileQuery.docs
          .map((e) => e.data()[type === "files" ? "user" : "creator"])
          .filter((e) => e)
        //.filter((e) => items.findIndex((x) => x.data.user === e) === -1)
      ),
    ];

    const userData =
      usersToFetch.length > 0
        ? Object.fromEntries(
            await Promise.all(
              usersToFetch.map(async (e, i) => [
                e,
                (await usersRef.doc(e).get()).get("profile"),
              ])
            )
          )
        : [];

    const queryItems = fileQuery.docs.map((e, i) => ({
      id: e.id,
      data: e.data(),
      url: type === "files" ? filesUrl[i] : undefined,
      user: userData[e.data()[type === "files" ? "user" : "creator"]],
    }));

    console.log(queryItems);

    setItems((prev) => [...prev, ...queryItems]);

    setIsFirstQuery(fileQuery === false);
  };

  const getUserLikes = () => {
    firebase
      .firestore()
      .collection("users")
      .doc(user.uid)
      .get()
      .then((r) => setUserLikes(r.get("liked" + typeDBMapping[type])));
  };

  const handleLike = (index) => {
    if (user === null) return;
    let likedFileId = items[index].id;

    const dbUserRef = firebase.firestore().collection("users").doc(user.uid);
    const dbFileRef = firebase.firestore().collection("files").doc(likedFileId);

    if (!userLikes.includes(likedFileId)) {
      dbUserRef.update({
        likedfiles: firebase.firestore.FieldValue.arrayUnion(likedFileId),
      });

      dbFileRef.update({ likes: firebase.firestore.FieldValue.increment(1) });
      setUserLikes((prev) => [...prev, likedFileId]);
      setItems((prev) => {
        let newItems = [...prev];
        newItems[index].data.likes++;
        return newItems;
      });
    } else {
      dbUserRef.update({
        likedfiles: firebase.firestore.FieldValue.arrayRemove(likedFileId),
      });

      dbFileRef.update({ likes: firebase.firestore.FieldValue.increment(-1) });
      setUserLikes((prev) => prev.filter((e) => e !== likedFileId));
      setItems((prev) => {
        let newItems = [...prev];
        newItems[index].data.likes--;
        return newItems;
      });
    }
  };

  const handleTagSelect = (tagName) => {
    let tag = fileTags.indexOf(tagName);
    let itemIndex = tagSelectionTarget[1];
    let tagIndex = tagSelectionTarget[2];

    let hasTag = items[itemIndex].data.categ[tagIndex] === tag;

    if (!hasTag) {
      let finalCateg;
      setItems((prev) => {
        let newUpTags = [...prev];
        newUpTags[itemIndex].data.categ[tagIndex] = tag;
        finalCateg = newUpTags[itemIndex].data.categ;
        return newUpTags;
      });
      firebase
        .firestore()
        .collection("files")
        .doc(items[itemIndex].id)
        .update({ categ: finalCateg });
    }

    setTagSelectionTarget(null);
  };

  const deleteFile = (index) => {
    let fileId = items[index].id;

    firebase.storage().ref(fileId).delete();

    firebase.firestore().collection("files").doc(fileId).delete();

    firebase
      .firestore()
      .collection("users")
      .doc(items[index].data.user)
      .update({
        files: firebase.firestore.FieldValue.arrayRemove(fileId),
        sp: firebase.firestore.FieldValue.increment(-items[index].data.size),
      });

    setItems((prev) => prev.filter((e, i) => i !== index));
  };

  const renameFile = (newValue) => {
    let index = openDialog[1];
    //console.log(fileIdList[index]);
    firebase
      .firestore()
      .collection("files")
      .doc(items[index].id)
      .update({ name: newValue });
    setItems((prev) => {
      let newItems = [...prev];
      newItems[index].data.name = newValue;
      return newItems;
    });
  };

  const clearFiles = () => {
    setLastItem(null);
    setIsFirstQuery(true);
    setItems([]);
  };

  const detectScrollToBottom = (e) => {
    if (e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight)
      !isQueryEnd && !isLoading && queryItems();
  };

  const onAppWrapperScrollTrigger = () => {
    !isQueryEnd && !isLoading && explore && queryItems();
    !compact && setBottomScroll(false);
  };

  useEffect(() => {
    //clearFiles();
    queryItems();
  }, []);

  useEffect(() => {
    if (items === null || (items && items.length > 0)) setIsLoading(false);
    if (items && items.length === 0) setIsLoading(true);
  }, [items]);

  useEffect(() => {
    if (userPage && user) {
      clearFiles();
      //setIsLoading(false);
      queryItems(showingLiked);
    }
  }, [userPage, user, showingLiked]);

  useEffect(() => {
    user && getUserLikes();
  }, [user]);

  useEffect(() => {
    clearFiles();
    if (!isLoading && ((searchTags && searchTags.length > 0) || searchValue)) {
      queryItems("clear");
    }

    //console.log("change triggered");
  }, [searchTags, searchValue]);

  useEffect(() => onAppWrapperScrollTrigger(), [bottomScroll]);

  const mainContent = (
    <>
      {compact || explore ? (
        <>
          <Autocomplete
            multiple
            freeSolo
            className={`file-explorer-searchbar ${
              compact && "file-explorer-searchbar-compact"
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
                    <>
                      <InputAdornment position="start">
                        <Icon>search</Icon>
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
                onChange={(e) => setSearchValue(e.target.value)}
                value={searchValue}
              />
            )}
          />
          <div className="break" />
        </>
      ) : (
        <div className="break" style={{ height: 32 }} />
      )}

      {items !== undefined ? (
        <TableContainer
          className={compact ? "fet-cont-compact" : "fet-cont"}
          onScroll={compact && detectScrollToBottom}
          style={{ marginTop: userPage && 32 }}
        >
          <Table
            component={compact ? "div" : Paper}
            size="small"
            className={`file-explorer-table ${
              compact ? "fet-compact" : "fet-normal"
            }`}
          >
            <TableBody>
              {selectedItem !== undefined && (
                <ListExplorerRowSelected
                  selectedItem={selectedItem}
                  setOpenDialog={setOpenDialog}
                />
              )}
              {items.map((row, index) => (
                <ListExplorerRow
                  key={row.id}
                  row={row}
                  index={index}
                  onItemClick={() => onItemClick(index)}
                  explorerProps={props}
                  setOpenDialog={setOpenDialog}
                  liked={userLikes.includes(row.id)}
                  setSearchTags={setSearchTags}
                  setTagSelectionTarget={setTagSelectionTarget}
                  handleLike={handleLike}
                />
              ))}
              {isLoading &&
                Array(10)
                  .fill(1)
                  .map((e) => (
                    <ListExplorerRowPlaceholder explorerProps={props} />
                  ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <NotFoundPage type="fileExplorer" />
      )}

      <div className="break" />

      {/* compact && (
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
      ) */}

      {!compact && userPage && (
        <Fab
          className="fe-fab"
          color={showingLiked ? "secondary" : "primary"}
          onClick={() => setShowingLiked((prev) => !prev)}
        >
          <Icon>{showingLiked ? "favorite" : "person"}</Icon>
        </Fab>
      )}

      {userPage && (
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

      <Confirm
        delete
        fileExplore
        open={openDialog[0] === "delete"}
        action={() => deleteFile(openDialog[1])}
        onClose={() => setOpenDialog([])}
      />

      <NameInput
        open={openDialog[0] === "rename"}
        onSubmit={(newValue) => renameFile(newValue)}
        onClose={() => setOpenDialog([])}
      />

      <SavePatch
        open={openDialog[0] === "savepatch"}
        isDrum={type === "seq"}
        onClose={() => setOpenDialog([])}
        onSubmit={saveUserPatch}
      />
    </>
  );

  return compact && !fileEditor ? (
    <Dialog
      open={true}
      onClose={() => setFileExplorer(false)}
      maxWidth="xl"
      fullWidth="true"
      PaperProps={{ style: { minHeight: "calc(100% - 64px)" } }}
    >
      {mainContent}
    </Dialog>
  ) : (
    <Box
      className={`file-explorer ${compact && "file-explorer-compact"}`}
      sx={{ bgcolor: !compact && "background.default" }}
    >
      {mainContent}
    </Box>
  );
}

export default ListExplorer;

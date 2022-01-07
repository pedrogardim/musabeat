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

import { useListQuery } from "./hooks/useListQuery";

import { fileTags } from "../../services/MiscData";

import {
  deleteItem,
  renameItem,
  likeItem,
  selectTag,
} from "./services/Actions";

const fileTagDrumComponents = Object.keys(fileTags).filter(
  (_, i) => i > 4 && i < 20
);
const fileTagDrumGenres = Object.keys(fileTags).filter(
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
  const [userLikes, setUserLikes] = useState([]);

  const [openDialog, setOpenDialog] = useState([]);

  const [showingLiked, setShowingLiked] = useState(false);
  const [showingUser, setShowingUser] = useState(false);

  const [searchTags, setSearchTags] = useState(tags ? tags : []);
  const [searchValue, setSearchValue] = useState("");

  const [tagSelectionTarget, setTagSelectionTarget] = useState(null);

  const user = firebase.auth().currentUser;

  const patchSizeLimit = 5242880;

  const { isLoading, isQueryEnd, queryItems } = useListQuery({
    searchValue,
    searchTags,
    showingLiked,
    showingUser,
    items,
    setItems,
    type,
    userPage,
  });

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

  const getUserLikes = () => {
    firebase
      .firestore()
      .collection("users")
      .doc(user.uid)
      .get()
      .then((r) => setUserLikes(r.get("liked" + typeDBMapping[type])));
  };

  const handleLike = (index) =>
    likeItem(
      index,
      items,
      setItems,
      userLikes,
      setUserLikes,
      typeDBMapping[type]
    );

  const handleTagSelect = (tag) =>
    selectTag(
      tag,
      tagSelectionTarget,
      setTagSelectionTarget,
      items,
      setItems,
      typeDBMapping[type]
    );

  const detectScrollToBottom = (e) => {
    if (e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight)
      !isQueryEnd && !isLoading && queryItems();
  };

  const onAppWrapperScrollTrigger = () => {
    !isQueryEnd && !isLoading && explore && queryItems();
    !compact && setBottomScroll(false);
  };

  useEffect(() => {
    user && getUserLikes();
  }, [user]);

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
            options={Object.keys(fileTags).map((e) => parseInt(e))}
            onChange={(e, v) => {
              setSearchTags(v);
              setSearchValue("");
            }}
            value={searchTags}
            getOptionLabel={(opt) => fileTags[opt]}
            renderInput={(params) => (
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
        action={() =>
          deleteItem(openDialog[1], items, setItems, typeDBMapping[type])
        }
        onClose={() => setOpenDialog([])}
      />

      <NameInput
        open={openDialog[0] === "rename"}
        onSubmit={(newValue) =>
          renameItem(
            openDialog[1],
            newValue,
            items,
            setItems,
            typeDBMapping[type]
          )
        }
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

import React, { useState, useEffect } from "react";

import { play, stop, handleDownload } from "../services/Actions";

import firebase from "firebase";

import {
  TableCell,
  TableRow,
  CircularProgress,
  Icon,
  IconButton,
  Typography,
  Chip,
  Tooltip,
  Avatar,
} from "@mui/material";

import AppLogo from "../../../components/AppLogo";

import { fileExtentions } from "../../../services/Audio";

import {
  fileTags,
  instrumentsCategories,
  drumCategories,
} from "../../../services/MiscData";

const typeURLMapping = {
  files: "file",
  seq: "drumset",
  instr: "instrument",
};

function ListExplorerRow(props) {
  const {
    row,
    index,
    explorerProps,
    handlePageNav,
    setOpenDialog,
    liked,
    setSearchTags,
    setTagSelectionTarget,
    handleLike,
  } = props;
  const { type, userPage, compact, FileInspector, onItemClick } = explorerProps;

  const categories = type === "seq" ? drumCategories : instrumentsCategories;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [instrument, setInstrument] = useState(null);

  //console.log(row);

  const user = firebase.auth().currentUser;

  const handleRowClick = () => {
    onItemClick(row.id, row.url, instrument && instrument.buffer, row.data);
  };

  const playRow = () =>
    play(instrument, type, setIsPlaying, row, setInstrument, setIsLoading);

  const stopRow = () => stop(instrument, setIsPlaying);

  useEffect(() => {
    return () => {
      instrument && instrument.dispose();
    };
  }, []);

  return (
    <TableRow onClick={compact && handleRowClick}>
      <TableCell style={{ width: 50 }}>
        {isLoading ? (
          <CircularProgress size={27} />
        ) : isPlaying ? (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              stopRow();
            }}
          >
            <Icon>stop</Icon>
          </IconButton>
        ) : (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              playRow();
            }}
          >
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
          {row.user ? (
            <Tooltip title={row.user.username}>
              <Avatar
                style={{
                  height: 24,
                  width: 24,
                  marginRight: 8,
                }}
                alt={row.user.username}
                src={row.user.photoURL}
                onClick={(ev) => handlePageNav("user", row.user.username, ev)}
              />
            </Tooltip>
          ) : (
            <AppLogo
              className="app-logo-blue"
              style={{
                height: 16,
                width: 16,
                marginRight: 8,
                marginLeft: 4,
              }}
            />
          )}

          <Typography
            variant="overline"
            className="fe-filename"
            /* style={{
              color:
                row.data.size + props.patchSize >= patchSizeLimit && "darkgrey",
            }} */
            onClick={(ev) => handlePageNav(typeURLMapping[type], row.id, ev)}
          >
            {row.data.name}
          </Typography>

          {type === "instr" && row.data.base === "Sampler" && (
            <Tooltip arrow placement="top" title="Sampler">
              <Icon style={{ fontSize: 16, marginLeft: 4 }}>graphic_eq</Icon>
            </Tooltip>
          )}
          {type === "files" && row.data.type !== -1 && (
            <Tooltip title={fileExtentions[row.data.type]}>
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
                {fileExtentions[row.data.type]}
              </Typography>
            </Tooltip>
          )}
          {row.data.of && (
            <Tooltip arrow placement="top" title="Official">
              <Icon
                style={{
                  fontSize: 16,
                  marginLeft: 4,
                  color: "#3f51b5",
                }}
              >
                verified
              </Icon>
            </Tooltip>
          )}
          {userPage && row.data.user === user.uid && (
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                setOpenDialog(["rename", index]);
              }}
            >
              <Icon>edit</Icon>
            </IconButton>
          )}
        </div>
      </TableCell>
      {!FileInspector && (
        <TableCell className="fet-collapsable-column-667">
          <div className="fet-chip-cell">
            {type === "files"
              ? Array(3)
                  .fill(0)
                  .map((e, i) => row.data.categ[i])
                  .map(
                    (chip, chipIndex) =>
                      (!isNaN(chip) || userPage) && (
                        <Chip
                          clickable={chipIndex !== 0}
                          onClick={(e) =>
                            !!userPage
                              ? setTagSelectionTarget([
                                  e.target,
                                  index,
                                  chipIndex,
                                ])
                              : setSearchTags([chip])
                          }
                          className={"file-tag-chip"}
                          label={isNaN(chip) ? "..." : fileTags[chip]}
                        />
                      )
                  )
              : (userPage || !isNaN(row.data.categ)) && (
                  <Chip
                    clickable
                    onClick={(e) =>
                      userPage
                        ? setTagSelectionTarget([e.target, index])
                        : setSearchTags([categories[row.data.categ]])
                    }
                    className={"file-tag-chip"}
                    label={
                      !isNaN(row.data.categ)
                        ? categories[row.data.categ]
                        : "..."
                    }
                  />
                )}
          </div>
        </TableCell>
      )}

      <>
        <TableCell style={{ width: 50 }} align="center">
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleLike(index);
            }}
          >
            <Icon color={liked ? "secondary" : "text.secondary"}>favorite</Icon>
            <Typography className="like-btn-label" variant="overline">
              {row.data.likes}
            </Typography>
          </IconButton>
        </TableCell>

        {type === "files" && (
          <>
            <TableCell className="fet-collapsable-column-800" align="center">
              <Typography variant="overline">
                {formatTime(row.data.dur)}
              </Typography>
            </TableCell>
            <TableCell align="center">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(row);
                }}
              >
                <Icon>file_download</Icon>
              </IconButton>
            </TableCell>
          </>
        )}
        {userPage && (
          <TableCell align="center">
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                setOpenDialog(["delete", index]);
              }}
            >
              <Icon>delete</Icon>
            </IconButton>
          </TableCell>
        )}
      </>
    </TableRow>
  );
}

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

function formatTime(a) {
  return a < 60 ? a.toFixed(2) + " s" : (a / 60).toFixed(2) + " min";
}

export default ListExplorerRow;

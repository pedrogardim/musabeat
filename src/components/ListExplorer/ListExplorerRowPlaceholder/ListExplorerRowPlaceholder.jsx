import React, { useState, useEffect } from "react";

import * as Tone from "tone";

import {
  TableCell,
  TableRow,
  IconButton,
  Typography,
  Chip,
  Icon,
} from "@mui/material";

import { Skeleton } from "@mui/material";

function ListExplorerRowPlaceholder(props) {
  const { fileEditor, explore, userPage, type } = props.explorerProps;

  return (
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
      {!fileEditor && (
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
      )}
      <>
        {explore && (
          <TableCell style={{ width: 50 }} align="center">
            <IconButton>
              <Icon>favorite</Icon>
            </IconButton>
          </TableCell>
        )}

        {type === "files" && (
          <>
            <TableCell className="fet-collapsable-column-800" align="center">
              <Typography variant="overline">
                <Skeleton variant="text" />
              </Typography>
            </TableCell>
            <TableCell align="center">
              <IconButton>
                <Icon>file_download</Icon>
              </IconButton>
            </TableCell>
          </>
        )}
        {userPage && (
          <TableCell align="center">
            <IconButton>
              <Icon>delete</Icon>
            </IconButton>
          </TableCell>
        )}
      </>
    </TableRow>
  );
}

export default ListExplorerRowPlaceholder;

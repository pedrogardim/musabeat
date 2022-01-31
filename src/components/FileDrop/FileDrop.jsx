import React from "react";

import { Typography, Box, Icon } from "@mui/material";

function FileDrop(props) {
  const { onClose, onDrop } = props;
  return (
    <Box
      onDragLeave={onClose}
      onDragOver={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onDrop(e.dataTransfer.files[0]);
        onClose();
      }}
      sx={{
        zIndex: 2,
        bgcolor: "#3f51b5",
        position: "absolute",
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirecction: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Icon>file_upload</Icon>
      <Typography variant="body1">Drop your files here!</Typography>
    </Box>
  );
}

export default FileDrop;

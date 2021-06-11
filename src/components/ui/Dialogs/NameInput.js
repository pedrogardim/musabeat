import React, { useState, useRef } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@material-ui/core";

function NameInput(props) {
  const inputRef = useRef(null);

  const handleSubmit = () => {
    let value = inputRef.current.children[0].children[0].value;
    props.onSubmit(value);
    props.onClose();
  };

  return (
    <Dialog open="true" onClose={props.onClose}>
      <DialogTitle>Insert new name</DialogTitle>
      <DialogContent>
        <TextField ref={inputRef}></TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button color="primary" onClick={handleSubmit}>
          Change Name
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default NameInput;

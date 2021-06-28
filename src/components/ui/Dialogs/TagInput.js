import React, { useState } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  DialogContentText,
  Input,
} from "@material-ui/core";

function TagInput(props) {
  const [tags, setTags] = useState("");

  const handleSubmit = () => {
    props.handleTagAdd(tags.split(" "));
    props.onClose();
  };

  return (
    <Dialog open="true" onClose={props.onClose}>
      <DialogTitle>Insert new name</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Insert the desidered tags separated by spaces
        </DialogContentText>
        <div className="break" />
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          autoFocus
          multiline
        ></Input>
      </DialogContent>

      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button color="primary" onClick={handleSubmit}>
          Submit tags
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TagInput;

import React, { useState } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  DialogContentText,
  Input,
  FormControl,
  InputLabel,
} from "@material-ui/core";

import "./SessionInfo.css";

function SessionInfo(props) {
  const [sessionName, setSessionName] = useState(props.sessionData.name);
  const [description, setDescription] = useState(props.sessionData.description);

  const [tags, setTags] = useState(
    props.sessionData.tags ? props.sessionData.tags.join(" ") : ""
  );

  const handleSubmit = () => {
    props.setSessionData((prev) => {
      let newSessionData = { ...prev };
      newSessionData.name = sessionName;
      newSessionData.description = description;
      newSessionData.tags = tags.split(" ");
      return newSessionData;
    });
    props.onClose();
  };

  return (
    <Dialog open="true" onClose={props.onClose}>
      <DialogTitle>Session Info</DialogTitle>
      <DialogContent className="session-info-dialog">
        <FormControl>
          <InputLabel labelFor="si1">Session Name</InputLabel>
          <Input
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            id="si1"
          ></Input>
        </FormControl>
        <div className="break" />
        <FormControl>
          <InputLabel labelFor="si2">Description</InputLabel>
          <Input
            value={description}
            rows={2}
            maxRows={6}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            id="si2"
          ></Input>
        </FormControl>
        <div className="break" />
        <FormControl>
          <InputLabel labelFor="si3">Tags</InputLabel>
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            multiline
            id="si3"
            name="AAAA"
          ></Input>
        </FormControl>
      </DialogContent>

      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button color="primary" onClick={handleSubmit}>
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SessionInfo;

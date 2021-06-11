import React, { useState, useRef } from "react";

import {
  Paper,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Select,
} from "@material-ui/core";

import { instrumentsCategories } from "../../../assets/musicutils";

function SavePatch(props) {
  const inputRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleSubmit = () => {
    let value = inputRef.current.children[0].children[0].value;
    props.onSubmit(value, selectedCategory);
  };

  const handleChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  return (
    <Dialog open="true" onClose={props.onClose}>
      <DialogTitle>Insert patch name</DialogTitle>
      <DialogContent>
        <TextField helperText={"Patch Name"} ref={inputRef}></TextField>
        <div className="break" style={{ height: 16 }} />
        <Select native onChange={handleChange} value={selectedCategory}>
          <option value={null}>No Category</option>
          {instrumentsCategories.map((e, i) => (
            <option key={"spd" + e} value={i}>
              {e}
            </option>
          ))}
        </Select>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button color="primary" onClick={handleSubmit}>
          Save patch
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SavePatch;
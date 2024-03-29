import React, { useState, useRef } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
} from "@mui/material";

import { useTranslation } from "react-i18next";

import {
  instrumentsCategories,
  drumCategories,
} from "../../../services/MiscData";

function SavePatch(props) {
  const { t } = useTranslation();

  const inputRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleSubmit = () => {
    let value = inputRef.current.children[0].children[0].value;
    props.onSubmit(value, parseInt(selectedCategory));
    props.onClose();
  };

  const handleChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>{t("dialogs.insertName")}</DialogTitle>
      <DialogContent>
        <TextField
          variant="standard"
          helperText={t("dialogs.patchName")}
          ref={inputRef}
        />
        <div className="break" style={{ height: 16 }} />
        <Select
          variant="standard"
          native
          onChange={handleChange}
          value={selectedCategory}
        >
          <option value={null}>{t("misc.noCategory")}</option>
          {props.isDrum
            ? drumCategories.map((e, i) => (
                <option key={"spd" + e} value={i}>
                  {t(`music.drumCategories.${i}`)}
                </option>
              ))
            : instrumentsCategories.map((e, i) => (
                <option key={"spd" + e} value={i}>
                  {t(`music.instrumentsCategories.${i}`)}
                </option>
              ))}
        </Select>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>{t("dialogs.cancel")}</Button>
        <Button color="primary" onClick={handleSubmit}>
          {t("dialogs.submit")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SavePatch;

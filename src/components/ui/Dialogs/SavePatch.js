import React, { useState, useRef } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
} from "@material-ui/core";

import { useTranslation } from "react-i18next";

import {
  instrumentsCategories,
  drumCategories,
} from "../../../assets/musicutils";

function SavePatch(props) {
  const { t } = useTranslation();

  const inputRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleSubmit = () => {
    let value = inputRef.current.children[0].children[0].value;
    props.onSubmit(value, parseInt(selectedCategory));
  };

  const handleChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  return (
    <Dialog open="true" onClose={props.onClose}>
      <DialogTitle>{t("dialogs.insertName")}</DialogTitle>
      <DialogContent>
        <TextField
          helperText={t("dialogs.patchName")}
          ref={inputRef}
        ></TextField>
        <div className="break" style={{ height: 16 }} />
        <Select native onChange={handleChange} value={selectedCategory}>
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
        <Button onClick={props.onClose}>{t("dialogs.canvel")}</Button>
        <Button color="primary" onClick={handleSubmit}>
          {t("dialogs.submit")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SavePatch;

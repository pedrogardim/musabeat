import React, { useRef } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";

import { useTranslation } from "react-i18next";

function NameInput(props) {
  const inputRef = useRef(null);
  const { t } = useTranslation();

  const handleSubmit = () => {
    let value = inputRef.current.children[0].children[0].value;
    props.onSubmit(value);
    props.onClose();
  };

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>{t("dialogs.insertName")}</DialogTitle>
      <DialogContent>
        <TextField
          variant="standard"
          defaultValue={props.defaultValue && props.defaultValue}
          ref={inputRef}
        />
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

export default NameInput;

import React, { useRef } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@material-ui/core";

import { labels } from "../../../assets/drumkits";

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
    <Dialog open="true" onClose={props.onClose}>
      <DialogTitle>{t("dialogs.insertName")}</DialogTitle>
      <DialogContent>
        <TextField ref={inputRef} />
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

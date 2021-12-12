import React, { useRef } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

import { labels } from "../../../assets/drumkits";

import { useTranslation } from "react-i18next";

function LimitReachedDialog(props) {
  const inputRef = useRef(null);
  const { t } = useTranslation();

  const handleSubmit = () => {
    let value = inputRef.current.children[0].children[0].value;
    props.onSubmit(value);
    props.onClose();
  };

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>{t("dialogs.limitReached")}</DialogTitle>
      <DialogContent>
        <Typography>
          {t(props.filePatch ? "dialogs.filePatchLimit" : "")}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>{t("dialogs.confirm")}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default LimitReachedDialog;

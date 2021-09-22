import React from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  Button,
} from "@material-ui/core";

import { useTranslation } from "react-i18next";

function ActionConfirm(props) {
  const { t } = useTranslation();

  const handleConfirm = () => {
    props.action();
    props.onClose();
  };
  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>{t("dialogs.areYouSure")}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {props.delete
            ? t("dialogs.irreversibleAction")
            : props.dupSession
            ? t("dialogs.dupSession")
            : props.unsavedChanges
            ? t("dialogs.unsavedChanges")
            : ""}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>{t("dialogs.cancel")}</Button>
        <Button
          color={props.delete ? "secondary" : "primary"}
          onClick={handleConfirm}
        >
          {props.delete ? t("dialogs.delete") : t("dialogs.confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ActionConfirm;

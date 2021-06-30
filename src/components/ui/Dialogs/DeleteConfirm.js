import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  Button,
} from "@material-ui/core";

import { useTranslation } from "react-i18next";

function DeleteConfirm(props) {
  const { t } = useTranslation();

  const handleConfirm = () => {
    props.action();
    props.onClose();
  };
  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>{t("dialogs.areYouSure")}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t("dialogs.irreversibleAction")}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>{t("dialogs.cancel")}</Button>
        <Button color="secondary" onClick={handleConfirm}>
          {t("dialogs.delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DeleteConfirm;

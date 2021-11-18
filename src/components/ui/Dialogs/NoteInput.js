import React, { useRef, useState, useEffect } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
} from "@material-ui/core";

import { labels } from "../../../assets/drumkits";
import { useTranslation } from "react-i18next";

import Keyboard from "../../Modules/ChordProgression/Keyboard";

function NoteInput(props) {
  const { t } = useTranslation();

  const [note, setNote] = useState(props.note);

  const handleSubmit = () => {
    props.onSubmit(note);
    props.onClose();
  };

  useEffect(() => {
    console.log(note);
  }, [note]);

  return (
    <Dialog
      fullWidth={true}
      maxWidth="lg"
      open={props.open}
      onClose={props.onClose}
    >
      <DialogTitle>{t("dialogs.insertNote")}</DialogTitle>
      <DialogContent
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="h5">{note}</Typography>
        <div className="break" style={{ height: 32 }} />
        <Keyboard color={2} onKeyClick={setNote} activeNotes={[note]} />
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

export default NoteInput;

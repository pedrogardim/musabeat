import React, { useState, useEffect } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

import * as Tone from "tone";

import { useTranslation } from "react-i18next";

import Keyboard from "../../Keyboard";

function NoteInput(props) {
  const { t } = useTranslation();

  const [note, setNote] = useState(props.note);

  const handleSubmit = () => {
    props.onSubmit(Tone.Frequency(note, "midi").toNote());
    props.onClose();
  };

  useEffect(() => {
    console.log(note, Tone.Frequency(note, "midi").toNote());
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
        <Typography variant="h4">
          {Tone.Frequency(note, "midi").toNote()}
        </Typography>
        <div className="break" style={{ height: 32 }} />
        <Keyboard
          color={2}
          onKeyClick={setNote}
          activeNotes={[note]}
          style={{ width: "100%", height: 64, flex: "1 0 64px" }}
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

export default NoteInput;

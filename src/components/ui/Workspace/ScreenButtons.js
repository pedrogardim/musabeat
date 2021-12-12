import React, { useState, Fragment, useEffect } from "react";
import { useSprings, animated } from "react-spring";

import "./ScreenButtons.css";

import {
  Fab,
  Icon,
  IconButton,
  Backdrop,
  Tooltip,
  Snackbar,
  Input,
  Paper,
  Fade,
  Button,
  Modal,
  Select,
  MenuItem,
} from "@mui/material";

function ScreenButtons(props) {
  const [open, setOpen] = useState(false);

  const HButtonsData = [
    {
      fn: () => {
        props.setIEOpen((prev) => !prev);
        setOpen(false);
      },
      icon: "piano",
      disabled: typeof props.selectedTrack !== "number",
    },
    {
      fn: () => props.setCursorMode((prev) => (!prev ? "edit" : null)),
      icon: props.cursorMode ? "edit" : "navigation",
      iconStyle: {
        transform: !props.cursorMode && "rotate(-45deg)",
      },
    },
  ];

  const VButtonsData = [
    {
      fn: () => {
        props.saveSession();
        setOpen(false);
      },
      icon: "save",
      disabled: !props.areUnsavedChanges,
    },
    {
      fn: () => {
        props.setFileListOpen((prev) => !prev);
        setOpen(false);
      },
      icon: "audio_file",
    },
  ];

  const AnimatedFab = animated(Fab);
  const VSprings = useSprings(
    2,
    Array.from(Array(2)).map((_, i) => ({
      bottom: open ? 16 + (56 + 16) * (i + 1) : 16,
      config: { tension: 300, friction: 13 },
    }))
  );
  const HSprings = useSprings(
    2,
    Array.from(Array(2)).map((_, i) => ({
      right: open ? 16 + (56 + 16) * (i + 1) : 16,
      config: { tension: 300, friction: 13 },
    }))
  );

  useEffect(() => {
    //open && HSprings.start();
  }, [open]);

  return (
    <>
      <Fab
        tabIndex={-1}
        color="primary"
        className="ws-fab-main"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Icon>{open ? "close" : "menu"}</Icon>
      </Fab>

      <Modal
        BackdropProps={{
          transitionDuration: 500,
        }}
        open={open}
        onClose={() => setOpen(false)}
      >
        <>
          {VSprings.map((sp, i) => (
            <AnimatedFab
              key={VButtonsData[i].id}
              onClick={VButtonsData[i].fn}
              color="primary"
              style={{ ...sp, position: "fixed", right: 16 }}
              disabled={HButtonsData[i].disabled}
            >
              <Icon>{VButtonsData[i].icon}</Icon>
            </AnimatedFab>
          ))}
          {HSprings.map((sp, i) => (
            <AnimatedFab
              key={"HButtons" + i}
              color="primary"
              style={{ ...sp, position: "fixed", bottom: 16 }}
              onClick={HButtonsData[i].fn}
              disabled={HButtonsData[i].disabled}
            >
              <Icon style={HButtonsData[i].iconStyle}>
                {HButtonsData[i].icon}
              </Icon>
            </AnimatedFab>
          ))}

          {/* <div
              style={{
                right: 80,
                position: "fixed",
                bottom: 16,
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Fab
                className="ws-fab-h"
                onClick={() =>
                  props.setCursorMode((prev) => (!prev ? "edit" : null))
                }
              >
                <Icon
                  style={{ transform: !props.cursorMode && "rotate(-45deg)" }}
                >
                  {props.cursorMode ? "edit" : "navigation"}
                </Icon>
              </Fab>
              <Fab
                className="ws-fab-h"
                onClick={() => props.setIEOpen((prev) => !prev)}
                color="primary"
              >
                <Icon>piano</Icon>
              </Fab>
            </div> */}
        </>
      </Modal>
    </>
  );
}

export default ScreenButtons;

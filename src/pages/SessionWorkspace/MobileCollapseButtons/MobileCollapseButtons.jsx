import React, { useContext } from "react";

import { Backdrop, Icon, Fab, Box } from "@mui/material";

import { useSpring, animated } from "react-spring";

import { SessionWorkspaceContext } from "../../../context/SessionWorkspaceContext";

function MobileCollapseButtons(props) {
  const { params, paramSetter } = useContext(SessionWorkspaceContext);

  const { expanded, selectedTrack } = params;

  const expSpring = useSpring({
    bottom: expanded.btn ? 16 : -10,
    right: expanded.btn ? 16 : selectedTrack !== null ? -58 : -10,
    config: { tension: 200, friction: 13 },
  });

  const AnimatedBox = animated(Box);

  return (
    <AnimatedBox
      onClick={(prev) =>
        !expanded.btn &&
        paramSetter("expanded", (prev) => ({ ...prev, btn: true }))
      }
      style={{ ...expSpring }}
      sx={(theme) => ({
        display: "none",
        position: "fixed",
        zIndex: 6,
        [theme.breakpoints.down("md")]: {
          display: "flex",
        },
      })}
    >
      <Backdrop
        open={expanded.btn}
        onClick={() =>
          paramSetter("expanded", (prev) => ({ ...prev, btn: false }))
        }
      />
      <Fab
        color={expanded.opt || !expanded.btn ? "primary" : "default"}
        onClick={() =>
          expanded.btn &&
          paramSetter("expanded", (prev) => ({
            ...prev,
            opt: !prev.opt,
            btn: false,
          }))
        }
        size={"small"}
      >
        <Icon>{expanded.btn ? "tune" : ""}</Icon>
      </Fab>
      {selectedTrack !== null && (
        <Fab
          color={expanded.instr ? "primary" : "default"}
          onClick={() =>
            expanded.btn &&
            paramSetter("expanded", (prev) => ({
              ...prev,
              instr: !prev.instr,
              btn: false,
            }))
          }
          size={"small"}
          sx={{ ml: 1 }}
        >
          <Icon>piano</Icon>
        </Fab>
      )}
    </AnimatedBox>
  );
}

export default MobileCollapseButtons;

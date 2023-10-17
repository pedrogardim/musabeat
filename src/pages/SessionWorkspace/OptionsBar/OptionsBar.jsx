import React, { useContext } from "react";

import { Icon, IconButton, Box, Divider } from "@mui/material";

import wsCtx from "../../../context/SessionWorkspaceContext";
import { generateRandomBeat } from "../../../services/Generators";

import NotificationsList from "../../../components/NotificationsList";
import Exporter from "../Exporter";

function OptionsBar(props) {
  const { params, paramSetter, tracks, sessionData, instruments, setTracks } =
    useContext(wsCtx);

  const { expanded, cursorMode, selectedTrack, openSubPage, trackOptions } =
    params;

  const { save, areUnsavedChanges, scheduleAllTracks } = props;

  return (
    <Box
      className="ws-options-btns"
      sx={(theme) => ({
        [theme.breakpoints.down("md")]: {
          position: !expanded.opt && "fixed",
          bottom: !expanded.opt && "-64px",
        },
      })}
    >
      <IconButton
        onClick={() =>
          paramSetter("cursorMode", (prev) => (!prev ? "edit" : null))
        }
      >
        <Icon style={{ transform: !cursorMode && "rotate(-45deg)" }}>
          {cursorMode ? "edit" : "navigation"}
        </Icon>
      </IconButton>
      <IconButton
        onClick={() =>
          paramSetter("openSubPage", (prev) =>
            prev === "mixer" ? null : "mixer"
          )
        }
      >
        <Icon style={{ transform: "rotate(90deg)" }}>tune</Icon>
      </IconButton>
      <IconButton
        disabled={!areUnsavedChanges}
        onClick={() => save(tracks, sessionData)}
      >
        <Icon>save</Icon>
      </IconButton>
      <Exporter
        sessionSize={sessionData.size}
        sessionData={sessionData}
        tracks={tracks}
        instruments={instruments}
        scheduleAllTracks={scheduleAllTracks}
      />

      {selectedTrack !== null && (
        <>
          <Divider orientation="vertical" flexItem />
          {tracks[selectedTrack].type !== 2 ? (
            <>
              <IconButton
                color={openSubPage === "IE" ? "primary" : "default"}
                onClick={() =>
                  paramSetter("openSubPage", (prev) =>
                    prev === "IE" ? null : "IE"
                  )
                }
              >
                <Icon>piano</Icon>
              </IconButton>
              {tracks[selectedTrack].type === 0 && (
                <>
                  <IconButton
                    onClick={() =>
                      paramSetter("trackOptions", (prev) => ({
                        ...prev,
                        showingAll: !prev.showingAll,
                      }))
                    }
                  >
                    <Icon>
                      {trackOptions.showingAll
                        ? "visibility_off"
                        : "visibility"}
                    </Icon>
                  </IconButton>
                  {/*  <IconButton
                    onClick={() => {
                      setTracks((prev) => {
                        let newTracks = [...prev];
                        newTracks[selectedTrack].score = generateRandomBeat(
                          4,
                          8,
                          [0, 2, 6],
                          0.5,
                          0
                        );
                        return newTracks;
                      });
                    }}
                  >
                    <Icon>casino</Icon>
                  </IconButton> */}
                </>
              )}
            </>
          ) : (
            <>
              <IconButton onClick={() => paramSetter("openDialog", "addFile")}>
                <Icon>add</Icon>
              </IconButton>
              <IconButton onClick={() => paramSetter("openDialog", "addFile")}>
                <Icon>queue_music</Icon>
              </IconButton>
            </>
          )}
          <IconButton
            color={openSubPage === "fx" ? "primary" : "default"}
            onClick={() =>
              paramSetter("openSubPage", (prev) =>
                prev === "fx" ? null : "fx"
              )
            }
          >
            <Icon>blur_on</Icon>
          </IconButton>
        </>
      )}
      <IconButton
        onClick={() =>
          paramSetter("expanded", (prev) => ({ ...prev, opt: false }))
        }
        sx={(theme) => ({
          display: "none",
          marginLeft: "auto",
          [theme.breakpoints.down("md")]: {
            display: "block",
          },
        })}
      >
        <Icon>close</Icon>
      </IconButton>
    </Box>
  );
}

export default OptionsBar;

import React, { useContext } from "react";
import * as Tone from "tone";

import { colors } from "../../../../utils/Pallete";

import wsCtx from "../../../../context/SessionWorkspaceContext";

function SamplerNote(props) {
  const { rowRef, note, index, ghost, gridPos, exists } = props;

  const { tracks, params } = useContext(wsCtx);

  const {
    trackRows,
    gridSize,
    selNotes,
    movingSelDelta,
    zoomPosition,
    selectedTrack,
  } = params;

  const isSelected =
    selNotes[selectedTrack] && selNotes[selectedTrack].includes(index);

  const track = tracks[selectedTrack];

  const attr = {
    parentHeight: rowRef.current.scrollHeight,
    parentWidth: rowRef.current.offsetWidth,
  };

  let zoomSize = zoomPosition[1] - zoomPosition[0] + 1;
  return (
    <div
      className="track-score-note"
      style={{
        height: attr.parentHeight / trackRows.length,
        width: 0,
        transform: ghost
          ? `translate(${
              gridPos[1] * (attr.parentWidth / (zoomSize * gridSize)) -
              zoomPosition[0] * (attr.parentWidth / zoomSize)
            }px,${gridPos[0] * (attr.parentHeight / trackRows.length)}px)`
          : `translate(${
              Tone.Time(note.time).toSeconds() *
                (attr.parentWidth / (zoomSize * Tone.Time("1m").toSeconds())) +
              ((isSelected && movingSelDelta ? movingSelDelta / gridSize : 0) -
                zoomPosition[0]) *
                (attr.parentWidth / zoomSize)
            }px,${
              trackRows.findIndex((e) => e.note === note.note) *
              (attr.parentHeight / trackRows.length)
            }px)`,
        opacity: ghost && 0.5,
      }}
    >
      <div
        style={{
          position: "absolute",
          height: 16,
          top: "calc(50% - 8px)",
          width: 16,
          left: -8,
          backgroundColor: colors[track.color][isSelected ? 800 : 300],
          filter: !exists && "saturate(0.2)",
          transform: "rotate(45deg)",
        }}
      />
    </div>
  );
}

export default SamplerNote;

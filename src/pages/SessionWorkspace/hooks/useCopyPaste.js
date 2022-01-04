import { useState, useContext, useEffect } from "react";

import * as Tone from "tone";

function useCopyPaste(ctx) {
  const [clipboard, setClipboard] = useState(null);

  const { params, setTracks, paramSetter } = ctx;

  const { selNotes, selection } = params;

  const handleCopy = () => {
    setClipboard({ cont: [...selNotes], sel: [...selection] });
  };

  const handlePaste = () => {
    console.log("paste");
    if (clipboard)
      setTracks((prev) =>
        prev.map((track, trackIndex) => ({
          ...track,
          score:
            params.selectedTrack === trackIndex || params.selectedTrack === null
              ? [
                  ...track.score,
                  ...clipboard.cont[trackIndex]
                    .map((index) => ({ ...track.score[index] }))
                    .map((note, i) => ({
                      //fn: console.log(note, i),
                      ...note,
                      time: Tone.Time(
                        Tone.Time(note.time).toSeconds() +
                          Tone.Transport.seconds -
                          (clipboard.sel[0] / params.gridSize) *
                            Tone.Time("1m").toSeconds()
                      ).toBarsBeatsSixteenths(),
                    })),
                ]
              : track.score,
        }))
      );

    paramSetter("selection", (prev) =>
      prev.map(
        (e) =>
          e +
          (Tone.Transport.seconds / Tone.Time("1m").toSeconds()) *
            params.gridSize
      )
    );
  };

  useEffect(() => console.log(clipboard), [clipboard]);

  return [handleCopy, handlePaste];
}

export default useCopyPaste;

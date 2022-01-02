export const deleteSelection = (ctx) => {
  const { setTracks, params, paramSetter } = ctx;

  if (!params.selection || params.selection.length < 0) return;
  setTracks((prev) =>
    prev.map((track, trackIndex) => ({
      ...track,
      score:
        params.selNotes[trackIndex] && params.selNotes[trackIndex].length > 0
          ? track.score.filter(
              (note, noteIndex) =>
                !params.selNotes[trackIndex].includes(noteIndex)
            )
          : track.score,
    }))
  );
  paramSetter("setNotes", []);
};

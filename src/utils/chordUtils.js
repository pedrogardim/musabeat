import { adaptSequencetoSubdiv } from "../assets/musicutils";

export const addChord = (direction, setChords, index, duration) => {
  duration > 0.25 &&
    setChords((prev) => {
      let newChords = [...prev];
      let currentChordIndex = index;
      let newChordIndex = direction ? currentChordIndex + 1 : currentChordIndex;

      let currentChordDuration = newChords[currentChordIndex].duration / 2;
      let currentChordRhythm = newChords[currentChordIndex].rhythm;

      let newChord = {
        notes: 0,
        duration: currentChordDuration,
        time: direction
          ? currentChordDuration + newChords[currentChordIndex].time
          : newChords[currentChordIndex].time,
        rhythm:
          currentChordRhythm.length > 1
            ? direction
              ? currentChordRhythm.slice(0, currentChordRhythm.length / 2 - 1)
              : currentChordRhythm.slice(
                  currentChordRhythm.length / 2,
                  currentChordRhythm.length
                )
            : [true],
      };

      let currentChord = {
        notes: newChords[currentChordIndex].notes,
        duration: currentChordDuration,
        time:
          newChords[currentChordIndex].time +
          (1 - direction) * currentChordDuration,
        rhythm:
          currentChordRhythm.length > 1
            ? !direction
              ? currentChordRhythm.slice(0, currentChordRhythm.length / 2 - 1)
              : currentChordRhythm.slice(
                  currentChordRhythm.length / 2,
                  currentChordRhythm.length
                )
            : [true],
      };

      newChords[currentChordIndex] = currentChord;
      newChords.splice(newChordIndex, 0, newChord);

      return newChords;
    });
};

export const removeChord = (setChords, index) => {
  setChords((prev) => {
    let chordIndex = index;
    let removedChordDuration = prev[chordIndex].duration;
    let moduleLength = Math.ceil(
      prev[prev.length - 1].duration + prev[prev.length - 1].time
    );
    let newChords = [...prev];

    console.log(moduleLength);

    if (newChords[chordIndex].duration === 1 && moduleLength > 1) {
      newChords[chordIndex].notes = 0;

      let ncCheckAll = newChords
        .filter((e, i) => i > chordIndex)
        .map((e) => (e.notes === 0 ? true : false));

      console.log(ncCheckAll);

      if (!ncCheckAll.includes(false)) {
        newChords = newChords.filter((e, i) => i < nearestPowerOf2(chordIndex));
      }
    } else if (
      chordIndex > 0 &&
      newChords[chordIndex - 1].duration === removedChordDuration &&
      Math.floor(newChords[chordIndex - 1].time) ===
        Math.floor(newChords[chordIndex].time)
    ) {
      //console.log("adding to previous chord");

      newChords[chordIndex - 1].duration += removedChordDuration;
      newChords[chordIndex - 1].rhythm = [
        ...newChords[chordIndex - 1].rhythm,
        ...newChords[chordIndex].rhythm,
      ];

      newChords[chordIndex - 1].rhythm = adaptSequencetoSubdiv(
        newChords[chordIndex - 1].rhythm,
        nearestPowerOf2(newChords[chordIndex - 1].rhythm.length)
      );

      newChords = newChords.filter((e, i) => i !== chordIndex);
    } else if (
      chordIndex < newChords.length - 1 &&
      newChords[chordIndex + 1].duration === removedChordDuration &&
      Math.floor(newChords[chordIndex + 1].time) ===
        Math.floor(newChords[chordIndex].time)
    ) {
      //console.log("adding to next chord");
      newChords[chordIndex + 1].duration += removedChordDuration;
      newChords[chordIndex + 1].time =
        newChords[chordIndex + 1].time - removedChordDuration;
      newChords[chordIndex + 1].rhythm = [
        ...newChords[chordIndex].rhythm,
        ...newChords[chordIndex + 1].rhythm,
      ];

      newChords[chordIndex - 1].rhythm = adaptSequencetoSubdiv(
        newChords[chordIndex - 1].rhythm,
        nearestPowerOf2(newChords[chordIndex - 1].rhythm.length)
      );

      newChords = newChords.filter((e, i) => i !== chordIndex);
    }

    console.log(newChords);
    return newChords;
  });
};

function nearestPowerOf2(n) {
  return 1 << (31 - Math.clz32(n));
}

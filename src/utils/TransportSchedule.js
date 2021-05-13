import * as Tone from "tone";

let scheduledEvents = [];

const clearEvents = (moduleId) => {
  typeof scheduledEvents[moduleId] !== "undefined" &&
    scheduledEvents[moduleId].length > 0 &&
    scheduledEvents[moduleId].forEach((event) => Tone.Transport.clear(event));
};

export const scheduleDrumSequence = (
  sequence,
  instrument,
  transport,
  updateBeat,
  updateMeasure,
  moduleId,
  sessionSize
) => {
  moduleId !== undefined && clearEvents(moduleId);

  let scheduledNotes = [];

  let moduleLength = sequence.length;
  let loopTimes = parseInt(sessionSize) / moduleLength;

  for (let x = 0; x < loopTimes; x++) {
    sequence.map((measure, measureIndex) => {
      measure.map((beat, beatIndex) => {
        let beattimevalue = Tone.Time("1m").toSeconds() / measure.length;
        let beatscheduletime =
          beattimevalue * beatIndex +
          Tone.Time("1m").toSeconds() * measureIndex +
          Tone.Time("1m").toSeconds() * x * moduleLength;

        let thisevent = transport.schedule((time) => {
          beat.forEach((note) => instrument.player(note).start(time));
          updateBeat(beatIndex);
          updateMeasure(measureIndex);
        }, beatscheduletime);
        scheduledNotes.push(thisevent);
      });
    });
  }

  scheduledEvents[moduleId] = scheduledNotes;
};

export const scheduleMelodyGrid = (
  sequence,
  instrument,
  transport,
  updateBeat,
  updateMeasure,
  moduleId,
  sessionSize
) => {
  moduleId !== undefined && clearEvents(moduleId);

  let scheduledNotes = [];

  let moduleLength = sequence.length;
  let loopTimes = parseInt(sessionSize) / moduleLength;

  for (let x = 0; x < loopTimes; x++) {
    sequence.map((measure, measureIndex) => {
      measure.map((beat, beatIndex) => {
        let beattimevalue = Tone.Time("1m").toSeconds() / measure.length;
        let beatscheduletime =
          beattimevalue * beatIndex +
          Tone.Time("1m").toSeconds() * measureIndex +
          Tone.Time("1m").toSeconds() * x * moduleLength;

        let thisevent = transport.schedule((time) => {
          beat.forEach((note) =>
            instrument.triggerAttackRelease(
              note,
              Tone.Time("1m").toSeconds() / sequence[measureIndex].length,
              time
            )
          );
          updateBeat(beatIndex);
          updateMeasure(measureIndex);
        }, beatscheduletime);
        scheduledNotes.push(thisevent);
      });
    });
  }
  scheduledEvents[moduleId] = scheduledNotes;
};

export const scheduleChordProgression = (
  chords,
  instrument,
  transport,
  updateChord,
  moduleId,
  sessionSize
) => {
  moduleId !== undefined && clearEvents(moduleId);

  let scheduledChords = [];

  let moduleLength = Math.ceil(chords[chords.length - 1].time);
  let loopTimes = parseInt(sessionSize) / moduleLength;

  console.log(sessionSize, moduleLength,loopTimes)

  for (let x = 0; x < loopTimes; x++) {
    chords.map((chord, chordIndex) => {
      let chordduration = Tone.Time("1m").toSeconds() * chord.duration;
      let chordtimetostart =
        Tone.Time("1m").toSeconds() * chord.time +
        Tone.Time("1m").toSeconds() * x * moduleLength;
      let rhythmduration = chordduration / chord.rhythm.length;

      chord.rhythm.map((rhythm, rhythmIndex) => {
        let rhythmscheduletime =
          rhythmduration * rhythmIndex + chordtimetostart;
        let thisevent = transport.schedule((time) => {
          switch (rhythm) {
            case 0:
              instrument.releaseAll(time);
              break;
            case 1:
              instrument.triggerAttackRelease(
                chord.notes,
                rhythmduration,
                time
              );
              //console.log(chord.notes);
              break;
          }

          //console.log(chord.notes);
          updateChord(chordIndex);
        }, rhythmscheduletime);
        scheduledChords.push(thisevent);
      });
    });
  }

  scheduledEvents[moduleId] = scheduledChords;
};

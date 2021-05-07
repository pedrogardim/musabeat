import * as Tone from "tone";

export const scheduleDrumSequence = (
  sequence,
  instrument,
  transport,
  previousEvents,
  updateBeat,
  updateMeasure
) => {
  previousEvents.length > 0 &&
    previousEvents.forEach((event) => transport.clear(event));

  let scheduledNotes = [];

  sequence.map((measure, measureIndex) => {
    measure.map((beat, beatIndex) => {
      let beattimevalue = Tone.Time("1m").toSeconds() / measure.length;
      let beatscheduletime =
        beattimevalue * beatIndex + Tone.Time("1m").toSeconds() * measureIndex;

      let thisevent = transport.schedule((time) => {
        beat.forEach((note) => instrument.player(note).start(time));
        updateBeat(beatIndex);
        updateMeasure(measureIndex);
      }, beatscheduletime);
      scheduledNotes.push(thisevent);
    });
  });

  return scheduledNotes;
};

export const scheduleChordProgression = (
  chords,
  instrument,
  transport,
  previousEvents,
  updateChord
) => {
  previousEvents.length > 0 &&
    previousEvents.forEach((event) => transport.clear(event));

  let scheduledChords = [];

  chords.map((chord, chordIndex) => {
    let chordduration = Tone.Time("1m").toSeconds() * chord.duration;
    let chordtimetostart = Tone.Time("1m").toSeconds() * chord.time;
    let rhythmduration = chordduration / chord.rhythm.length;

    chord.rhythm.map((rhythm, rhythmIndex) => {
      let rhythmscheduletime = rhythmduration * rhythmIndex + chordtimetostart;
      let thisevent = transport.schedule((time) => {
        switch (rhythm) {
          case 0:
            instrument.triggerRelease(time);
            break;
          case 1:
            instrument.triggerAttackRelease(chord.notes, rhythmduration, time);
            break;
        }

        //console.log(chord.notes);
        updateChord(chordIndex);
      }, rhythmscheduletime);
      scheduledChords.push(thisevent);
    });
  });
  return scheduledChords;
};

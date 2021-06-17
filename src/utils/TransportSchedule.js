import * as Tone from "tone";

let scheduledEvents = [];

export const clearEvents = (moduleId) => {
  if (moduleId === "all") {
    Tone.Transport.cancel(0);
    scheduledEvents = [];
  }

  typeof scheduledEvents[moduleId] !== "undefined" &&
    scheduledEvents[moduleId].length > 0 &&
    scheduledEvents[moduleId].forEach((event) => Tone.Transport.clear(event));
  delete scheduledEvents[moduleId];
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
          beat !== 0 &&
            beat.forEach(
              (note) =>
                instrument.has(note) && instrument.player(note).start(time)
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
          beat !== 0 &&
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
  updateRhythm,
  moduleId,
  sessionSize
) => {
  moduleId !== undefined && clearEvents(moduleId);

  let scheduledChords = [];

  let moduleLength = Math.ceil(chords[chords.length - 1].time + 0.01);
  let loopTimes = parseInt(sessionSize) / moduleLength;

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
                chord.notes !== 0 ? chord.notes : [],
                rhythmduration,
                time
              );
              //console.log(chord.notes);
              break;
          }

          //console.log(chord.notes);
          updateChord(chordIndex);
          updateRhythm(rhythmIndex);
        }, rhythmscheduletime);
        scheduledChords.push(thisevent);
      });
    });
  }

  scheduledEvents[moduleId] = scheduledChords;
  //console.log(scheduledEvents);
};

export const scheduleSamples = (
  score,
  instrument,
  cursorTime,
  transport,
  moduleId
) => {
  moduleId !== undefined && clearEvents(moduleId);

  let scheduledSounds = [];

  score.map((event, eventIndex) => {
    let isCursorinBetween =
      cursorTime > event.time && cursorTime < event.time + event.duration;

    let eventOffset = parseFloat(
      (isCursorinBetween ? cursorTime - event.time : 0).toFixed(3)
    );
    let eventTime = parseFloat(
      (isCursorinBetween ? cursorTime : event.time).toFixed(3)
    );

    console.log(eventTime, eventOffset);

    let thisevent = transport.schedule((time) => {
      instrument.start(time, eventOffset, event.duration);
    }, eventTime);
    scheduledSounds.push(thisevent);
  });

  scheduledEvents[moduleId] = scheduledSounds;
};

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
  //console.log("events cleared", moduleId);
};

export const scheduleDrumSequence = (
  sequence,
  instrument,
  transport,
  updateBeat,
  updateMeasure,
  moduleId,
  sessionSize,
  timeline,
  timelineMode
) => {
  moduleId !== undefined && clearEvents(moduleId);

  let scheduledNotes = [];

  let moduleLength = sequence.length;
  let loopTimes = parseInt(sessionSize) / moduleLength;
  if (!timelineMode) {
    for (let x = 0; x < loopTimes; x++) {
      sequence.forEach((measure, measureIndex) => {
        Object.values(measure).forEach((beat, beatIndex) => {
          let beattimevalue =
            Tone.Time("1m").toSeconds() / Object.keys(measure).length;
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
            //updateBeat(beatIndex);
            //updateMeasure(measureIndex);
          }, beatscheduletime);
          scheduledNotes.push(thisevent);
        });
      });
    }
  } else {
    timeline[moduleId].forEach((tlmeasure, index) => {
      sequence.forEach((measure, measureIndex) => {
        Object.values(measure).forEach((beat, beatIndex) => {
          let beattimevalue =
            Tone.Time("1m").toSeconds() / Object.keys(measure).length;
          let beatscheduletime =
            beattimevalue * beatIndex +
            Tone.Time("1m").toSeconds() * measureIndex +
            Tone.Time("1m").toSeconds() * tlmeasure;

          let thisevent = transport.schedule((time) => {
            beat !== 0 &&
              beat.forEach(
                (note) =>
                  instrument.has(note) && instrument.player(note).start(time)
              );
            //updateBeat(beatIndex);
            //updateMeasure(measureIndex);
          }, beatscheduletime);
          scheduledNotes.push(thisevent);
        });
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
  sessionSize,
  timeline,
  timelineMode
) => {
  moduleId !== undefined && clearEvents(moduleId);

  let scheduledNotes = [];

  let moduleLength = sequence.length;
  let loopTimes = parseInt(sessionSize) / moduleLength;

  if (!timelineMode) {
    for (let x = 0; x < loopTimes; x++) {
      sequence.forEach((measure, measureIndex) => {
        Object.values(measure).forEach((beat, beatIndex) => {
          let beattimevalue =
            Tone.Time("1m").toSeconds() / Object.keys(measure).length;
          let beatscheduletime =
            beattimevalue * beatIndex +
            Tone.Time("1m").toSeconds() * measureIndex +
            Tone.Time("1m").toSeconds() * x * moduleLength;

          let thisevent = transport.schedule((time) => {
            beat !== 0 &&
              beat.forEach((note) =>
                instrument.triggerAttackRelease(
                  note,
                  Tone.Time("1m").toSeconds() / Object.keys(measure).length,
                  time
                )
              );
            //updateBeat(beatIndex);
            //updateMeasure(measureIndex);
            //console.log(beatIndex, measureIndex);
          }, beatscheduletime);
          scheduledNotes.push(thisevent);
        });
      });
    }
  } else {
    timeline[moduleId].forEach((tlmeasure, index) => {
      sequence.forEach((measure, measureIndex) => {
        Object.values(measure).forEach((beat, beatIndex) => {
          let beattimevalue =
            Tone.Time("1m").toSeconds() / Object.keys(measure).length;
          let beatscheduletime =
            beattimevalue * beatIndex +
            Tone.Time("1m").toSeconds() * measureIndex +
            Tone.Time("1m").toSeconds() * tlmeasure;

          let thisevent = transport.schedule((time) => {
            beat !== 0 &&
              beat.forEach((note) =>
                instrument.triggerAttackRelease(
                  note,
                  Tone.Time("1m").toSeconds() / Object.keys(measure).length,
                  time
                )
              );
            //updateBeat(beatIndex);
            //updateMeasure(measureIndex);
          }, beatscheduletime);
          scheduledNotes.push(thisevent);
        });
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
  sessionSize,
  timeline,
  timelineMode
) => {
  moduleId !== undefined && clearEvents(moduleId);

  let scheduledChords = [];

  let moduleLength = Math.ceil(chords[chords.length - 1].time + 0.01);
  let loopTimes = parseInt(sessionSize) / moduleLength;

  if (!timelineMode) {
    for (let x = 0; x < loopTimes; x++) {
      chords.forEach((chord, chordIndex) => {
        let chordduration = Tone.Time("1m").toSeconds() * chord.duration;
        let chordtimetostart =
          Tone.Time("1m").toSeconds() * chord.time +
          Tone.Time("1m").toSeconds() * x * moduleLength;
        let rhythmduration = chordduration / chord.rhythm.length;

        chord.rhythm.forEach((rhythm, rhythmIndex) => {
          let rhythmscheduletime =
            rhythmduration * rhythmIndex + chordtimetostart;
          let thisevent = transport.schedule((time) => {
            if (typeof rhythm === "number") {
              instrument.triggerAttackRelease(
                chord.notes !== 0
                  ? chord.notes[rhythm % chord.notes.length]
                  : [],
                rhythmduration,
                time
              );
            } else if (rhythm === true) {
              instrument.triggerAttackRelease(
                chord.notes !== 0 ? chord.notes : [],
                rhythmduration,
                time
              );
            } else {
              instrument.releaseAll(time);
            }

            //console.log(chord.notes);
            //updateChord(chordIndex);
            //updateRhythm(rhythmIndex);
          }, rhythmscheduletime);
          scheduledChords.push(thisevent);
        });
      });
    }
  } else {
    timeline[moduleId].forEach((measure, index) => {
      chords.forEach((chord, chordIndex) => {
        let chordduration = Tone.Time("1m").toSeconds() * chord.duration;
        let chordtimetostart =
          Tone.Time("1m").toSeconds() * chord.time +
          Tone.Time("1m").toSeconds() * measure;
        let rhythmduration = chordduration / chord.rhythm.length;

        chord.rhythm.forEach((rhythm, rhythmIndex) => {
          let rhythmscheduletime =
            rhythmduration * rhythmIndex + chordtimetostart;
          let thisevent = transport.schedule((time) => {
            if (typeof rhythm === "number") {
              instrument.triggerAttackRelease(
                chord.notes !== 0
                  ? chord.notes[rhythm % chord.notes.length]
                  : [],
                rhythmduration,
                time
              );
            } else if (rhythm === true) {
              instrument.triggerAttackRelease(
                chord.notes !== 0 ? chord.notes : [],
                rhythmduration,
                time
              );
            } else {
              instrument.releaseAll(time);
            }

            //console.log(chord.notes);
            //updateChord(chordIndex);
            //updateRhythm(rhythmIndex);
          }, rhythmscheduletime);
          scheduledChords.push(thisevent);
        });
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
  moduleId,
  moduleSize,
  sessionSize,
  timeline,
  timelineMode
) => {
  moduleId !== undefined && clearEvents(moduleId);

  let scheduledSounds = [];

  let loopTimes = parseInt(sessionSize) / moduleSize;

  if (!timelineMode) {
    for (let x = 0; x < loopTimes; x++) {
      score.forEach((event, eventIndex) => {
        let scoreTime = Tone.Time(event.time).toSeconds();

        let isCursorinBetween =
          cursorTime > scoreTime && cursorTime < scoreTime + event.duration;

        let eventOffset = parseFloat(
          (isCursorinBetween ? cursorTime - scoreTime : 0).toFixed(3)
        );
        let eventTime = parseFloat(
          (isCursorinBetween ? cursorTime : scoreTime).toFixed(3)
        );

        //console.log(eventTime, eventOffset);

        let thisevent = transport.schedule((time) => {
          instrument.start(
            time + Tone.Time("1m").toSeconds() * x,
            eventOffset,
            event.duration
          );
        }, eventTime);
        scheduledSounds.push(thisevent);
      });
    }
  } else {
    timeline[moduleId].forEach((measure, index) => {
      score.forEach((event, eventIndex) => {
        let scoreTime = Tone.Time(event.time).toSeconds();

        let isCursorinBetween =
          cursorTime > scoreTime && cursorTime < scoreTime + event.duration;

        let eventOffset = parseFloat(
          (isCursorinBetween ? cursorTime - scoreTime : 0).toFixed(3)
        );
        let eventTime = parseFloat(
          (isCursorinBetween ? cursorTime : scoreTime).toFixed(3)
        );

        //console.log(eventTime, eventOffset);

        let thisevent = transport.schedule((time) => {
          instrument.start(
            time + Tone.Time("1m").toSeconds() * measure,
            eventOffset,
            event.duration
          );
        }, eventTime);
        scheduledSounds.push(thisevent);
      });
    });
  }

  scheduledEvents[moduleId] = scheduledSounds;
};

export const schedulePianoRoll = (
  score,
  instrument,
  transport,
  moduleId,
  moduleSize,
  sessionSize,
  timeline,
  timelineMode
) => {
  //console.log("PR Scheduled");
  moduleId !== undefined && clearEvents(moduleId);

  let scheduledNotes = [];

  let loopTimes = parseInt(sessionSize) / moduleSize;

  if (!timelineMode) {
    for (let x = 0; x < loopTimes; x++) {
      score.forEach((e, i) => {
        let event = transport.schedule((time) => {
          instrument.triggerAttackRelease(e.note, e.duration, time, e.velocity);
        }, Tone.Time(e.time).toSeconds() + Tone.Time("1m").toSeconds() * moduleSize * x);
        scheduledNotes.push(event);
      });
    }
  } else {
    timeline[moduleId].forEach((measure, index) => {
      score.forEach((e, i) => {
        let event = transport.schedule((time) => {
          instrument.triggerAttackRelease(e.note, e.duration, time, e.velocity);
        }, Tone.Time(e.time).toSeconds() + Tone.Time("1m").toSeconds() * measure);
        scheduledNotes.push(event);
      });
    });
  }

  scheduledEvents[moduleId] = scheduledNotes;
};

/* ================================================================= */

export const scheduleSampler = (score, instrument, transport, moduleId) => {
  moduleId !== undefined && clearEvents(moduleId);

  //console.log("instrument", instrument);

  let scheduledNotes = [];

  //console.log("scheduled", moduleId);

  score.forEach((e, i) => {
    let event = transport.schedule((time) => {
      instrument.has(e.note) &&
        instrument
          .player(e.note)
          .stop(time)
          .start(time)
          .stop(time + Tone.Time(e.duration).toSeconds());
    }, e.time);
    scheduledNotes.push(event);
  });

  scheduledEvents[moduleId] = scheduledNotes;
};

/* ================================================================= */

export const scheduleMelody = (score, instrument, transport, moduleId) => {
  moduleId !== undefined && clearEvents(moduleId);

  //console.log("instrument", instrument);

  let scheduledNotes = [];

  //console.log("scheduled", moduleId);

  score.forEach((e, i) => {
    let event = transport.schedule((time) => {
      instrument.triggerAttackRelease(
        Tone.Frequency(e.note, "midi").toNote(),
        e.duration,
        time
      );
      console.log(e, "scheduled");
    }, e.time);
    scheduledNotes.push(event);
  });

  scheduledEvents[moduleId] = scheduledNotes;
};

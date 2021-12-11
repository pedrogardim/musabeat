import * as Tone from "tone";

let scheduledEvents = [];

export const clearEvents = (trackId) => {
  if (trackId === "all") {
    Tone.Transport.cancel(0);
    scheduledEvents = [];
  }

  typeof scheduledEvents[trackId] !== "undefined" &&
    scheduledEvents[trackId].length > 0 &&
    scheduledEvents[trackId].forEach((event) => Tone.Transport.clear(event));
  delete scheduledEvents[trackId];
  //console.log("events cleared", trackId);
};

/* ================================================================= */

export const scheduleSampler = (score, instrument, transport, trackId) => {
  trackId !== undefined && clearEvents(trackId);

  //console.log("instrument", instrument);

  let scheduledNotes = [];

  //console.log("scheduled", trackId);

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

  scheduledEvents[trackId] = scheduledNotes;
};

/* ================================================================= */

export const scheduleMelody = (score, instrument, transport, trackId) => {
  trackId !== undefined && clearEvents(trackId);

  //console.log("instrument", instrument);

  let scheduledNotes = [];

  //console.log("scheduled", trackId);

  score.forEach((e, i) => {
    let event = transport.schedule((time) => {
      instrument.triggerAttackRelease(
        Tone.Frequency(e.note, "midi").toNote(),
        e.duration,
        time
      );
    }, e.time);
    scheduledNotes.push(event);
  });

  scheduledEvents[trackId] = scheduledNotes;
};

/* ==============================*/

export const scheduleAudioTrack = (score, players, transport, trackId) => {
  trackId !== undefined && clearEvents(trackId);

  let scheduledSounds = [];

  //console.log("scheduled");

  let cursorTime = transport.seconds;

  score.forEach((event, eventIndex) => {
    let scoreTime = Tone.Time(event.time).toSeconds();

    let isCursorinBetween =
      cursorTime > scoreTime && cursorTime < scoreTime + event.duration;

    let eventOffset =
      parseFloat((isCursorinBetween ? cursorTime - scoreTime : 0).toFixed(3)) +
      event.offset;
    let eventTime = parseFloat(
      (isCursorinBetween ? cursorTime : scoreTime).toFixed(3)
    );

    //console.log(eventTime, eventOffset);

    let thisevent = transport.schedule((time) => {
      players.player(event.clip).start(time, eventOffset, event.duration);
    }, eventTime);
    scheduledSounds.push(thisevent);
  });

  scheduledEvents[trackId] = scheduledSounds;
};

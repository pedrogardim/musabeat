import {
  scheduleSampler,
  scheduleMelody,
  scheduleAudioTrack,
} from "../services/Schedule";

import { loadInstrument, loadEffect } from "../../../services/Instruments";

import { encodeAudioFile } from "../../../services/Audio";

import * as Tone from "tone";

export const bounceSessionExport = async (
  tracks,
  instruments,
  sessionData,
  setIsReady,
  setExportProgress,
  sessionSize,
  timeline,
  timelineMode,
  forceReschedule,
  format
) => {
  //var exportDuration = looprepeats * (60/sessionbpm) * 4 * props.length;

  setIsReady(false);

  let exportDuration = sessionSize * Tone.Time("1m").toSeconds();

  let instrumentBuffers = tracks.map((track, i) =>
    instruments[i].name === "Players" || instruments[i].name === "Sampler"
      ? instruments[i]._buffers
      : instruments[i].name === "Player"
      ? instruments[i]._buffer
      : instruments[i].name === "GrainPlayer"
      ? instruments[i].buffer
      : ""
  );

  let offlineInstruments = [];
  let offlineEffects = [];
  let offlineContext;
  let offlineLimiter;

  Tone.Offline(({ transport }) => {
    offlineLimiter = new Tone.Limiter(0).toDestination();

    offlineContext = transport.context;

    transport.bpm.value = sessionData.bpm;

    tracks.map((track, trackIndex) => {
      let originalInstrument = instruments[trackIndex];
      offlineEffects[trackIndex] = track.fx
        ? track.fx.map((e) => (!!e ? loadEffect(e.type, e.options) : false))
        : [];

      if (!track.muted) {
        switch (track.type) {
          case 0:
            offlineInstruments[trackIndex] = new Tone.Players();
            offlineInstruments[trackIndex]._buffers =
              instrumentBuffers[trackIndex];
            offlineInstruments[trackIndex].volume.value = track.volume;

            /* scheduleSampler(
              track.score,
              offlineInstruments[trackIndex],
              transport,
              track.id,
              sessionSize
            ); */
            break;
          case 1:
            if (originalInstrument.name === "Sampler") {
              offlineInstruments[trackIndex] = new Tone.Sampler();
              offlineInstruments[trackIndex].set(originalInstrument.get());
              offlineInstruments[trackIndex]._buffers =
                instrumentBuffers[trackIndex];
            } else {
              /* offlineInstruments[trackIndex] = loadInstrument(
                originalInstrument.get()
              );*/
            }
            offlineInstruments[trackIndex].volume.value = track.volume;

            scheduleMelody(
              track.score,
              offlineInstruments[trackIndex],
              transport,
              track.id
            );
            break;
          case 2:
            offlineInstruments[trackIndex] = new Tone.Players();
            offlineInstruments[trackIndex]._buffers =
              instrumentBuffers[trackIndex];
            offlineInstruments[trackIndex].volume.value = track.volume;

            /* scheduleAudioTrack(
              track.score,
              offlineInstruments[trackIndex],
              transport,
              track.id
            ); */
            break;
        }
        offlineInstruments[trackIndex].chain(
          ...offlineEffects[trackIndex].filter((e) => e !== false),
          offlineLimiter
        );
      }
    });

    transport.scheduleRepeat(() => {
      setExportProgress(
        (transport.seconds / (Tone.Time("1m").toSeconds() * sessionSize)) * 100
      );
    }, "1m");

    transport.start();
  }, exportDuration).then((e) => {
    //let blob = new Blob([audioBufferToWav(e)], { type: "audio/wav" });
    let blob = encodeAudioFile(e, format);
    //console.log(blob);

    //let promiseB = blob.then(function(result) {
    let url = window.URL.createObjectURL(blob);
    downloadURI(url, `${sessionData.name}.${format.toLowerCase()}`);
    forceReschedule();
    setIsReady(true);

    offlineInstruments.map((e) => e && e.dispose());
    offlineEffects.map((me) => me.map((e) => e && e.dispose()));
    offlineLimiter.dispose();
    offlineContext.close();
    offlineContext.dispose();

    //});
  });
};

const downloadURI = (uri, name) => {
  var link = document.createElement("a");
  link.download = name;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  //delete link;
};

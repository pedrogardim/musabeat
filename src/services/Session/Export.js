import {
  scheduleSampler,
  scheduleMelody,
  scheduleAudioTrack,
} from "../Session/Schedule";

//import { loadEffect } from "../Instruments";

import { encodeAudioFile } from "../Audio";

import * as Tone from "tone";

export const bounceSessionExport = async (
  tracks,
  instruments,
  sessionData,
  setIsReady,
  setExportProgress,
  format,
  scheduleAllTracks
) => {
  //var exportDuration = looprepeats * (60/sessionbpm) * 4 * props.length;

  setIsReady(false);

  let sessionSize = sessionData.size;

  let exportDuration = sessionSize * Tone.Time("1m").toSeconds();

  let instrumentBuffers = instruments.map(
    (instr, i) =>
      (instr.name === "Players" || instr.name === "Sampler") &&
      instr._buffers._buffers
  );

  console.log(instrumentBuffers);

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
      offlineEffects[trackIndex] = /* track.fx
        ? track.fx.map((e) => (!!e ? loadEffect(e.type, e.options) : false))
        : */ [];

      if (!track.muted) {
        switch (track.type) {
          case 0:
            offlineInstruments[trackIndex] = new Tone.Players();
            instrumentBuffers[trackIndex].forEach((val, key) =>
              offlineInstruments[trackIndex].add(
                key,
                new Tone.ToneAudioBuffer(val)
              )
            );
            offlineInstruments[trackIndex].volume.value = track.volume;

            scheduleSampler(
              track.score,
              offlineInstruments[trackIndex],
              transport,
              track.id,
              sessionSize
            );
            break;
          case 1:
            if (originalInstrument.name === "Sampler") {
              offlineInstruments[trackIndex] = new Tone.Sampler();
              offlineInstruments[trackIndex].set(originalInstrument.get());
              instrumentBuffers[trackIndex].forEach((val, key) =>
                offlineInstruments[trackIndex].add(
                  key,
                  new Tone.ToneAudioBuffer(val)
                )
              );
            } else {
              offlineInstruments[trackIndex] = new Tone[
                originalInstrument.name
              ](originalInstrument.get()).toDestination();
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
            instrumentBuffers[trackIndex].forEach((val, key) =>
              offlineInstruments[trackIndex].add(
                key,
                new Tone.ToneAudioBuffer(val)
              )
            );
            offlineInstruments[trackIndex].volume.value = track.volume;

            scheduleAudioTrack(
              track.score,
              offlineInstruments[trackIndex],
              transport,
              track.id
            );
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
    downloadURI(
      url,
      `${
        sessionData.name ? sessionData.name : "Bounce"
      }.${format.toLowerCase()}`
    );
    scheduleAllTracks && scheduleAllTracks();
    setIsReady(true);

    offlineInstruments.map((e) => e.dispose());
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

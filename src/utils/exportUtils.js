import {
  scheduleDrumSequence,
  scheduleChordProgression,
  scheduleMelodyGrid,
  scheduleSamples,
  schedulePianoRoll,
} from "./TransportSchedule";
import { audioBufferToWav } from "audiobuffer-to-wav";

import {
  loadSynthFromGetObject,
  loadEffect,
  encodeAudioFile,
} from "../assets/musicutils";

import * as Tone from "tone";

export const bounceSessionExport = async (
  modules,
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

  let exportDuration = Tone.Transport.loopEnd;

  let instrumentBuffers = modules.map((module, i) =>
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

    modules.map((module, moduleIndex) => {
      let originalInstrument = instruments[moduleIndex];
      offlineEffects[moduleIndex] = module.fx
        ? module.fx.map((e) => (!!e ? loadEffect(e.type, e.options) : false))
        : [];

      if (!module.muted) {
        switch (module.type) {
          case 0:
            offlineInstruments[moduleIndex] = new Tone.Players();
            offlineInstruments[moduleIndex]._buffers =
              instrumentBuffers[moduleIndex];
            offlineInstruments[moduleIndex].volume.value = module.volume;

            scheduleDrumSequence(
              module.score,
              offlineInstruments[moduleIndex],
              transport,
              () => {},
              () => {},
              module.id,
              sessionSize,
              timeline,
              timelineMode
            );
            break;
          case 1:
            if (originalInstrument.name === "Sampler") {
              offlineInstruments[moduleIndex] = new Tone.Sampler();
              offlineInstruments[moduleIndex].set(originalInstrument.get());
              offlineInstruments[moduleIndex]._buffers =
                instrumentBuffers[moduleIndex];
            } else {
              offlineInstruments[moduleIndex] = loadSynthFromGetObject(
                originalInstrument.get()
              );
            }
            offlineInstruments[moduleIndex].volume.value = module.volume;

            scheduleMelodyGrid(
              module.score,
              offlineInstruments[moduleIndex],
              transport,
              () => {},
              () => {},
              module.id,
              sessionSize,
              timeline,
              timelineMode
            );
            break;
          case 2:
            if (originalInstrument.name === "Sampler") {
              offlineInstruments[moduleIndex] = new Tone.Sampler();
              offlineInstruments[moduleIndex].set(originalInstrument.get());
              offlineInstruments[moduleIndex]._buffers =
                instrumentBuffers[moduleIndex];
            } else {
              offlineInstruments[moduleIndex] = loadSynthFromGetObject(
                originalInstrument.get()
              );
            }
            offlineInstruments[moduleIndex].volume.value = module.volume;

            scheduleChordProgression(
              module.score,
              offlineInstruments[moduleIndex],
              transport,
              () => {},
              () => {},
              module.id,
              sessionSize,
              timeline,
              timelineMode
            );
            break;
          case 3:
            offlineInstruments[moduleIndex] = new Tone.GrainPlayer(
              instrumentBuffers[moduleIndex]
            );
            offlineInstruments[moduleIndex].volume.value = module.volume;

            scheduleSamples(
              module.score,
              offlineInstruments[moduleIndex],
              0,
              transport,
              module.id
            );
            break;
          case 4:
            if (originalInstrument.name === "Sampler") {
              offlineInstruments[moduleIndex] = new Tone.Sampler();
              offlineInstruments[moduleIndex].set(originalInstrument.get());
              offlineInstruments[moduleIndex]._buffers =
                instrumentBuffers[moduleIndex];
            } else {
              offlineInstruments[moduleIndex] = loadSynthFromGetObject(
                originalInstrument.get()
              );
            }
            offlineInstruments[moduleIndex].volume.value = module.volume;

            schedulePianoRoll(
              module.score,
              offlineInstruments[moduleIndex],
              transport,
              module.id,
              module.size,
              sessionSize,
              timeline,
              timelineMode
            );
            break;
        }
        offlineInstruments[moduleIndex].chain(
          ...offlineEffects[moduleIndex].filter((e) => e !== false),
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

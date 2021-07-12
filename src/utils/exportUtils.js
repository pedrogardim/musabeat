import {
  scheduleDrumSequence,
  scheduleChordProgression,
  scheduleMelodyGrid,
  scheduleSamples,
} from "./TransportSchedule";
import { audioBufferToWav } from "audiobuffer-to-wav";

import { loadSynthFromGetObject, loadEffect } from "../assets/musicutils";
import * as Tone from "tone";

export const bounceSessionExport = async (
  modules,
  instruments,
  sessionData,
  setIsReady,
  sessionSize
) => {
  //var exportDuration = looprepeats * (60/sessionbpm) * 4 * props.length;
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

  Tone.Offline(({ transport }) => {
    //console.log(transport);
    let offlineLimiter = new Tone.Limiter(0).toDestination();

    transport.bpm.value = sessionData.bpm;

    modules.map((module, moduleIndex) => {
      let originalInstrument = instruments[moduleIndex];
      let thisinstrument;
      let effects = module.fx.map((e) =>
        !!e ? loadEffect(e.type, e.options) : false
      );

      if (!module.muted) {
        switch (module.type) {
          case 0:
            thisinstrument = new Tone.Players();
            thisinstrument._buffers = instrumentBuffers[moduleIndex];
            thisinstrument.volume.value = module.volume;

            scheduleDrumSequence(
              module.score,
              thisinstrument,
              transport,
              () => {},
              () => {},
              "",
              sessionSize
            );
            break;
          case 1:
            thisinstrument = loadSynthFromGetObject(originalInstrument.get());
            thisinstrument.volume.value = module.volume;

            scheduleMelodyGrid(
              module.score,
              thisinstrument,
              transport,
              () => {},
              () => {},
              "",
              sessionSize
            );
            break;
          case 2:
            thisinstrument = loadSynthFromGetObject(originalInstrument.get());
            thisinstrument.volume.value = module.volume;

            scheduleChordProgression(
              module.score,
              thisinstrument,
              transport,
              () => {},
              () => {},
              "",
              sessionSize
            );
            break;
          case 3:
            thisinstrument = new Tone.GrainPlayer(
              instrumentBuffers[moduleIndex]
            );
            thisinstrument.volume.value = module.volume;

            scheduleSamples(module.score, thisinstrument, 0, transport, "");
            break;
        }
        thisinstrument.chain(
          ...effects.filter((e) => e !== false),
          offlineLimiter
        );
      }
    });

    transport.start();
  }, exportDuration).then((e) => {
    let blob = new Blob([audioBufferToWav(e)], { type: "audio/wav" });
    //console.log(blob);

    //let promiseB = blob.then(function(result) {
    let url = window.URL.createObjectURL(blob);
    downloadURI(url, `${sessionData.name}.wav`);
    setIsReady(true);

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

import {
  scheduleDrumSequence,
  scheduleChordProgression,
  scheduleMelodyGrid,
  scheduleSamples
} from "./TransportSchedule";
import { audioBufferToWav } from "audiobuffer-to-wav";

import * as MusicUtils from "../assets/musicutils";
import * as Tone from "tone";
import { useRadioGroup } from "@material-ui/core";

export const bounceSessionExport = (
  modules,
  sessionData,
  setIsReady,
  sessionSize
) => {
  //var exportDuration = looprepeats * (60/sessionbpm) * 4 * props.length;
  let exportDuration = Tone.Time("1m").toSeconds() * 2;

  let instrumentBuffers = modules.map((module, i) =>
    module.instrument.name === "Players" || module.instrument.name === "Sampler"
      ? module.instrument._buffers
      : module.instrument.name === "Player"
      ? module.instrument._buffer
      : ""
  );

  //console.log(instrumentBuffers);

  Tone.Offline(({ transport }) => {
    //console.log(transport);
    //let offlineLimiter = new Tone.Limiter(-3).toDestination();

    transport.bpm.value = sessionData.bpm;

    modules.map((module, moduleIndex) => {
      let thisinstrument = MusicUtils.instrumentContructor(
        module.instrument.get()
      );
      if (module.instrument.name == "Sampler") {
        thisinstrument = new Tone.Sampler().toDestination();
        thisinstrument._buffers = instrumentBuffers[moduleIndex];
      }

      switch (module.type) {
        case 0:
          thisinstrument = new Tone.Players().toDestination();
          thisinstrument._buffers = instrumentBuffers[moduleIndex];

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
          scheduleChordProgression(
            module.chords,
            thisinstrument,
            transport,
            () => {},
            "",
            sessionSize
          );
          break;
          case 3:
            thisinstrument = new Tone.GrainPlayer(module.instrument.buffer).toDestination()
            scheduleSamples(
            module.score,
            thisinstrument,
            transport,
            ""
          );
          break;
      }
    });

    transport.start();
  }, exportDuration).then((e) => {
    let blob = new Blob([audioBufferToWav(e)], { type: "audio/wav" });
    //console.log(blob);

    //let promiseB = blob.then(function(result) {
    let url = window.URL.createObjectURL(blob);
    downloadURI(url, "Session.wav");
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

import {
  scheduleDrumSequence,
  scheduleChordProgression,
  scheduleMelodyGrid,
  scheduleSamples
} from "./TransportSchedule";
import { audioBufferToWav } from "audiobuffer-to-wav";

import { loadSynthFromGetObject} from "../assets/musicutils";
import * as Tone from "tone";

export const bounceSessionExport = async (
  modules,
  instruments,
  sessionData,
  setIsReady,
  sessionSize
) => {
  //var exportDuration = looprepeats * (60/sessionbpm) * 4 * props.length;
   let exportDuration = Tone.Time("1m").toSeconds() * 2;

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
    //let offlineLimiter = new Tone.Limiter(-3).toDestination();

    transport.bpm.value = sessionData.bpm;

    modules.map((module, moduleIndex) => {
      let originalInstrument = instruments[moduleIndex];
      let thisinstrument; 
      
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
          thisinstrument = loadSynthFromGetObject(originalInstrument.get()); 

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
            thisinstrument = new Tone.GrainPlayer(instrumentBuffers[moduleIndex]).toDestination()
            scheduleSamples(
            module.score,
            thisinstrument,
            0,
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

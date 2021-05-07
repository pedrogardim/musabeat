import {
  scheduleDrumSequence,
  scheduleChordProgression,
} from "./TransportSchedule";
import { audioBufferToWav } from "audiobuffer-to-wav";

import * as MusicUtils from "../assets/musicutils";
import * as Tone from "tone";

export const bounceSessionExport = (modules, sessionData, setIsReady) => {
  //var exportDuration = looprepeats * (60/sessionbpm) * 4 * props.length;
  let exportDuration = 2;

  let instrumentBuffers = modules.map((module, i) => 
   (module.instrument.name == "Players" || module.instrument.name == "Sampler")
      ? module.instrument._buffers
      : module.instrument.name == "Player"
      ? module.instrument._buffer
      : ""
  );

  console.log(instrumentBuffers);

  Tone.Offline(({ transport }) => {
    console.log(transport);

    let offlineLimiter = new Tone.Limiter(-3).toDestination();

    transport.bpm.value = sessionData.bpm;

    modules.map((module, moduleIndex) => {
      //let thisinstrument = module.instrument.connect(transport);
      let thisinstrument = MusicUtils.instrumentContructor(3);

      //let thisinstrument = module.instrument;
      //thisinstrument.context = transport.context;
      //thisinstrument.toDestination();

      switch (module.type) {
        case 0:
          //let thisbuffers = module.instrument._buffers._buffers;
          //console.log(thisbuffers);

          thisinstrument = new Tone.Players().toDestination();
          thisinstrument._buffers = instrumentBuffers[moduleIndex];

          console.log(thisinstrument);

          //for(var x=0; x<10 ;x++){thisinstrument.add(module.instrument.player(x))}

          scheduleDrumSequence(
            module.score,
            thisinstrument,
            transport,
            [],
            () => {},
            () => {}
          );
          break;
        case 2:
          scheduleChordProgression(
            module.chords,
            thisinstrument,
            transport,
            [],
            () => {}
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

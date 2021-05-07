import { scheduleDrumSequence, scheduleChordProgression } from "./TransportSchedule";
import * as Tone from "tone";


export const bounceSessionExport = (modules,sessionData) => {
      //var exportDuration = looprepeats * (60/sessionbpm) * 4 * props.length;
      let exportDuration = 2;


      Tone.Offline(({ transport }) => {

      transport.bpm.value = sessionData.bpm;

      modules.forEach((module,moduleIndex)=>{
      	let thisinstrument = {}.toDestination();

        switch(module.type){
          case 0:
            scheduleDrumSequence(module.score,thisinstrument,transport);
            break;
          case 2:
            scheduleChordProgression(module.score,thisinstrument,transport);
            break;
        }
      })

      transport.start();

    }, exportDuration).then((e) => {

    var blob = audioBufferToWaveBlob(e);

    var promiseB = blob.then(function(result) {
        var url  = window.URL.createObjectURL(result);
       	downloadURI(url, "Session.wav");

     });
    
    });


  };

export async function audioBufferToWaveBlob(audioBuffer) {

  return new Promise(function(resolve, reject) {

    var worker = new Worker('./libs/waveWorker.js');

    worker.onmessage = function( e ) {
      var blob = new Blob([e.data.buffer], {type:"audio/wav"});
      resolve(blob);
    };

    let pcmArrays = [];
    for(let i = 0; i < audioBuffer.numberOfChannels; i++) {
      pcmArrays.push(audioBuffer.getChannelData(i));
    }

    worker.postMessage({
      pcmArrays,
      config: {sampleRate: audioBuffer.sampleRate}
    });

  });

}

const downloadURI = (uri, name) => {
  var link = document.createElement("a");
  link.download = name;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  //delete link;
}
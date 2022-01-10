import { useEffect, useState } from "react";

import * as Tone from "tone";

function useAudioRec(onRecFinish) {
  const [recTools, setRecTools] = useState(null);
  const [meterLevel, setMeterLevel] = useState(0);
  const [meterInterval, setMeterInterval] = useState();
  const [fileName, setFileName] = useState("Audio");

  const initRec = () => {
    const recorder = new Tone.Recorder();
    const meter = new Tone.Meter({ normalRange: true });
    const userMedia = new Tone.UserMedia().fan(recorder, meter);
    userMedia.open();
    let tools = { recorder: recorder, userMedia: userMedia, meter: meter };
    setRecTools(tools);
    let meterInterval = setInterval(() => {
      setMeterLevel(meter.getValue());
    }, 16);
    setMeterInterval(meterInterval);
  };

  const recStart = (arg) => {
    if (!recTools) return;
    recTools.recorder.start();
    setFileName(arg);
  };

  const recStop = async (callback) => {
    if (!recTools) return;
    const blob = await recTools.recorder.stop();

    const file = new File([blob], fileName);

    const arrayBuffer = await blob.arrayBuffer();

    const audioBuffer = await Tone.getContext().rawContext.decodeAudioData(
      arrayBuffer
    );

    callback(file, audioBuffer);
  };

  useEffect(() => {
    initRec();
    return () => {
      recTools.userMedia.close();
      clearInterval(meterInterval);
    };
  }, []);

  return {
    recStart,
    recStop,
    meterLevel,
  };
}

export default useAudioRec;

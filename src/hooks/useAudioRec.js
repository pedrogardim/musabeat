import { useEffect, useState } from "react";

import * as Tone from "tone";

import useInterval from "./useInterval";

function useAudioRec() {
  const [recTools, setRecTools] = useState(null);
  const [meterLevel, setMeterLevel] = useState(0);
  const [fileName, setFileName] = useState("Audio");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBuffer, setRecordingBuffer] = useState([]);

  useInterval(() => {
    if (!recTools) return;
    setMeterLevel(recTools.meter.getValue());
  }, 16);

  useInterval(() => {
    if (!recTools) return;
    if (isRecording)
      setRecordingBuffer((prev) => [...prev, recTools.meter.getValue()]);
  }, 1);

  const initRec = () => {
    const recorder = new Tone.Recorder();
    const meter = new Tone.Meter({ normalRange: true });
    const userMedia = new Tone.UserMedia().fan(recorder, meter);
    userMedia.open();
    let tools = { recorder: recorder, userMedia: userMedia, meter: meter };
    setRecTools(tools);
  };

  const recStart = (arg) => {
    if (!recTools) return;
    setIsRecording(true);
    recTools.recorder.start();
    setFileName(arg);
  };

  const recStop = async (callback) => {
    if (!recTools) return;
    setIsRecording(false);

    const blob = await recTools.recorder.stop();

    const file = new File([blob], fileName);

    const arrayBuffer = await blob.arrayBuffer();

    const audioBuffer = await Tone.getContext().rawContext.decodeAudioData(
      arrayBuffer
    );

    setRecordingBuffer([]);

    callback(file, audioBuffer);
  };

  useEffect(() => {
    initRec();
    return () => {
      if (!recTools) return;
      recTools.userMedia.close();
      Object.keys(recTools).forEach((e) => e.dispose());
    };
  }, []);

  return {
    isRecording,
    recStart,
    recStop,
    meterLevel,
    recordingBuffer,
  };
}

export default useAudioRec;

import { useEffect, useState, useRef } from "react";

import * as Tone from "tone";

import useInterval from "./useInterval";

function useAudioRec(active) {
  const [recTools, setRecTools] = useState(null);
  const [meterLevel, setMeterLevel] = useState(0);
  const [fileName, setFileName] = useState("Audio");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBuffer, setRecordingBuffer] = useState([]);

  const recToolsRef = useRef(null);

  recToolsRef.current = recTools;

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
    let tools = { recorder: recorder, userMedia: userMedia, meter: meter };
    setRecTools(tools);
    if (active) userMedia.open();

    Tone.UserMedia.enumerateDevices().then((devices) => {
      // print the device labels
      //console.log(devices.map((device) => device.label));
    });
  };

  const recStart = (arg) => {
    if (!recTools) return;
    recTools.recorder.start();
    setIsRecording(true);
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

    recTools.userMedia.close();
  };

  const dispose = () => {
    //console.log(recToolsRef.current, "recTools");
    if (!recToolsRef.current) return;
    recToolsRef.current.userMedia.close();
    ["meter", "recorder", "userMedia"].forEach((e) =>
      recToolsRef.current[e].dispose()
    );
  };

  useEffect(() => {
    initRec();
    return () => {
      dispose();
    };
  }, []);

  useEffect(() => {
    if (active && recTools) recTools.userMedia.open();
  }, [active, recTools]);

  return {
    isRecording,
    recStart,
    recStop,
    meterLevel,
    recordingBuffer,
  };
}

export default useAudioRec;

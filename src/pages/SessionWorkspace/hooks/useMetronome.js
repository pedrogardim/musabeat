import { useState, useEffect } from "react";

import * as Tone from "tone";

function useMetronome() {
  const [metronome, setMetronome] = useState(null);
  const [metronomeState, setMetronomeState] = useState(false);
  const [metronomeEvent, setMetronomeEvent] = useState(null);

  const initMetronome = () => {
    let metro = new Tone.FMSynth({
      envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.2 },
      oscillator: { type: "sine" },
      modulationIndex: 10,
      harmonicity: 10,
      modulationEnvelope: {
        attack: 0.001,
        decay: 0.3,
        sustain: 0,
        release: 0.01,
      },
    }).toDestination();

    metro.volume.value = -9999;

    setMetronome((prev) => {
      prev && prev.dispose();
      return metro;
    });

    metronomeEvent && metronomeEvent.forEach((e) => Tone.Transport.clear(e));

    let events = [];

    for (let mse = -1; mse < 128; mse++) {
      for (let qtr = 0; qtr < 4; qtr++) {
        events.push(
          Tone.Transport.schedule((time) => {
            metro.triggerAttackRelease(qtr === 0 ? "C5" : "C4", "4n", time);
          }, `${mse}:${qtr}:0`)
        );
      }
    }

    setMetronomeEvent(events);
  };

  useEffect(() => {
    initMetronome();
    return () => {
      if (metronome) metronome.dispose();
    };
  }, []);

  useEffect(() => {
    if (metronome) metronome.volume.value = metronomeState ? 0 : -99999;
  }, [metronomeState]);

  return setMetronomeState;
}

export default useMetronome;

import { playersLoader, patchLoader } from "../../../services/Instruments";

import * as Tone from "tone";

export const play = async (
  instrument,
  type,
  setIsPlaying,
  row,
  setInstrument,
  setIsLoading
) => {
  if (type === "files") {
    if (instrument !== null) {
      setIsPlaying(true);
      instrument.start();
    } else {
      setIsLoading(true);
      let player = new Tone.Player(row.url, () => {
        player.state !== "started" && player.start();
        setIsPlaying(true);
        setIsLoading(false);
      }).toDestination();
      player.onstop = () => {
        setIsPlaying(false);
      };
      setInstrument(player);
    }
  }

  if (type === "seq" || type === "instr") {
    if (instrument !== null) {
      playSequence(instrument, type, setIsPlaying);
    } else {
      setIsLoading(true);
      let player = await (type === "seq"
        ? playersLoader(row.data, row.id, () => {})
        : patchLoader(row.data, row.id, () => {}));

      player.onLoad = () => {
        playSequence(player, type, setIsPlaying);
        setIsLoading(false);
      };
      setInstrument(player);
    }
  }
};

const playSequence = (instr, type, setIsPlaying) => {
  setIsPlaying(true);
  if (type === "seq") {
    let keysArray = [];
    instr._buffers._buffers.forEach((v, key) => {
      keysArray.push(key);
    });

    keysArray.forEach((e, i) => {
      i < 7 && instr.player(e).start("+" + i * 0.2);
    });

    Tone.Draw.schedule(() => {
      setIsPlaying(false);
    }, "+1.2");
  } else {
    instr
      .triggerAttackRelease("C3", "8n", "+0:0:2")
      .triggerAttackRelease("E3", "8n", "+0:1:0")
      .triggerAttackRelease("G3", "8n", "+0:1:2")
      .triggerAttackRelease("B3", "8n", "+0:2")
      .triggerAttackRelease("C4", "8n", "+0:2:2")
      .triggerAttackRelease("E4", "8n", "+0:3:0")
      .triggerAttackRelease("G4", "8n", "+0:3:2")
      .triggerAttackRelease("B4", "8n", "+1:0:0");

    Tone.Draw.schedule(() => {
      setIsPlaying(false);
    }, "+1:0:2");
  }
};

export const stop = (instrument, type, setIsPlaying) => {
  if (type === "files") instrument.stop();
  if (type === "instr") instrument.releaseAll();
  if (type === "seq") instrument.stopAll();
  setIsPlaying(false);
};

export const handleDownload = (row) => {
  const xhr = new XMLHttpRequest();
  xhr.responseType = "blob";
  xhr.onload = () => {
    var blob = xhr.response;
    var a = document.createElement("a");
    a.href = window.URL.createObjectURL(blob);
    a.download = row.data.name;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
  };
  xhr.open("GET", row.url);
  xhr.send();
};

export const deleteItem = () => {};

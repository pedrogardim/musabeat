import * as Tone from "tone";

import firebase from "firebase";

import { effectTypes } from "./Audio";

export const patchLoader = async (
  input,
  setInstrumentsLoaded,
  trackIndex,
  setNotifications,
  setInstrumentsInfo
) => {
  let instrumentLoaded = (isLoaded) => {
    setInstrumentsLoaded((prev) => {
      let a = [...prev];
      a[trackIndex] = isLoaded;
      return a;
    });
  };

  instrumentLoaded(false);

  let instr;
  const patchRef = firebase.firestore().collection("patches").doc(input);

  let patchSnaphot = await patchRef.get();
  //console.log(patch);

  let patch = patchSnaphot.exists ? patchSnaphot.data() : demoInstrumentPatch;

  !patchSnaphot.exists &&
    setNotifications((prev) => [...prev, ["patch", input, trackIndex]]);

  //console.log(patch);

  let options = patch.options;
  let instrfx = [];

  if (patch.base === "Sampler") {
    return await loadSamplerFromObject(
      patch,
      setInstrumentsLoaded,
      trackIndex,
      () => {},
      setNotifications,
      setInstrumentsInfo
    );
  } else {
    instrumentLoaded(true);
    setInstrumentsInfo((prev) => {
      let newInfo = [...prev];
      newInfo[trackIndex] = { patch: patch };
      return newInfo;
    });
  }
  if (patch.base === "FM") {
    instr = new Tone.PolySynth(Tone.FMSynth, options).toDestination();
  }
  if (patch.base === "AM") {
    instr = new Tone.PolySynth(Tone.AMSynth, options).toDestination();
  }
  if (patch.base === "Mono") {
    instr = new Tone.PolySynth(Tone.MonoSynth, options).toDestination();
  }
  if (patch.base === "Synth") {
    instr = new Tone.PolySynth(Tone.Synth, options).toDestination();
  }
  if (patch.base === undefined) {
    instr = new Tone.PolySynth(patch).toDestination();
    instr.set(patch);
    //console.log(instr);
  }

  if (patch.base !== "Sampler") instrumentLoaded(true);

  "gain" in patch
    ? (instr.volume.value = patch.gain)
    : (instr.volume.value = -18);

  /*  if ("fx" in patch) {
      patch.fx.forEach((e, i) => {
        if (e[0] === "vib") {
          instrfx[i] = new Tone.Vibrato(e[1], e[2]);
        }
        if (e[0] === "stwid") {
          instrfx[i] = new Tone.StereoWidener(e[1]);
        }
        if (e[0] === "trem") {
          instrfx[i] = new Tone.Tremolo(e[1], e[2]).start();
        }
        if (e[0] === "phsr") {
          instrfx[i] = new Tone.Phaser(e[1], e[2], e[3]);
        }
        if (e[0] === "rvb") {
          instrfx[i] = new Tone.Reverb({
            decay: e[1],
            wet: e[2],
            predelay: [3],
          });
        }
        if (e[0] === "dly") {
          instrfx[i] = new Tone.FeedbackDelay({
            delayTime: e[1],
            feedback: e[2],
            wet: e[3],
          });
        }
        instr.connect(instrfx[i]);
  
        i === patch.fx.length - 1 && instrfx[i].toDestination();
      });
    } else {
      instr.toDestination();
    } */
  //console.log("instr", instr);
  return instr;
};

export const loadSamplerFromObject = async (
  obj,
  setInstrumentsLoaded,
  trackIndex,
  nowLoaded,
  setNotifications,
  setInstrumentsInfo
) => {
  let instrumentLoaded = (isLoaded, sampler) => {
    setInstrumentsLoaded((prev) => {
      let a = [...prev];
      a[trackIndex] = isLoaded;
      return a;
    });

    //for PatchExplorer

    if (nowLoaded !== undefined && isLoaded && sampler) nowLoaded(sampler);
  };

  let missingFiles = [];

  instrumentLoaded(false);

  //console.log("Sampler!");

  let urlArray = await Promise.all(
    Object.keys(obj.urls).map(async (e, i) => {
      try {
        return await firebase.storage().ref(obj.urls[e]).getDownloadURL();
      } catch (er) {
        setNotifications((prev) => [
          ...prev,
          ["file", obj.urls[e], trackIndex],
        ]);
      }
    })
  );

  //console.log(urlArray);

  let filesInfo = await Promise.all(
    Object.keys(obj.urls).map(async (e, i) => {
      try {
        return [
          e,
          (
            await firebase
              .firestore()
              .collection("files")
              .doc(obj.urls[e])
              .get()
          ).data(),
        ];
      } catch (er) {
        setNotifications((prev) => [
          ...prev,
          ["fileInfo", obj.urls[e], trackIndex],
        ]);
      }
    })
  );

  setInstrumentsInfo((prev) => {
    let newInfo = [...prev];
    newInfo[trackIndex] = {
      patch: obj,
      filesInfo: Object.fromEntries(filesInfo),
    };
    return newInfo;
  });

  let urls = Object.fromEntries(
    urlArray
      .filter((e) => e !== undefined)
      .map((e, i) => [Object.keys(obj.urls)[i], e])
  );

  //console.log(urls);

  let sampler = new Tone.Sampler(urls, () => {
    instrumentLoaded(true, sampler);
  }).toDestination();

  //sampler.set(options);

  return sampler;
};

export const loadSynthFromGetObject = (obj) => {
  //TODO: differ AM from FM Synth
  let options = obj.hasOwnProperty("name") ? obj.options : obj;

  let instrBase = options.hasOwnProperty("filter")
    ? Tone.MonoSynth
    : options.hasOwnProperty("modulation")
    ? Tone.FMSynth
    : Tone.Synth;

  let instr = new Tone.PolySynth(instrBase, options).toDestination();

  if (obj.hasOwnProperty("volume")) instr.volume.value = obj.volume;

  return instr;
};

export const loadDrumPatch = async (
  input,
  setInstrumentsLoaded,
  trackIndex,
  onLoad,
  setTracks,
  setLabels,
  setInstrumentsInfo,
  setNotifications
) => {
  let instrumentLoaded = (isLoaded, players) => {
    //console.log("ITS LOADED ITS LOADED ITS LOADED ITS LOADED ITS LOADED");
    setInstrumentsLoaded((prev) => {
      let a = [...prev];
      a[trackIndex] = isLoaded;
      return a;
    });
    if (onLoad !== undefined && isLoaded && players) onLoad(players);
  };

  //console.log("Loading sampler patch");
  //drum patch with stardard configuration
  let patchRef =
    typeof input === "string"
      ? firebase.firestore().collection("drumpatches").doc(input)
      : null;

  let patch = patchRef ? (await patchRef.get()).data() : input;

  if (patch === undefined) {
    setNotifications((prev) => [...prev, ["patch", input, trackIndex]]);
    patch = demoDrumPatch;
  }

  //handle empty urls obj

  if (JSON.stringify(patch.urls) === "{}") {
    setInstrumentsLoaded((prev) => {
      //console.log("======LOADED=======")
      let a = [...prev];
      a[trackIndex] = true;
      return a;
    });
    return new Tone.Players().toDestination();
  }

  //get urls from file ids

  let urlArray = await Promise.all(
    Object.keys(patch.urls).map(async (e, i) => {
      try {
        return await firebase.storage().ref(patch.urls[e]).getDownloadURL();
      } catch (er) {
        setNotifications((prev) => [
          ...prev,
          ["file", patch.urls[e], trackIndex],
        ]);
      }
    })
  );

  let filesInfo = await Promise.all(
    Object.keys(patch.urls).map(async (e, i) => {
      try {
        return [
          e,
          (
            await firebase
              .firestore()
              .collection("files")
              .doc(patch.urls[e])
              .get()
          ).data(),
        ];
      } catch (er) {
        setNotifications((prev) => [
          ...prev,
          ["fileInfo", patch.urls[e], trackIndex],
        ]);
      }
    })
  );

  setInstrumentsInfo((prev) => {
    let newInfo = [...prev];
    newInfo[trackIndex] = {
      patch: patch,
      filesInfo: Object.fromEntries(filesInfo),
    };
    return newInfo;
  });

  //console.log(urlArray);

  let urls = Object.fromEntries(
    urlArray
      .filter((e) => e !== undefined)
      .map((e, i) => [Object.keys(patch.urls)[i], e])
  );

  //console.log(urls);

  //console.log(urls);

  setInstrumentsLoaded((prev) => {
    //console.log("======LOADED=======")
    let a = [...prev];
    a[trackIndex] = false;
    return a;
  });

  let drumPlayers = new Tone.Players(urls, () =>
    instrumentLoaded(true, drumPlayers)
  ).toDestination();

  setLabels && setLabels(patch.lbls);

  drumPlayers.volume.value = patch.volume;

  return drumPlayers;
};

export const loadAudioTrack = async (
  input,
  setInstrumentsLoaded,
  trackIndex,
  setTracks,
  setInstrumentsInfo,
  setNotifications
) => {
  let instrumentLoaded = (isLoaded, players) => {
    //console.log("ITS LOADED ITS LOADED ITS LOADED ITS LOADED ITS LOADED");
    setInstrumentsLoaded((prev) => {
      let a = [...prev];
      a[trackIndex] = isLoaded;
      return a;
    });
  };

  if (JSON.stringify(input.urls) === "{}") {
    setInstrumentsLoaded((prev) => {
      //console.log("======LOADED=======")
      let a = [...prev];
      a[trackIndex] = true;
      return a;
    });
    setInstrumentsInfo((prev) => {
      let newInfo = [...prev];
      newInfo[trackIndex] = {
        filesInfo: {},
      };
      return newInfo;
    });
    return new Tone.Players().toDestination();
  }

  //get urls from file ids

  let urlArray = await Promise.all(
    Object.keys(input.urls).map(async (e, i) => {
      try {
        return await firebase.storage().ref(input.urls[e]).getDownloadURL();
      } catch (er) {
        setNotifications((prev) => [
          ...prev,
          ["file", input.urls[e], trackIndex],
        ]);
      }
    })
  );

  let filesInfo = await Promise.all(
    Object.keys(input.urls).map(async (e, i) => {
      try {
        return [
          e,
          (
            await firebase
              .firestore()
              .collection("files")
              .doc(input.urls[e])
              .get()
          ).data(),
        ];
      } catch (er) {
        setNotifications((prev) => [
          ...prev,
          ["fileInfo", input.urls[e], trackIndex],
        ]);
      }
    })
  );

  console.log(Object.fromEntries(filesInfo));

  setInstrumentsInfo((prev) => {
    let newInfo = [...prev];
    newInfo[trackIndex] = {
      filesInfo: Object.fromEntries(filesInfo),
    };
    return newInfo;
  });

  //console.log(urlArray);

  let urls = Object.fromEntries(
    urlArray
      .filter((e) => e !== undefined)
      .map((e, i) => [Object.keys(input.urls)[i], e])
  );

  console.log(urls);

  //console.log(urls);

  setInstrumentsLoaded((prev) => {
    //console.log("======LOADED=======")
    let a = [...prev];
    a[trackIndex] = false;
    return a;
  });

  let trackPlayers = new Tone.Players(urls, () =>
    instrumentLoaded(true, trackPlayers)
  ).toDestination();

  if (input.volume) trackPlayers.volume.value = input.volume;

  return trackPlayers;
};

export const loadEffect = (type, options) => {
  //type as effects array index
  //console.log(options);
  return new Tone[effectTypes[type]](options);
};

const demoInstrumentPatch = {
  categ: 1,
  ld: 11,
  likes: 0,
  options: {
    oscillator: {
      type: "sine2",
    },
    modulationIndex: 20,
    envelope: {
      decay: 2,
      attack: 0.001,
      release: 0.2,
      sustain: 0,
    },
    harmonicity: 50,
    modulation: {
      type: "sine",
    },
    modulationEnvelope: {
      release: 0,
      sustain: 0,
      decay: 0.5,
      attack: 0.001,
    },
  },
  in: 1,
  volume: -6,
  name: "Musa Electric Piano",
  creator: null,
  base: "FM",
};

const demoDrumPatch = {
  in: 7,
  ld: 20,
  creator: "jyWfwZsyKlg1NliBOIYNmWkc3Dr1",
  likes: 1,
  lbls: {
    0: "Kick",
    1: "Snare",
    2: "Clap",
    3: "C. Hihat",
    4: "O. Hihat",
    5: "Low Tom",
    6: "Mid Tom",
    7: "Hi Tom",
    8: "Crash",
    9: "Perc",
  },
  urls: {
    0: "h4XtGMz4gswCYoLnENIm",
    1: "sS6ZU0FuPm7QabtWpCQw",
    2: "gZ05VHmRMGX5fi2EQ47e",
    3: "bngMUcdkiW7Ug158Ez3z",
    4: "q6XTD7vB6KEZ0H7ON06b",
    5: "j0rvnHBCNcd3b148SBPr",
    6: "JkpaPV2UI3mUAAcak6fF",
    7: "iHeYUl0I7DjBAV6Np4DJ",
    8: "GxlamzTbWyD0Jxu6gtGh",
    9: "7R41LCHXj8lJNwOfxgAu",
  },
  volume: 0,
  categ: 0,
  name: "Musa 808",
};

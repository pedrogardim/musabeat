import * as Tone from "tone";

import firebase from "firebase";

import { loadEffects } from "./Effects";

const demoInstrumentPatch = {
  categ: 1,
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

/*===========================LOADERS==================================*/

export const loadInstrument = (
  track,
  index,
  buffers,
  setInstruments,
  setInstrumentsLoaded,
  setEffects,
  setInstrumentsInfo,
  setNotifications,
  callBack
) => {
  const setInstrument = (r) =>
    setInstruments((prev) => {
      let a = [...prev];
      a[index] = r;
      return a;
    });

  const setInstrumentLoaded = (state) =>
    setInstrumentsLoaded((prev) => ({ ...prev, [index]: state }));

  const onLoad = (instrInfo) => {
    setInstrumentsInfo((prev) =>
      instrInfo ? { ...prev, [index]: instrInfo } : prev
    );
    setInstrumentLoaded(true);

    if (callBack) callBack();
  };

  const addNotification = (newNotification) => {
    setNotifications((prev) => [...prev, newNotification]);
  };

  setInstrumentLoaded(false);

  if (track.type === 0 || track.type === 2) {
    playersLoader(
      track.instrument,
      index,
      onLoad,
      addNotification,
      buffers
    ).then((r) => {
      setInstrument(r);
      loadEffects(r, track, index, setEffects);
    });
  } else {
    patchLoader(track.instrument, index, onLoad, addNotification, buffers).then(
      (r) => {
        setInstrument(r);
        loadEffects(r, track, index, setEffects);
      }
    );
  } //load from obj
};

//Tone.js instrument for both Sequencer and Audio Track
export const playersLoader = async (
  input,
  track,
  onLoad,
  addNotification,
  buffers
) => {
  let patchRef =
    typeof input === "string"
      ? firebase.firestore().collection("drumpatches").doc(input)
      : null;

  let patch = patchRef ? (await patchRef.get()).data() : input;

  //load from buffers

  if (buffers) {
    let instrument = new Tone.Players({}).toDestination();
    instrument._buffers = buffers;
    onLoad();
    return instrument;
  }

  //patch not found

  if (patch === undefined) {
    if (addNotification)
      addNotification({ type: "patchNotFound", id: input, track: track });
    patch = demoDrumPatch;
  }

  //empty urls obj

  if (JSON.stringify(patch.urls) === "{}") {
    onLoad();
    return new Tone.Players().toDestination();
  }

  //get urls from file ids

  let urlArray = await Promise.all(
    Object.keys(patch.urls).map(async (e, i) => {
      try {
        return await firebase.storage().ref(patch.urls[e]).getDownloadURL();
      } catch (er) {
        if (addNotification)
          addNotification({
            type: "fileNotFound",
            id: patch.urls[e],
            track: track,
          });
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
        if (addNotification)
          addNotification({
            type: "fileInfoError",
            id: patch.urls[e],
            track: track,
          });
      }
    })
  );

  let instrInfo = {
    patch: patch,
    filesInfo: Object.fromEntries(filesInfo),
  };

  //console.log(urlArray);

  let urls = Object.fromEntries(
    urlArray
      .filter((e) => e !== undefined)
      .map((e, i) => [Object.keys(patch.urls)[i], e])
  );

  let players = new Tone.Players(urls, () => onLoad(instrInfo)).toDestination();

  if (patch.volume !== undefined) players.volume.value = patch.volume;

  return players;
};

export const patchLoader = async (
  input,
  track,
  onLoad,
  addNotification,
  buffers
) => {
  let patchRef =
    typeof input === "string"
      ? firebase.firestore().collection("patches").doc(input)
      : null;

  let patch = typeof input === "string" ? (await patchRef.get()).data() : input;

  if (buffers) {
    let instrument = new Tone.Sampler().toDestination();
    instrument._buffers = buffers;
    onLoad();
    return instrument;
  }

  //patch not found

  if (patch === undefined) {
    if (addNotification)
      addNotification({ type: "patchNotFound", id: input, track: track });
    patch = demoInstrumentPatch;
  }

  let options = patch.options ? patch.options : patch;

  if (patch.base === "Sampler") {
    return await loadSamplerInstrument(patch, track, onLoad, addNotification);
  } else {
    let base = patch.base
      ? patch.base
      : options.filter
      ? "Mono"
      : options.modulationIndex
      ? "FM"
      : "AM";
    onLoad({ patch: patch });
    return new Tone.PolySynth(Tone[`${base}Synth`], options).toDestination();
  }
};

export const loadSamplerInstrument = async (
  input,
  track,
  onLoad,
  addNotification
) => {
  console.log(input);

  let urlArray = await Promise.all(
    Object.keys(input.urls).map(async (e, i) => {
      try {
        return await firebase.storage().ref(input.urls[e]).getDownloadURL();
      } catch (er) {
        if (addNotification)
          addNotification({
            type: "fileNotFound",
            id: input.urls[e],
            track: track,
          });
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
        if (addNotification)
          addNotification({
            type: "fileInfoError",
            id: input.urls[e],
            track: track,
          });
      }
    })
  );

  let instrInfo = {
    patch: input,
    filesInfo: Object.fromEntries(filesInfo),
  };

  let urls = Object.fromEntries(
    urlArray
      .filter((e) => e !== undefined)
      .map((e, i) => [Object.keys(input.urls)[i], e])
  );

  let sampler = new Tone.Sampler(urls, {
    onload: () => onLoad(instrInfo),
    ...input.options,
  }).toDestination();

  return sampler;
};

/* export const loadEffect = (type, options) => {
  //type as effects array index
  //console.log(options);
  return new Tone[effectTypes[type]](options);
};
 */

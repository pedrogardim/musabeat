//================================================
//MUSIC DATA
//================================================

import * as Tone from "tone";
import firebase from "firebase";

import { instruments } from "./instrumentpatches";
import { kits, labels } from "./drumkits";
import { PitchDetector } from "pitchy";

export const musicalNotes = [
  "C",
  "C#/D♭",
  "D",
  "D#/E♭",
  "E",
  "F",
  "F#/G♭",
  "G",
  "G#/A♭",
  "A",
  "A#/B♭",
  "B",
];

export const chordnamepossibilities = [
  ["4", "4th"],
  ["5", "5th"],
  ["", "maj", "major", "maior", "mayor", "M"],
  ["m", "min", "minor", "menor", "-"],
  ["sus2", "2"],
  ["sus4", "4"],
  ["dim", "°"],
  ["aug", "+", "+5"],

  ["6", "maj6", "M6", "major6"],
  ["maj7", "M7", "major7"],
  ["maj7#5", "M7#5", "aug7"],

  ["9", "add9", "major9", "maj9"],

  ["m6", "-6", "minor6"],
  ["m7", "-7", "minor7", "min7"],
  ["m9", "-9", "minor9", "min9"],

  ["7"],
  ["mmaj7", "-maj7"],
  ["°7", "dim7"],
  ["ø7", "m7♭5"],
];

export const chordtypes = [
  [0, 5],
  [0, 7],
  [0, 4, 7],
  [0, 3, 7],
  [0, 2, 7],
  [0, 5, 7],
  [0, 3, 6],
  [0, 4, 8],

  [0, 4, 7, 9],
  [0, 4, 7, 11],
  [0, 4, 8, 11],

  [0, 4, 7, 11, 14],

  [0, 3, 7, 8],
  [0, 3, 7, 10],
  [0, 3, 7, 10, 14],

  [0, 4, 7, 10],
  [0, 3, 7, 11],
  [0, 3, 6, 10],
  [0, 3, 6, 9],
];

export const chordextentions = [
  "",
  "♭9",
  "9",
  "#9",
  "#9",
  "11",
  "#11",
  "",
  "♭13",
  "13",
  "♭7",
  "7",
];
///////////////77777/ ["","m2","2","m3","M3","4"," #4","5", "m6", "6","m7","7"]

export const musicalintervals = [
  1.0595, 1.1225, 1.1892, 1.2599, 1.3348, 1.4142, 1.4983, 1.5874, 1.6818,
  1.7818, 1.8877, 2,
];

export const scales = [
  //[[0,1,2,3,4,5,6,7,8,9,10,11],"Chromatic"],
  [[0, 2, 4, 5, 7, 9, 11], "Major"],
  [[0, 2, 4, 7, 9], "Major Pentatonic"],

  [[0, 2, 3, 5, 7, 8, 10], "Minor"],
  [[0, 2, 3, 5, 7, 8, 11], "Harm Minor"],

  //[[0,2,4,7,9],"Major Pentatonic"],
  //[[0,3,5,7,10],"Minor Pentatonic"],
  //[[0,2,3,5,7,9,10],"Dorian Mode"],
  //[[0,1,3,5,7,8,10],"Phrygian"],
  //[[0,1,3,5,7,8,10],"Lydian"],
];

export const waveTypes = [
  "sine",
  "sine2",
  "sine3",
  "sine4",
  "sine5",
  "sine6",
  "sine7",
  "sine8",
  "sine9",
  "sine10",
  "sine11",
  "sine12",
  "sine13",
  "sine14",
  "sine15",
  "sine16",
  "sine17",
  "sine18",
  "sine19",
  "sine20",
  "sine21",
  "sine22",
  "sine23",
  "sine24",
  "sine25",
  "sine26",
  "sine27",
  "sine28",
  "sine29",
  "sine30",
  "sine31",
  "sine32",
  "square",
  "square2",
  "square3",
  "square4",
  "square5",
  "square6",
  "square7",
  "square8",
  "square9",
  "square10",
  "square11",
  "square12",
  "square13",
  "square14",
  "square15",
  "square16",
  "square17",
  "square18",
  "square19",
  "square20",
  "square21",
  "square22",
  "square23",
  "square24",
  "square25",
  "square26",
  "square27",
  "square28",
  "square29",
  "square30",
  "square31",
  "square32",
  "triangle1",
  "triangle2",
  "triangle3",
  "triangle4",
  "triangle5",
  "triangle6",
  "triangle7",
  "triangle8",
  "triangle9",
  "triangle10",
  "triangle11",
  "triangle12",
  "triangle13",
  "triangle14",
  "triangle15",
  "triangle16",
  "triangle17",
  "triangle18",
  "triangle19",
  "triangle20",
  "triangle21",
  "triangle22",
  "triangle23",
  "triangle24",
  "triangle25",
  "triangle26",
  "triangle27",
  "triangle28",
  "triangle29",
  "triangle30",
  "triangle31",
  "triangle32",
  "sawtooth",
  "sawtooth2",
  "sawtooth3",
  "sawtooth4",
  "sawtooth5",
  "sawtooth6",
  "sawtooth7",
  "sawtooth8",
  "sawtooth9",
  "sawtooth10",
  "sawtooth11",
  "sawtooth12",
  "sawtooth13",
  "sawtooth14",
  "sawtooth15",
  "sawtooth16",
  "sawtooth17",
  "sawtooth18",
  "sawtooth19",
  "sawtooth20",
  "sawtooth21",
  "sawtooth22",
  "sawtooth23",
  "sawtooth24",
  "sawtooth25",
  "sawtooth26",
  "sawtooth27",
  "sawtooth28",
  "sawtooth29",
  "sawtooth30",
  "sawtooth31",
  "sawtooth32",
  "fatsine",
  "fatsquare",
  "fatsawtooth",
  "fattriangle",
  "fatcustom",
  "fmsine",
  "fmsquare",
  "fmsawtooth",
  "fmtriangle",
  "fmcustom",
  "amsine",
  "amsquare",
  "amsawtooth",
  "amtriangle",
  "amcustom",
  "pulse",
  "pwm",
];

export const filterTypes = [
  "lowpass",
  "highpass",
  "bandpass",
  "lowshelf",
  "highshelf",
  "notch",
  "allpass",
  "peaking",
];

export const chordNametoNotes = (arg) => {
  let chordroot,
    chordtype,
    chordbass = null;
  let chordinput = arg.replace(" ", "");

  if (chordinput.indexOf("/") !== -1) {
    chordbass = chordinput.split("/")[1];
    chordinput = chordinput.split("/")[0];
  } else if (chordinput[1] === "b") {
    let includecomma = chordinput.replace("b", "b,");
    let rootandtypearray = includecomma.split(",");
    chordroot = rootandtypearray[0];
    chordtype = rootandtypearray[1];
  } else {
    chordroot = chordinput[0];
    chordtype = chordinput.replace(chordroot, "");
  }

  chordnamepossibilities.forEach(function (element, index) {
    if (element.indexOf(chordtype) !== -1) {
      chordtype = index;
    }
  });

  if (chordbass !== null) {
    //append bass
  }

  let harmonizedchord = Tone.Frequency(chordroot + "3").harmonize(
    chordtypes[chordtype]
  );
  let finishedchord = [];
  harmonizedchord.forEach((e) =>
    finishedchord.push(Tone.Frequency(e).toNote())
  );

  return finishedchord;
};

export const chordNotestoName = (arg) => {
  if (arg.length === 0) {
    return "N.C";
  }

  let chordroot = Tone.Frequency(arg[0]).toFrequency();
  let chordtype = "...";
  let additionalnotes = [];
  let additionalnotesstring = "";

  let chordintervals = [0];

  //transform the note array into intervals array, putting everyone inside the same octave and removing duplicated.

  arg.forEach(function (element, index) {
    if (index === 0) return;
    let thisinterval;
    let thisfrequency = Tone.Frequency(element).toFrequency();
    let thisrelation =
      Math.round((thisfrequency / chordroot + Number.EPSILON) * 10000) / 10000;
    while (thisrelation < 1) {
      thisrelation *= 2;
    }
    while (thisrelation > 2) {
      thisrelation /= 2;
    }

    musicalintervals.forEach(function (e, i) {
      if (Math.abs(thisrelation - e) < 0.005) {
        thisinterval = i + 1;
      }
    });

    if (chordintervals.indexOf(thisinterval) === -1)
      chordintervals.push(thisinterval);
  });

  //Sort in numeric order - 2,3,1 into 1,2,3

  chordintervals.sort((a, b) => a - b);

  //Now, compare it with each type in the "chordtypes" array

  //This array will store the common intervals with each of the "chordtypes" type

  let typepossibilities = [];

  //For each chordtype:

  chordtypes.forEach(function (element, index) {
    let commonintervals = [];
    commonintervals = chordintervals.filter((el) => element.includes(el));
    typepossibilities.push(commonintervals.length - 1);

    //Check the common intervals with which of the types.
  });

  //Now, chose the one type with most common intervals (if are more than 1, pick the first)

  let typechosen = typepossibilities.reduce(
    (iMax, x, i, arr) => (x > arr[iMax] ? i : iMax),
    0
  );

  //the output is a int, will be the index. Now we pick the name from "chordnamepossibilities"

  chordtype = chordnamepossibilities[typechosen][0];

  //also add other extentions to the chord

  additionalnotes = chordintervals.filter(function (val) {
    return chordtypes[typechosen].indexOf(val) === -1;
  });

  additionalnotes.forEach(function (element, index) {
    if (additionalnotes.length === 1 && element !== 12) {
      additionalnotesstring = "(" + chordextentions[element] + ")";
    } else if (element === 12) {
      additionalnotesstring = "";
    } else {
      if (index === 0) {
        additionalnotesstring = chordextentions[element];
      } else if (element !== 12) {
        additionalnotesstring += "/";
        additionalnotesstring += chordextentions[element];
      }
    }
  });

  //Convert the root note from chord to  ;

  chordroot = Tone.Frequency(chordroot).toNote().replace(/[0-9]/g, "");

  //return everything

  return chordroot + chordtype + additionalnotesstring;
};
/*
function noteArraytoMidi(arg){
  let newarray = []
  arg.map((e)=>{Tone.Frequency(e).toMidi()});
  return newarray;
}

function midiArraytoNote(arg){
  let newarray = []
  arg.forEach((e)=>{newarray.push(Tone.Frequency(e,"midi").toNote())});
  return newarray;
}
*/

function gcd_two_numbers(x, y) {
  if (typeof x !== "number" || typeof y !== "number") return false;
  x = Math.abs(x);
  y = Math.abs(y);
  while (y) {
    let t = y;
    y = x % y;
    x = t;
  }
  return x;
}

export const adaptSequencetoSubdiv = (oldarray, newsubdivision, arrayType) => {
  //arrayType: array of numbers = true, arrays of arrays = false/undefined
  let difference = newsubdivision / oldarray.length;
  let gdc = gcd_two_numbers(newsubdivision, oldarray.length);

  let newsubdivarray = [];

  console.log(oldarray, newsubdivision);

  //POSSIBLE SCENARIOS:

  //no difference

  if (difference === 1) return oldarray;

  /*
  
  //difference is greater than double, insert silences between beats

  else if (difference % 2 === 0 || difference % 3 === 0){ 

    for(let x = 0; x < oldarray.length; x++){
      newsubdivarray.push(oldarray[x]);
      for(let y = 0; y < (difference-1); y++){
        newsubdivarray.push([]);
      }
    }
  }

  //difference is positive, but less than double, insert silences in some intervals

  else if (difference > 1 && difference < 2){ 

    for(let x = 0; x < oldarray.length; x++){
        newsubdivarray.push(oldarray[x]);
        if(x%((difference*2)-1) === 1){
          newsubdivarray.push([]);
        }
    }
  }

  

  else if (difference < 1 && ((1/difference) % 2 === 0 || (1/difference) % 3 === 0)){ 

    for(let x = 0; x < newsubdivision; x++){
        newsubdivarray.push(oldarray[x/difference]);
    }
  } 

  */

  //apply GCD

  if (difference > 1) {
    console.log("gdccase+", gdc, oldarray.length);

    for (let x = 0; x < oldarray.length; x++) {
      newsubdivarray.push(oldarray[x]);
      console.log((x + 1) % (oldarray.length / gdc));

      if ((x + 1) % (oldarray.length / gdc) === 0) {
        for (let y = 0; y < difference - 1; y++) {
          arrayType ? newsubdivarray.push(0) : newsubdivarray.push(0);
        }
      }
    }
  } else if (difference < 1) {
    console.log("gdc case -", gdc);

    //works if gdc = new newsubdivision

    for (let x = 0; x < oldarray.length; x++) {
      if (x % (oldarray.length / gdc) === 0) {
        newsubdivarray.push(oldarray[x]);
      }
    }
    /*
    for(let x = 0; x < drumseq.length; x++){
      if (x % (drumseq.length/gdc) === 0){
        newsubdivarray.push(drumseq[x]);
      }
    }
    */
  } else if (gdc === 1) {
  }

  return newsubdivarray;
};

export const getChordsFromScale = (scale, root, extentions) => {
  let scalechords = [];
  for (let x = 0; x < 7; x++) {
    let thischord = [];
    //bassnote
    thischord.push(scales[scale][0][x] - 12);

    for (let y = 0; y < extentions; y++) {
      let noteindex = x + y * 2;
      if (noteindex > scales[scale][0].length - 1) {
        noteindex = noteindex - scales[scale][0].length;
      }
      thischord.push(scales[scale][0][noteindex]);
    }
    scalechords.push(
      Tone.Frequency(musicalNotes[root].split("/")[0] + "4").harmonize(
        thischord
      )
    );
    scalechords[x] = scalechords[x].map((e) => {
      return Tone.Frequency(e).toNote();
    });
  }

  return scalechords;
};

export const patchLoader = async (
  input,
  type,
  setInstrumentsLoaded,
  moduleIndex
) => {
  console.log(input);
  let instr;
  let patchRef = firebase.database().ref("/patches/" + input);

  let patch = (await patchRef.get()).val();
  //console.log(patch)

  let options = patch.options;
  let instrfx = [];

  if (patch.base === "Sampler") {
    setInstrumentsLoaded((prev) => {
      let a = [...prev];
      a[moduleIndex] = false;
      return a;
    });
    instr = new Tone.Sampler(
      patch.urls,
      {
        baseUrl:
          "https://raw.githubusercontent.com/pedrogardim/musa_loops_old/master/" +
          patch.baseUrl,
      },
      () => setInstrumentsLoaded((prev) => {
        let a = [...prev];
        a[moduleIndex] = true;
        return a;
      })
    ).toDestination();

    //console.log(instr);

    instr.attack = patch.asdr[0];
    instr.release = patch.asdr[1];
  } else {
    setInstrumentsLoaded((prev) => {
        let a = [...prev];
        a[moduleIndex] = true;
        return a;
      })
  }
  if (patch.base === "FM" || type === "FMSynth") {
    instr = new Tone.PolySynth(Tone.FMSynth, options);
  }
  if (patch.base === "AM" || type === "AMSynth") {
    instr = new Tone.PolySynth(Tone.AMSynth, options);
  }
  if (patch.base === "Mono" || type === "Synth") {
    instr = new Tone.PolySynth(Tone.MonoSynth, options);
  }
  if (patch.base === "Synth" || type === "Synth") {
    instr = new Tone.PolySynth(Tone.Synth, options);
  }
  if (patch.base === undefined) {
    instr = new Tone.PolySynth(patch);
    instr.set(patch);
    //console.log(instr);
  }

  "gain" in patch
    ? (instr.volume.value = patch.gain)
    : (instr.volume.value = -18);

  if ("fx" in patch) {
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
  }
  return instr;
};

export const loadSynthFromGetObject = (obj) => {
  //TODO: differ AM from FM Synth

  let instrBase = obj.hasOwnProperty("filter")
    ? Tone.MonoSynth
    : obj.hasOwnProperty("modulation")
    ? Tone.FMSynth
    : Tone.Synth;

  let instr = new Tone.PolySynth(instrBase, obj).toDestination();

  return instr;
};

export const loadDrumPatch = (patch, buffers) => {
  let urlMap = {};
  //drum patch with stardard configuration
  labels.forEach((element, index) => {
    urlMap[index] =
      "https://raw.githubusercontent.com/pedrogardim/musa_loops_old/master/assets/samples/drums/" +
      kits[patch].baseUrl +
      "/" +
      index +
      ".wav";
  });

  let drumPlayers = new Tone.Players(urlMap).toDestination();

  return drumPlayers;
};

export const detectPitch = (audioBuffer, callback) => {
  const detector = PitchDetector.forFloat32Array(audioBuffer.length);
  return detector.findPitch(
    audioBuffer.getChannelData(0),
    audioBuffer.sampleRate
  );
};

export const mapLogScale = (position, minp, maxp, minv, maxv) => {
  var scale = (maxv - minv) / (maxp - minp);

  return Math.exp(minv + scale * (position - minp));
};

//================================================
//MUSIC DATA
//================================================

import * as Tone from "tone";

import lamejs from "lamejs";

import firebase from "firebase";

import { PitchDetector } from "pitchy";

import { Midi } from "@tonejs/midi";

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

export const musicalNotesNoFlat = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
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

export const effectTypes = [
  "Compressor",
  "Chorus",
  "Reverb",
  "Distortion",
  "BitCrusher",
  "EQ3",
  "FeedbackDelay",
  "Phaser",
];

export const fxParametersRange = [
  //units
  {
    attack: [0, 2, 0.1],
    ratio: [1, 20, 1],
    knee: [0, 40, 1],
    threshold: [-100, 0, 1],
    release: [0, 2, 0.1],
  },
  {
    feedback: [0, 1, 0.01],
    frequency: [0, 10, 0.5],
    delayTime: [0, 20, 1],
    depth: [0, 1, 0.01],
    spread: [0, 360, 1],
    wet: [0, 1, 0.01],
  },
  {
    decay: [0, 4, 0.01],
    preDelay: [0, 0.065, 0.001],
    wet: [0, 1, 0.01],
  },
  {
    distortion: [0, 1, 0.01],
    oversample: [0, 4, 1],
    wet: [0, 1, 0.01],
  },
  {
    bits: [1, 16, 1],
    wet: [0, 1, 0.01],
  },
  {
    high: [-24, 24, 0.1],
    highFrequency: [1000, 20000, 10],
    low: [-24, 24, 0.1],
    lowFrequency: [0, 800, 10],
    mid: [-24, 24, 0.1],
  },
  {
    feedback: [0, 1, 0.01],
    maxDelay: [0, 2000, 10],
    wet: [0, 1, 0.01],
  },
  {
    frequency: [0, 10, 0.5],
    octaves: [0, 4, 1],
    stages: [0, 8, 1],
    Q: [0, 20, 1],
    wet: [0, 1, 0.01],
    baseFrequency: [0, 2000, 10],
  },
];

export const instrumentsCategories = [
  "Piano",
  "Keys",
  "Organ",
  "Synth",
  "Bass",
  "Strings",
  "Guitar",
  "Brass",
  "Pad",
];

export const drumCategories = ["Electronic", "Acoustic", "FX", "Ethnic"];

export const fileTypes = ["audio/wav", "audio/mpeg"];
export const fileExtentions = ["wav", "mp3"];
export const soundChannels = { 0: "Mono", 1: "Mono", 2: "Stereo" };
// 0:Mono => Solution for audiobuffer.numberOfChannels bug

export const fileTags = [
  "Drum",
  "Sample",
  "Instrument",
  "Waveform",
  "Bass",
  "Kick",
  "Snare",
  "Clap",
  "C.HiHat",
  "O.HiHat",
  "Lo Tom",
  "Mid Tom",
  "Hi Tom",
  "Crash",
  "Perc",
  "Electronic",
  "Acoustic",
  "FX",
  "Ethnic",
  "Piano",
  "Keys",
  "Organ",
  "Synth",
  "Bass",
  "Strings",
  "Guitar",
  "Brass",
  "Pad",
];

export const sessionTags = {
  0: "Blues",
  96: "Big Band",
  1: "Classic Rock",
  97: "Chorus",
  2: "Country",
  98: "Easy Listening",
  3: "Dance",
  99: "Acoustic",
  4: "Disco",
  100: "Humour",
  5: "Funk",
  101: "Speech",
  6: "Grunge",
  102: "Chanson",
  7: "Hip-Hop",
  103: "Opera",
  8: "Jazz",
  104: "Chamber Music",
  9: "Metal",
  105: "Sonata",
  10: "New Age",
  106: "Symphony",
  11: "Oldies",
  107: "Booty Bass",
  12: "Other",
  108: "Primus",
  13: "Pop",
  109: "Porn Groove",
  14: "R&B",
  110: "Satire",
  15: "Rap",
  111: "Slow Jam",
  16: "Reggae",
  112: "Club",
  17: "Rock",
  113: "Tango",
  18: "Techno",
  114: "Samba",
  19: "Industrial",
  115: "Folklore",
  20: "Alternative",
  116: "Ballad",
  21: "Ska",
  117: "Power Ballad",
  22: "Death Metal",
  118: "Rhythmic Soul",
  23: "Pranks",
  119: "Freestyle",
  24: "Soundtrack",
  120: "Duet",
  25: "Euro-Techno",
  121: "Punk Rock",
  26: "Ambient",
  122: "Drum Solo",
  27: "Trip-Hop",
  123: "A Cappella",
  28: "Vocal",
  124: "Euro-House",
  29: "Jazz+Funk ",
  125: "Dance Hall",
  30: "Fusion",
  126: "Goa",
  31: "Trance",
  127: "Drum & Bass",
  32: "Classical",
  128: "Club-House",
  33: "Instrumental",
  129: "Hardcore",
  34: "Acid",
  130: "Terror",
  35: "House",
  131: "Indie",
  36: "Game",
  132: "BritPop",
  37: "Sound Clip",
  133: "Negerpunk",
  38: "Gospel",
  134: "Polsk Punk",
  39: "Noise",
  135: "Beat",
  40: "AlternRock",
  136: "Christian Gangsta Rap",
  41: "Bass",
  137: "Heavy Metal",
  42: "Soul",
  138: "Black Metal",
  43: "Punk",
  139: "Crossover",
  44: "Space",
  140: "Contemporary Christian",
  45: "Meditative",
  141: "Christian Rock",
  46: "Instrumental Pop",
  142: "Merengue",
  47: "Instrumental Rock",
  143: "Salsa",
  48: "Ethnic",
  144: "Thrash Metal",
  49: "Gothic",
  145: "Anime",
  50: "Darkwave",
  146: "JPop",
  51: "Techno-Industrial",
  147: "Synthpop",
  52: "Electronic",
  148: "Abstract",
  53: "Pop-Folk",
  149: "Art Rock",
  54: "Eurodance",
  150: "Baroque",
  55: "Dream",
  151: "Bhangra",
  56: "Southern Rock",
  152: "Big Beat",
  57: "Comedy",
  153: "Breakbeat",
  58: "Cult",
  154: "Chillout",
  59: "Gangsta Rap",
  155: "Downtempo",
  60: "Top 40",
  156: "Dub",
  61: "Christian Rap",
  157: "EBM",
  62: "Pop / Funk",
  158: "Eclectic",
  63: "Jungle",
  159: "Electro",
  64: "Native American",
  160: "Electroclash",
  65: "Cabaret",
  161: "Emo",
  66: "New Wave",
  162: "Experimental",
  67: "Psychedelic",
  163: "Garage",
  68: "Rave",
  164: "Global",
  69: "Showtunes",
  165: "IDM",
  70: "Trailer",
  166: "Illbient",
  71: "Lo-Fi",
  167: "Industro-Goth",
  72: "Tribal",
  168: "Jam Band",
  73: "Acid Punk",
  169: "Krautrock",
  74: "Acid Jazz",
  170: "Leftfield",
  75: "Polka",
  171: "Lounge",
  76: "Retro",
  172: "Math Rock",
  77: "Musical",
  173: "New Romantic",
  78: "Rock & Roll",
  174: "Nu-Breakz",
  79: "Hard Rock",
  175: "Post-Punk",
  80: "Folk",
  176: "Post-Rock",
  81: "Folk-Rock",
  177: "Psytrance",
  82: "National Folk",
  178: "Shoegaze",
  83: "Swing",
  179: "Space Rock",
  84: "Fast Fusion",
  180: "Trop Rock",
  85: "Bebob",
  181: "World Music",
  86: "Latin",
  182: "Neoclassical",
  87: "Revival",
  183: "Audiobook",
  88: "Celtic",
  184: "Audio Theatre",
  89: "Bluegrass",
  185: "Neue Deutsche Welle",
  90: "Avantgarde",
  186: "Podcast",
  91: "Gothic Rock",
  187: "Indie Rock",
  92: "Progressive Rock",
  188: "G-Funk",
  93: "Psychedelic Rock",
  189: "Dubstep",
  94: "Symphonic Rock",
  190: "Garage Rock",
  95: "Slow Rock",
  191: "Psybient",
};

////////////////////////////////////////////////////////////////
//Functions
////////////////////////////////////////////////////////////////

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
    //TODO: append bass
  }

  if (
    chordtypes[chordtype] === undefined ||
    musicalNotes.indexOf(chordroot) === -1
  )
    return null;

  let harmonizedchord = Tone.Frequency(chordroot + "4").harmonize([
    -12,
    ...chordtypes[chordtype],
  ]);
  let finishedchord = [];
  harmonizedchord.forEach((e) =>
    finishedchord.push(Tone.Frequency(e).toNote())
  );

  return finishedchord;
};

export const chordNotestoName = (arg) => {
  if (!arg || arg.length === 0) {
    return "N.C";
  }

  let notes = arg.sort(
    (a, b) => Tone.Frequency(a).toFrequency() - Tone.Frequency(b).toFrequency()
  );

  let chordroot = Tone.Frequency(notes[0]).toFrequency();
  let chordtype = "...";
  let additionalnotes = [];
  let additionalnotesstring = "";

  let chordintervals = [0];

  //transform the note array into intervals array, putting everyone inside the same octave and removing duplicated.

  notes.forEach(function (element, index) {
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
  //arrayType: array of numbers = true, arrays of arrays = false/undefined, 2: chords rhythm
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
    //console.log("gdccase+", gdc, oldarray.length);

    for (let x = 0; x < oldarray.length; x++) {
      newsubdivarray.push(oldarray[x]);
      console.log((x + 1) % (oldarray.length / gdc));

      if ((x + 1) % (oldarray.length / gdc) === 0) {
        for (let y = 0; y < difference - 1; y++) {
          arrayType === 2
            ? newsubdivarray.push(oldarray[x])
            : newsubdivarray.push(0);
        }
      }
    }
  } else if (difference < 1) {
    //console.log("gdc case -", gdc);

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

export const createChordProgression = (scale, root, extentions, length) => {
  let scaleChords = getChordsFromScale(scale, root, extentions);

  //console.log(scaleChords);

  let chordIndexes = new Array(length)
    .fill(0)
    .map((e) => Math.floor(Math.random() * 6));

  chordIndexes.map((e, i) =>
    i > 0 && e === chordIndexes[i - 1] ? (e === 6 ? e - 1 : e + 1) : e
  );

  //console.log(chordIndexes);

  return chordIndexes.map((e) => scaleChords[e]);
};

export const patchLoader = async (input, setInstrumentsLoaded, moduleIndex) => {
  let instrumentLoaded = (isLoaded) => {
    setInstrumentsLoaded((prev) => {
      let a = [...prev];
      a[moduleIndex] = isLoaded;
      return a;
    });
  };

  instrumentLoaded(false);

  let instr;
  const patchRef = firebase.firestore().collection("patches").doc(input);

  patchRef.update({
    ld: firebase.firestore.FieldValue.increment(1),
    in: firebase.firestore.FieldValue.increment(1),
  });

  let patch = (await patchRef.get()).data();
  //console.log(patch);

  let options = patch.options;
  let instrfx = [];

  if (patch.base === "Sampler") {
    return await loadSamplerFromObject(
      patch,
      setInstrumentsLoaded,
      moduleIndex
    );
  } else {
    instrumentLoaded(true);
  }
  if (patch.base === "FM") {
    instr = new Tone.PolySynth(Tone.FMSynth, options);
  }
  if (patch.base === "AM") {
    instr = new Tone.PolySynth(Tone.AMSynth, options);
  }
  if (patch.base === "Mono") {
    instr = new Tone.PolySynth(Tone.MonoSynth, options);
  }
  if (patch.base === "Synth") {
    instr = new Tone.PolySynth(Tone.Synth, options);
  }
  if (patch.base === undefined) {
    instr = new Tone.PolySynth(patch);
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
  moduleIndex,
  nowLoaded
) => {
  let instrumentLoaded = (isLoaded, sampler) => {
    setInstrumentsLoaded((prev) => {
      let a = [...prev];
      a[moduleIndex] = isLoaded;
      return a;
    });

    //for PatchExplorer

    if (nowLoaded !== undefined && isLoaded && sampler) nowLoaded(sampler);
  };

  let missingFiles = [];

  instrumentLoaded(false);

  //console.log("Sampler!");

  let urlArray = await Promise.all(
    Object.keys(obj.urls).map(
      async (e, i) => await firebase.storage().ref(obj.urls[e]).getDownloadURL()
    )
  );

  urlArray.map((e, i) => {
    firebase
      .firestore()
      .collection("files")
      .doc(obj.urls[i])
      .update({
        ld: firebase.firestore.FieldValue.increment(1),
        in: firebase.firestore.FieldValue.increment(1),
      });
  });

  //console.log(urlArray);

  let urls = Object.fromEntries(
    urlArray.map((e, i) => [Object.keys(obj.urls)[i], e])
  );

  //console.log(urls);

  let sampler = new Tone.Sampler(urls, () =>
    instrumentLoaded(true, sampler)
  ).toDestination();

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
  moduleIndex,
  onLoad,
  setModules,
  setLabels
) => {
  //drum patch with stardard configuration
  let patchRef =
    typeof input === "string"
      ? firebase.firestore().collection("drumpatches").doc(input)
      : null;

  let patch = patchRef ? (await patchRef.get()).data() : input;

  patchRef &&
    patchRef.update({
      ld: firebase.firestore.FieldValue.increment(1),
      in: firebase.firestore.FieldValue.increment(1),
    });

  //console.log(patch);

  //handle empty urls obj

  if (JSON.stringify(patch.urls) === "{}") {
    setInstrumentsLoaded((prev) => {
      //console.log("======LOADED=======")
      let a = [...prev];
      a[moduleIndex] = true;
      return a;
    });
    return new Tone.Players();
  }

  //get urls from file ids

  let urlArray = await Promise.all(
    Object.keys(patch.urls).map(
      async (e, i) =>
        await firebase.storage().ref(patch.urls[e]).getDownloadURL()
    )
  );

  urlArray.map((e, i) => {
    firebase
      .firestore()
      .collection("files")
      .doc(Object.keys(patch.urls)[i])
      .update({
        ld: firebase.firestore.FieldValue.increment(1),
        in: firebase.firestore.FieldValue.increment(1),
      });
  });

  //console.log(urlArray);

  let urls = Object.fromEntries(
    urlArray.map((e, i) => [Object.keys(patch.urls)[i], e])
  );

  //console.log(urls);

  setInstrumentsLoaded((prev) => {
    //console.log("======LOADED=======")
    let a = [...prev];
    a[moduleIndex] = false;
    return a;
  });

  let drumPlayers = new Tone.Players(urls, () => {
    setInstrumentsLoaded((prev) => {
      //console.log("======LOADED=======")
      let a = [...prev];
      a[moduleIndex] = true;
      return a;
    });
    onLoad !== undefined && onLoad(drumPlayers);
  }).toDestination();

  setModules &&
    setModules((prev) => {
      let newModules = [...prev];
      if (
        JSON.stringify(newModules[moduleIndex].lbls) !==
        JSON.stringify(patch.lbls)
      )
        newModules[moduleIndex].lbls = patch.lbls;
      return newModules;
    });

  setLabels && setLabels(patch.lbls);

  drumPlayers.volume.value = patch.volume;

  return drumPlayers;
};

export const loadEffect = (type, options) => {
  //type as effects array index
  //console.log(options);
  return new Tone[effectTypes[type]](options);
};

export const detectPitch = (audioBuffer, callback) => {
  const detector = PitchDetector.forFloat32Array(audioBuffer.length);
  return detector.findPitch(
    audioBuffer.getChannelData(0),
    audioBuffer.sampleRate
  );
};

export const parseMidiFile = (file, setNotes) => {
  //console.log(file);
  let midifile = new Midi(file);

  let newNotes = midifile.tracks[0].notes.map((e) => {
    return {
      duration: e.duration,
      note: e.name,
      time: Tone.Time(e.time).toBarsBeatsSixteenths(),
      velocity: parseFloat(e.velocity.toFixed(2)),
    };
  });
  setNotes((prev) => [...prev, ...newNotes]);
};

export const encodeAudioFile = (aBuffer, format) => {
  let numOfChan = aBuffer.numberOfChannels,
    btwLength = aBuffer.length * numOfChan * 2 + 44,
    btwArrBuff = new ArrayBuffer(btwLength),
    btwView = new DataView(btwArrBuff),
    btwChnls = [],
    btwIndex,
    btwSample,
    btwOffset = 0,
    btwPos = 0;

  setUint32(0x46464952); // "RIFF"
  setUint32(btwLength - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(aBuffer.sampleRate);
  setUint32(aBuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit
  setUint32(0x61746164); // "data" - chunk
  setUint32(btwLength - btwPos - 4); // chunk length

  for (btwIndex = 0; btwIndex < aBuffer.numberOfChannels; btwIndex++)
    btwChnls.push(aBuffer.getChannelData(btwIndex));

  while (btwPos < btwLength) {
    for (btwIndex = 0; btwIndex < numOfChan; btwIndex++) {
      // interleave btwChnls
      btwSample = Math.max(-1, Math.min(1, btwChnls[btwIndex][btwOffset])); // clamp
      btwSample =
        (0.5 + btwSample < 0 ? btwSample * 32768 : btwSample * 32767) | 0; // scale to 16-bit signed int
      btwView.setInt16(btwPos, btwSample, true); // write 16-bit sample
      btwPos += 2;
    }
    btwOffset++; // next source sample
  }

  let wavHdr = lamejs.WavHeader.readHeader(new DataView(btwArrBuff));

  //Stereo
  let data = new Int16Array(btwArrBuff, wavHdr.dataOffset, wavHdr.dataLen / 2);
  let leftData = [];
  let rightData = [];
  for (let i = 0; i < data.length; i += 2) {
    leftData.push(data[i]);
    rightData.push(data[i + 1]);
  }
  var left = new Int16Array(leftData);
  var right = new Int16Array(rightData);

  if (format === "mp3") {
    //STEREO
    console.log(wavHdr.channels, left, right);

    if (wavHdr.channels === 2)
      return wavToMp3(wavHdr.channels, wavHdr.sampleRate, left, right);
    //MONO
    else if (wavHdr.channels === 1)
      return wavToMp3(wavHdr.channels, wavHdr.sampleRate, data);
  } else return new Blob([btwArrBuff], { type: "audio/wav" });

  function setUint16(data) {
    btwView.setUint16(btwPos, data, true);
    btwPos += 2;
  }

  function setUint32(data) {
    btwView.setUint32(btwPos, data, true);
    btwPos += 4;
  }
};

export const wavToMp3 = (channels, sampleRate, left, right = null) => {
  var buffer = [];
  var mp3enc = new lamejs.Mp3Encoder(channels, sampleRate, 128);
  var remaining = left.length;
  var samplesPerFrame = 1152;

  for (var i = 0; remaining >= samplesPerFrame; i += samplesPerFrame) {
    if (!right) {
      var mono = left.subarray(i, i + samplesPerFrame);
      var mp3buf = mp3enc.encodeBuffer(mono);
    } else {
      var leftChunk = left.subarray(i, i + samplesPerFrame);
      var rightChunk = right.subarray(i, i + samplesPerFrame);
      var mp3buf = mp3enc.encodeBuffer(leftChunk, rightChunk);
    }
    if (mp3buf.length > 0) {
      buffer.push(mp3buf); //new Int8Array(mp3buf));
    }
    remaining -= samplesPerFrame;
  }
  var d = mp3enc.flush();
  if (d.length > 0) {
    buffer.push(new Int8Array(d));
  }

  var mp3Blob = new Blob(buffer, { type: "audio/mp3" });

  return mp3Blob;
};

export const mapLogScale = (position, minp, maxp, minv, maxv) => {
  var scale = (maxv - minv) / (maxp - minp);

  return Math.exp(minv + scale * (position - minp));
};

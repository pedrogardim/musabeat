import * as Tone from "tone";

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

export const mapLogScale = (position, minp, maxp, minv, maxv) => {
  var scale = (maxv - minv) / (maxp - minp);

  return Math.exp(minv + scale * (position - minp));
};

export const generateRandomBeat = (
  length,
  subdiv,
  instrs,
  fullness,
  groove
) => {
  const beatArray = [];
  instrs.forEach((instr) => {
    let modelMsre = [];
    for (let msre = 0; msre < length; msre++) {
      if (msre === 0) {
        for (let beat = 0; beat < subdiv; beat++) {
          if (applyInstrRules(instr, msre, subdiv, beat, fullness, groove)) {
            let quarter = Math.floor((beat * 4) / subdiv);
            let sixteens = !quarter
              ? (beat * 16) / subdiv
              : ((beat * 16) / subdiv) % (quarter * 4);

            let note = {
              note: instr,
              time: `${msre}:${quarter}:${sixteens}`,
            };

            modelMsre.push(note);
            beatArray.push(note);
          }
        }
      } else if (msre % 4 === 3) {
        for (let beat = 0; beat < subdiv; beat++) {
          if (applyInstrRules(instr, msre, subdiv, beat, fullness, groove)) {
            let quarter = Math.floor((beat * 4) / subdiv);
            let sixteens = !quarter
              ? (beat * 16) / subdiv
              : ((beat * 16) / subdiv) % (quarter * 4);

            let note = {
              note: instr,
              time: `${msre}:${quarter}:${sixteens}`,
            };

            beatArray.push(note);
          }
        }
      } else {
        modelMsre.forEach((e) => {
          let note = { ...e };
          note.time =
            msre + ":" + e.time.split(":")[1] + ":" + e.time.split(":")[2];
          beatArray.push(note);
        });
      }
    }
  });
  //console.log(beatArray);
  return beatArray;
};

const applyInstrRules = (instr, msre, subdiv, beat, fullness, groove) => {
  let actualBeat = (beat / subdiv) * 4;
  //console.log(actualBeat);
  return (
    Math.random() <
    probMap(fullness, groove, msre % 4 === 3 ? 1 : 0)[instr][actualBeat]
  );
};

const probMap = (f, g, m) => ({
  //KD
  0: {
    0: 1,
    2: 0.75 + f * 0.25,
    2.25: 0.75 + f * 0.25,
    2.5: 0.75 + f * 0.25,
  },
  1: {
    0: 1,
    2: 0.75 + f * 0.25,
    2.25: 0.75 + f * 0.25,
    2.5: 0.75 + f * 0.25,
  },
  2: { 1: 1, 3: 0.75 + f * 0.25, 3.5: 0.1 + 0.6 * m, 3.75: 0.3 + 0.7 * m },
  3: { 1: 1, 3: 0.75 + f * 0.25, 3.5: 0.1 + 0.6 * m, 3.75: 0.3 + 0.7 * m },
  6: {
    0: 1,
    0.5: 0.8 + f * 0.2,
    1: 1,
    1.5: 0.8 + f * 0.2,
    2: 1,
    2.5: 0.8 + f * 0.2,
    3: 1,
    3.5: 0.8 + f * 0.2,
  },
});

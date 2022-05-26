import * as Tone from "tone";

import { PitchDetector } from "pitchy";

import { Midi } from "@tonejs/midi";

const lamejs = require("lamejs");

export const fileTypes = ["audio/wav", "audio/mpeg"];
export const fileExtentions = ["wav", "mp3"];
export const soundChannels = { 0: "Mono", 1: "Mono", 2: "Stereo" };

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

export const detectPitch = (audioBuffer, callback) => {
  const detector = PitchDetector.forFloat32Array(audioBuffer.length);

  let result = detector.findPitch(
    audioBuffer.getChannelData(0),
    audioBuffer.sampleRate
  );

  //keep result between C1 and B8

  if (result[0] < 33.5 || result[0] > 7902.13) {
    //make it C4
    result[0] = 261.6255653005986;
  }

  return result;
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

  let finalWav = new Blob([btwArrBuff], { type: "audio/wav" });

  if (format === "mp3") {
    //return wavToMp3(finalWav);

    //STEREO
    if (wavHdr.channels === 2)
      return wavToMp3(wavHdr.channels, wavHdr.sampleRate, left, right);
    //MONO
    else if (wavHdr.channels === 1)
      return wavToMp3(wavHdr.channels, wavHdr.sampleRate, data);
  } else return finalWav;

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

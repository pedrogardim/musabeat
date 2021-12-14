import React, { useState, useEffect, useRef, Fragment } from "react";
import * as Tone from "tone";
import "./Track.css";

import Draggable from "react-draggable";

import { colors } from "../../utils/materialPalette";

import { alpha } from "@mui/material/styles";

import {
  IconButton,
  Icon,
  Tooltip,
  TextField,
  Typography,
  Box,
  Paper,
} from "@mui/material";

import {
  scheduleSampler,
  scheduleMelody,
  scheduleAudioTrack,
  clearEvents,
} from "../../utils/TransportSchedule";

import {
  drumMapping,
  drumAbbreviations,
  encodeAudioFile,
} from "../../assets/musicutils";

import SamplerNote from "./SamplerNote";
import MelodyNote from "./MelodyNote";
import AudioClip from "./AudioClip";
import FileUploader from "../ui/Dialogs/FileUploader/FileUploader";

function Track(props) {
  const rowRef = useRef(null);
  const rowWrapperRef = useRef(null);

  const [trackRows, setTrackRows] = useState([]);
  const [gridPos, setGridPos] = useState([]);
  const [floatPos, setFloatPos] = useState([]);

  const [drawingNote, setDrawingNote] = useState(null);

  const [isMouseDown, setIsMouseDown] = useState(false);
  const [deletableNote, setDeletableNote] = useState(false);

  const [selection, setSelection] = useState([]);
  const [selectedNotes, setSelectedNotes] = useState([]);

  const [showingAll, setShowingAll] = useState(false);

  const [recTools, setRecTools] = useState(null);
  const [meterLevel, setMeterLevel] = useState(0);
  const [uploadingFiles, setUploadingFiles] = useState([]);

  const trackType = props.track.type;
  const isSelected = props.selectedTrack === props.index;

  const zoomSize = props.zoomPosition[1] - props.zoomPosition[0] + 1;

  const trackInstrument = props.instruments[props.selectedTrack];

  const loadTrackRows = () => {
    if (!props.instrument) return;
    let rows = [];

    if (trackType === 0) {
      let array = isSelected
        ? showingAll
          ? Object.keys(Array(20).fill(0)).map((e) => parseInt(e))
          : [...props.instrument._buffers._buffers.keys()].map((e) =>
              parseInt(e)
            )
        : [...new Set(props.track.score.map((item) => item.note))].sort(
            (a, b) => a - b
          );

      rows = array.map((e, i) => {
        return {
          note: e,
          player: props.instrument.has(e) ? props.instrument.player(e) : null,
          //wavepath: drawWave(props.instrument.player(e).buffer.toArray()),
          lbl: drumAbbreviations[e],
        };
      });
    }
    if (trackType === 1) {
      let array = isSelected
        ? Array(88)
            .fill(0)
            .map((e, i) => 108 - i)
        : [...new Set(props.track.score.map((item) => item.note))].sort(
            (a, b) => a - b
          );

      rows = array.map((e, i) => {
        return {
          index: e,
          note: e,
          lbl: Tone.Frequency(e, "midi").toNote(),
        };
      });
    }
    if (trackType === 2) {
      rows = [
        {
          note: 0,
          lbl: "A",
        },
      ];
    }
    setTrackRows(rows);
  };

  const scheduleNotes = () => {
    !props.track.muted
      ? trackType === 0
        ? scheduleSampler(
            props.track.score,
            props.instrument,
            Tone.Transport,
            props.track.id
          )
        : trackType === 1
        ? scheduleMelody(
            props.track.score,
            props.instrument,
            Tone.Transport,
            props.track.id
          )
        : scheduleAudioTrack(
            props.track.score,
            props.instrument,
            Tone.Transport,
            props.track.id
          )
      : clearEvents(props.track.id);
  };

  const playNote = (note) => {
    if (props.track.type === 0) {
      if (
        trackRows[note] === undefined ||
        trackRows[note] === null ||
        !props.instrument.has(trackRows[note].note)
      )
        return;
      props.instrument.player(trackRows[note].note).start();
    } else {
      props.instrument.triggerAttack(Tone.Frequency(note, "midi"));
    }

    if (!props.isRecording) return;

    if (trackType === 0) {
      let newNote = {
        note: trackRows[note].note,
        time: Tone.Time(
          Tone.Time(Tone.Transport.seconds).quantize(`${props.gridSize}n`)
        ).toBarsBeatsSixteenths(),
      };

      props.setTracks((prev) => {
        let newTracks = [...prev];
        let find = newTracks[props.selectedTrack].score.findIndex(
          (e) => e.note === newNote.note && e.time === newNote.time
        );
        //console.log(find);
        if (find !== -1) return prev;
        newTracks[props.selectedTrack].score = [...newTracks[0].score, newNote];
        return newTracks;
      });
    } else {
      let drawingNote = {
        note: note,
        time: Tone.Time(Tone.Transport.seconds).quantize(`${props.gridSize}n`),
      };

      //setDrawingNote(drawingNote);
    }
  };

  const releaseNote = (note) => {
    if (trackType === 1) {
      props.instrument.triggerRelease(Tone.Frequency(note, "midi"));
    }
  };

  const toggleAudioRecording = () => {
    if (!recTools) return;
    if (props.isRecording) {
      let newAudioIndex = 0;
      while (props.instrument.has(newAudioIndex)) {
        newAudioIndex++;
      }
      let dn = { time: Tone.Transport.position, clip: newAudioIndex };
      setDrawingNote(dn);

      //recTools.userMedia.open().then(() => recTools.recorder.start());
      recTools.recorder.start();
    } else {
      recTools.recorder.stop().then((blob) => {
        let filename =
          (props.track.name ? props.track.name : "Audio") +
          "_" +
          drawingNote.clip +
          1;
        let file = new File([blob], filename);
        //setUploadingFiles((prev) => [...prev, file]);
        blob.arrayBuffer().then((arrayBuffer) => {
          Tone.getContext().rawContext.decodeAudioData(
            arrayBuffer,
            (audiobuffer) => {
              //let finalFile = encodeAudioFile(audiobuffer, "mp3");
              //console.log(drawingNote);
              props.instrument.add(drawingNote.clip, audiobuffer);
              props.setPendingUploadFiles((prev) => [
                ...prev,
                { file: file, index: drawingNote.clip, track: props.index },
              ]);
              /* props.setInstrumentsInfo((prev) => {
                let newInfo = [...prev];
                newInfo[props.index].filesInfo[props.drawingNote.clip] =
                  fileInfo;
                return newInfo;
              }); */
              props.setTracks((prev) => {
                let newTracks = [...prev];
                let newNote = {
                  ...drawingNote,
                  duration: parseFloat(audiobuffer.duration.toFixed(3)),
                  offset: 0,
                };

                newTracks[props.index].score = [
                  ...newTracks[props.index].score,
                  newNote,
                ];
                return newTracks;
              });
              setDrawingNote(null);
              //recTools.userMedia.close();
            }
          );
        });
      });
    }
  };

  /* ================================================================================== */
  /* ================================================================================== */
  /* =============================MOUSE EVENTS========================================= */
  /* ================================================================================== */
  /* ================================================================================== */

  const handleHover = (event) => {
    let hoveredPos = [
      event.pageY - rowRef.current.getBoundingClientRect().top,
      event.pageX -
        rowRef.current.getBoundingClientRect().left +
        (trackType === 0
          ? rowRef.current.offsetWidth / (zoomSize * props.gridSize * 2)
          : 0),
    ];

    let pos = [
      parseFloat(
        Math.abs(
          (hoveredPos[0] / rowRef.current.scrollHeight) * trackRows.length
        ).toFixed(3)
      ),
      parseFloat(
        Math.abs(
          (hoveredPos[1] / rowRef.current.offsetWidth) *
            zoomSize *
            props.gridSize
        ).toFixed(3)
      ) +
        props.zoomPosition[0] * props.gridSize,
    ];

    setFloatPos(pos);

    let gridPos = pos.map((e) => Math.floor(e));

    setGridPos((prev) =>
      JSON.stringify(prev) === JSON.stringify(gridPos) ? prev : gridPos
    );

    if (props.cursorMode === "edit" && trackType === 0) {
      let find =
        props.track.score.findIndex(
          (e) =>
            (e.note === trackRows[gridPos[0]].note ||
              e.note === 108 - gridPos[0]) &&
            e.time ===
              Tone.Time(
                (gridPos[1] * Tone.Time("1m").toSeconds()) / props.gridSize
              ).toBarsBeatsSixteenths()
        ) !== -1;

      setDeletableNote((prev) => (prev === find ? prev : find));
    }
  };

  const handleMouseDown = (e) => {
    //console.log(e && e.target.className);

    setIsMouseDown(true);

    let isClickOnNote = e && e.target.className.includes("track-score-note");

    if (!isClickOnNote) {
      setSelectedNotes([]);
    }

    if (
      (e && e.target.className.includes("track-score-note-handle")) ||
      props.cursorMode !== "edit"
    )
      return;

    //console.log("mousedown triggered");

    if (trackType === 0) {
      let newNote = {
        note: trackRows[gridPos[0]].note,
        time: Tone.Time(
          (gridPos[1] * Tone.Time("1m").toSeconds()) / props.gridSize
        ).toBarsBeatsSixteenths(),
      };

      props.setTracks((prev) => {
        let newTracks = [...prev];

        newTracks[props.index].score = deletableNote
          ? newTracks[props.index].score.filter(
              (e) => e.note !== newNote.note || e.time !== newNote.time
            )
          : [...newTracks[props.index].score, { ...newNote }];

        return newTracks;
      });
    } else {
      let newNote = {
        note: 108 - gridPos[0],
        time: (gridPos[1] * Tone.Time("1m").toSeconds()) / props.gridSize,
      };
      /* if (isClickOnNote && deletableNote) {
           console.log(
            "isClickOnNote",
            isClickOnNote,
            "deletableNote",
            deletableNote
          ); 

          props.setTracks((prev) => {
            let newTracks = [...prev];

            newTracks[props.index].score = newTracks[
              props.index
            ].score.filter(
              (e) =>
                e.note !== newNote.note ||
                e.time !== Tone.Time(newNote.time).toBarsBeatsSixteenths()
            );

            return newTracks;
          });
        } else  */
      if (!isClickOnNote) {
        //console.log("drawingNote");
        setDrawingNote(newNote);
      }
    }
  };

  const handleMouseUp = (e) => {
    //console.log(e.target);
    setIsMouseDown(false);
    if (trackType === 1 && drawingNote && props.cursorMode === "edit") {
      let newNote = { ...drawingNote };

      let duration =
        (gridPos[1] * Tone.Time("1m").toSeconds()) / props.gridSize -
          newNote.time ===
        0
          ? Tone.Time("1m").toSeconds() / props.gridSize
          : ((gridPos[1] + 1) * Tone.Time("1m").toSeconds()) / props.gridSize -
            newNote.time;

      newNote.duration = Tone.Time(duration).toBarsBeatsSixteenths();

      newNote.time = Tone.Time(newNote.time).toBarsBeatsSixteenths();

      props.setTracks((prev) => {
        let newTracks = [...prev];
        let find = newTracks[props.index].score.findIndex(
          (e) => e.note === newNote.note && e.time === newNote.time
        );
        newTracks[props.index].score =
          find === -1
            ? [...newTracks[props.index].score, { ...newNote }]
            : newTracks[props.index].score.filter(
                (e) => e.note !== newNote.note || e.time !== newNote.time
              );

        return newTracks;
      });
      setDrawingNote(null);
    }
  };

  const onGridPosChange = () => {
    //drag note input
    if (isMouseDown) {
      if (props.cursorMode === "edit") {
        trackType === 0 && handleMouseDown();
      } else {
        //props.setSelection((prev) => [
        //  prev[0],
        //  (gridPos[1] * Tone.Time("1m").toSeconds()) / props.gridSize,
        //]);
      }
    }
  };

  /* ================================================================================== */
  /* ================================================================================== */
  /* ================================USEEFFECTS======================================== */
  /* ================================================================================== */
  /* ================================================================================== */

  useEffect(() => {
    //console.log("change detected on trackRow");
    scheduleNotes();
  }, [props.instrument, props.track, props.track.score, props.isLoaded]);

  useEffect(() => {
    //console.log("change detected on trackRow");
    trackType === 2 && scheduleNotes();
  }, [props.isPlaying]);

  useEffect(() => {
    loadTrackRows();
  }, [
    props.instrument,
    props.instruments,
    props.track,
    props.isLoaded,
    props.selectedTrack,
    showingAll,
  ]);

  useEffect(() => {
    onGridPosChange();
  }, [gridPos]);

  useEffect(() => {
    //console.log("props.instrument", props.instrument);
    trackRows && props.setTrackRows(trackRows);
    props.setPlayNoteFunction &&
      props.setPlayNoteFunction([playNote, releaseNote]);
  }, [props.instrument, trackRows]);

  useEffect(() => {
    //console.log(drawingNote);
  }, [drawingNote]);

  useEffect(() => {
    setDeletableNote(false);
  }, [props.cursorMode]);

  useEffect(() => {
    props.selectedNotes && setSelectedNotes(props.selectedNotes);
  }, [props.selectedNotes]);

  useEffect(() => {
    rowWrapperRef.current.scrollTop =
      rowWrapperRef.current.scrollHeight / 2 -
      rowWrapperRef.current.offsetHeight / 2;
  }, [props.selectedTrack, rowWrapperRef.current]);

  useEffect(() => {
    props.setIsMouseDown(isMouseDown);
  }, [isMouseDown]);

  useEffect(() => {
    if (trackType === 2) toggleAudioRecording();
  }, [props.isRecording]);

  useEffect(() => {
    if (trackType === 2) {
      const recorder = new Tone.Recorder();
      const meter = new Tone.Meter({ normalRange: true });
      const userMedia = new Tone.UserMedia().fan(recorder, meter);
      userMedia.open();
      let tools = { recorder: recorder, userMedia: userMedia, meter: meter };
      setRecTools(tools);
      let meterInterval = setInterval(() => {
        setMeterLevel(meter.getValue());
      }, 16);
      return () => {
        userMedia.close();
        clearInterval(meterInterval);
      };
    }
  }, []);

  /* ================================================================================== */
  /* ================================================================================== */
  /* ================================JSX=============================================== */
  /* ================================================================================== */
  /* ================================================================================== */

  return (
    <div
      className="track-grid-row-wrapper"
      ref={rowWrapperRef}
      style={{
        overflowY: trackType === 1 && isSelected && "overlay",
        maxHeight: !isSelected && "10%",
        cursor: props.cursorMode === "edit" && deletableNote && "not-allowed",
      }}
    >
      <Box
        className="track-grid-row"
        ref={rowRef}
        onMouseMove={handleHover}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseUp}
        onClick={handleMouseUp}
        onMouseUp={handleMouseUp}
        disabled
      >
        {trackRows.map((row, rowIndex) => (
          <Box
            className="track-inner-row"
            sx={(theme) => ({
              //borderTop: trackType === 1 && "1px solid rgba(0, 0, 0,0.2)",
              boxShadow: theme.palette.mode === "light" && 0,
              borderRadius: 0,
              zIndex: 0,
              borderBottom: trackType === 1 && 1,
              borderColor:
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255,0.2)"
                  : "rgba(0, 0, 0,0.2)",

              minHeight: trackType === 1 && "6.66666%",
              bgcolor:
                trackType === 1 &&
                (rowIndex % 12 === 2 ||
                  rowIndex % 12 === 4 ||
                  rowIndex % 12 === 6 ||
                  rowIndex % 12 === 9 ||
                  rowIndex % 12 === 11) &&
                (theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.08)"
                  : colors[props.track.color][800] + "3a"),
            })}
            key={rowIndex + "ri"}
          >
            <Typography
              className="track-inner-row-label"
              onClick={() => setShowingAll((prev) => !prev)}
              sx={(theme) => ({
                color:
                  trackType === 0 && !props.instrument.has(row.note)
                    ? "lightgrey"
                    : theme.palette.mode === "dark"
                    ? "white"
                    : colors[props.track.color][900],
              })}
            >
              {row.lbl}
            </Typography>
            {(trackType === 0 || trackType === 2) && (
              <Box
                sx={{ bgcolor: "text.primary" }}
                className="track-inner-row-line"
              />
            )}
          </Box>
        ))}
        {rowRef.current &&
          props.track.score.length > 0 &&
          props.track.score
            //.filter((e) => e.time.split(":")[0] < props.sessionSize)
            .map((note, noteIndex) =>
              trackType === 0 ? (
                <SamplerNote
                  key={noteIndex}
                  rowRef={rowRef}
                  trackRows={trackRows}
                  note={note}
                  track={props.track}
                  sessionSize={props.sessionSize}
                  gridSize={props.gridSize}
                  deletableNote={deletableNote}
                  index={noteIndex}
                  selectedTrack={props.selectedTrack}
                  selectedNotes={props.selectedNotes}
                  zoomPosition={props.zoomPosition}
                  a={rowRef.current}
                  exists={props.instrument.has(note.note)}
                />
              ) : trackType === 1 ? (
                <MelodyNote
                  key={noteIndex}
                  rowRef={rowRef}
                  trackRows={trackRows}
                  note={note}
                  drawingNote={drawingNote}
                  track={props.track}
                  sessionSize={props.sessionSize}
                  gridSize={props.gridSize}
                  gridPos={gridPos}
                  deletableNote={deletableNote}
                  setDrawingNote={setDrawingNote}
                  index={noteIndex}
                  setTracks={props.setTracks}
                  isMouseDown={isMouseDown}
                  selectedTrack={props.selectedTrack}
                  selectedNotes={props.selectedNotes}
                  setSelectedNotes={props.setSelectedNotes}
                  zoomPosition={props.zoomPosition}
                  a={rowRef.current}
                />
              ) : (
                props.instrument &&
                props.instrument.has(note.clip) && (
                  <AudioClip
                    key={noteIndex}
                    rowRef={rowRef}
                    trackRows={trackRows}
                    note={note}
                    player={props.instrument.player(note.clip)}
                    drawingNote={drawingNote}
                    track={props.track}
                    sessionSize={props.sessionSize}
                    gridSize={props.gridSize}
                    gridPos={gridPos}
                    deletableNote={deletableNote}
                    setDrawingNote={setDrawingNote}
                    index={noteIndex}
                    setTracks={props.setTracks}
                    isMouseDown={isMouseDown}
                    selectedTrack={props.selectedTrack}
                    selectedNotes={props.selectedNotes}
                    setSelectedNotes={props.setSelectedNotes}
                    zoomPosition={props.zoomPosition}
                    fileInfo={props.instrumentInfo.filesInfo[note.clip]}
                    floatPos={floatPos}
                    loaded={true}
                  />
                )
              )
            )}
        {rowRef.current &&
          props.selectedTrack !== null &&
          props.cursorMode === "edit" &&
          !deletableNote &&
          (trackType === 0 ? (
            <SamplerNote
              ghost
              rowRef={rowRef}
              trackRows={trackRows}
              gridPos={gridPos}
              track={props.track}
              sessionSize={props.sessionSize}
              gridSize={props.gridSize}
              selectedTrack={props.selectedTrack}
              zoomPosition={props.zoomPosition}
            />
          ) : trackType === 1 ? (
            <MelodyNote
              ghost
              rowRef={rowRef}
              trackRows={trackRows}
              gridPos={gridPos}
              drawingNote={drawingNote}
              track={props.track}
              sessionSize={props.sessionSize}
              gridPos={gridPos}
              gridSize={props.gridSize}
              setTracks={props.setTracks}
              selectedNotes={[]}
              selectedTrack={props.selectedTrack}
              setDrawingNote={setDrawingNote}
              zoomPosition={props.zoomPosition}
            />
          ) : (
            <></>
          ))}

        {rowRef.current && trackType === 2 && (
          <>
            <div
              style={{
                position: "absolute",
                left: -32,
                bottom: 0,
                width: 16,
                height: rowRef.current.offsetHeight * meterLevel,
                backgroundColor: "#3f51b5",
              }}
            />

            {props.isRecording && drawingNote && (
              <AudioClip
                recording
                note={drawingNote}
                rowRef={rowRef}
                trackRows={trackRows}
                zoomPosition={props.zoomPosition}
                player={{ buffer: { loaded: "" } }}
                track={props.track}
                fileInfo={{}}
              />
            )}
          </>
        )}
      </Box>
      <FileUploader
        open={uploadingFiles.length > 0}
        files={uploadingFiles}
        setUploadingFiles={setUploadingFiles}
        track={props.track}
        instrument={props.instrument}
        setInstrumentsInfo={props.setInstrumentsInfo}
        setTracks={props.setTracks}
        drawingNote={drawingNote}
        index={props.index}
        /* setInstrumentLoaded={props.setInstrumentLoaded}
        onInstrumentMod={props.onInstrumentMod} 
        updateOnFileLoaded={props.updateOnFileLoaded}*/
      />
    </div>
  );
}

const drawWave = (wavearray, setWavePath) => {
  if (!wavearray.length) {
    return;
  }

  let pathstring = "M 0 16 ";

  let wave = wavearray;
  let scale = wave.length / 64;

  let yZoom = 2;

  for (let x = 0; x < 64; x++) {
    if (Math.abs(wave[Math.floor(x * scale)]) > 0.02) {
      pathstring +=
        "L " +
        x +
        " " +
        (wave[Math.floor(x * scale)] * 16 + 16 / yZoom) * yZoom +
        " ";
    }
  }

  return pathstring;
};

export default Track;

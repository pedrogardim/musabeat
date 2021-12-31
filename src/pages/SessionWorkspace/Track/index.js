import React, { useState, useEffect, useRef, useContext } from "react";
import * as Tone from "tone";
import "./Track.css";

import { colors } from "../../utils/materialPalette";

import { Typography, Box } from "@mui/material";

import {
  scheduleSampler,
  scheduleMelody,
  scheduleAudioTrack,
  clearEvents,
} from "../../utils/TransportSchedule";

import { drumAbbreviations } from "../../assets/musicutils";

import SamplerNote from "./SamplerNote";
import MelodyNote from "./MelodyNote";
import AudioClip from "./AudioClip";
import FileEditor from "../InstrumentEditor/FileEditor";

import { WSContext } from "../ui/Workspace/Workspace";

function Track(props) {
  const rowRef = useRef(null);
  const rowWrapperRef = useRef(null);

  const [gridPos, setGridPos] = useState([]);
  const [floatPos, setFloatPos] = useState([]);

  const [drawingNote, setDrawingNote] = useState(null);

  const [deletableNote, setDeletableNote] = useState(false);
  const [zoomY, setZoomY] = useState(1);

  const [recTools, setRecTools] = useState(null);
  const [meterLevel, setMeterLevel] = useState(0);

  const {
    selectedTrack,
    tracks,
    trackOptions,
    instruments,
    setInstrumentsLoaded,
    instrumentsInfo,
    zoomPosition,
    gridSize,
    sessionSize,
    setTracks,
    isPlaying,
    isRecording,
    setPendingUploadFiles,
    setInstrumentsInfo,
    setAddFileDialog,
    cursorMode,
    isLoaded,
    trackRows,
    setTrackRows,
    isMouseDown,
    setIsMouseDown,
    setPlayNoteFunction,
    movingSelDelta,
    addFileDialog,
    selectedNotes,
    setSelectedNotes,
  } = useContext(WSContext);

  const zoomSize = zoomPosition[1] - zoomPosition[0] + 1;

  const track = tracks[selectedTrack];
  const trackInstrument = instruments[selectedTrack];
  const trackType = track.type;

  const instrumentInfo = instrumentsInfo[selectedTrack];

  const setInstrumentLoaded = (state) =>
    setInstrumentsLoaded((prev) => {
      let a = [...prev];
      a[selectedTrack] = state;
      return a;
    });
  const loadTrackRows = () => {
    if (!trackInstrument) return;

    let rows = [];

    if (trackType === 0) {
      let array = trackOptions.showingAll
        ? Object.keys(Array(20).fill(0)).map((e) => parseInt(e))
        : [...trackInstrument._buffers._buffers.keys()]
            .map((e) => parseInt(e))
            .sort((a, b) => a - b);

      rows = array.map((e, i) => {
        return {
          note: e,
          player: trackInstrument.has(e) ? trackInstrument.player(e) : null,
          //wavepath: drawWave(trackInstrument.player(e).buffer.toArray()),
          lbl: drumAbbreviations[e],
        };
      });
    }
    if (trackType === 1) {
      let array = Array(88)
        .fill(0)
        .map((e, i) => 108 - i);

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
    !track.muted
      ? trackType === 0
        ? scheduleSampler(
            track.score,
            trackInstrument,
            Tone.Transport,
            track.id
          )
        : trackType === 1
        ? scheduleMelody(track.score, trackInstrument, Tone.Transport, track.id)
        : scheduleAudioTrack(
            track.score,
            trackInstrument,
            Tone.Transport,
            track.id
          )
      : clearEvents(track.id);
  };

  const playNote = (note) => {
    if (trackType === 0) {
      if (
        trackRows[note] === undefined ||
        trackRows[note] === null ||
        !trackInstrument.has(trackRows[note].note)
      )
        return;
      trackInstrument.player(trackRows[note].note).start();
    } else {
      trackInstrument.triggerAttack(Tone.Frequency(note, "midi"));
    }

    if (!isRecording) return;

    if (trackType === 0) {
      let newNote = {
        note: trackRows[note].note,
        time: Tone.Time(
          Tone.Time(Tone.Transport.seconds).quantize(`${gridSize}n`)
        ).toBarsBeatsSixteenths(),
      };

      setTracks((prev) => {
        let newTracks = [...prev];
        let find = newTracks[selectedTrack].score.findIndex(
          (e) => e.note === newNote.note && e.time === newNote.time
        );
        //console.log(find);
        if (find !== -1) return prev;
        newTracks[selectedTrack].score = [...newTracks[0].score, newNote];
        return newTracks;
      });
    } else {
      let drawingNote = {
        note: note,
        time: Tone.Time(Tone.Transport.seconds).quantize(`${gridSize}n`),
      };

      //setDrawingNote(drawingNote);
    }
  };

  const releaseNote = (note) => {
    if (trackType === 1) {
      trackInstrument.triggerRelease(Tone.Frequency(note, "midi"));
    }
  };

  const toggleAudioRecording = () => {
    if (!recTools) return;
    if (isRecording) {
      let newAudioIndex = 0;
      while (trackInstrument.has(newAudioIndex)) {
        newAudioIndex++;
      }
      let dn = { time: Tone.Transport.position, clip: newAudioIndex };
      setDrawingNote(dn);

      //recTools.userMedia.open().then(() => recTools.recorder.start());
      recTools.recorder.start();
    } else {
      recTools.recorder.stop().then((blob) => {
        let filename =
          (track.name ? track.name : "Audio") + "_" + drawingNote.clip + 1;
        let file = new File([blob], filename);
        blob.arrayBuffer().then((arrayBuffer) => {
          Tone.getContext().rawContext.decodeAudioData(
            arrayBuffer,
            (audiobuffer) => {
              //let finalFile = encodeAudioFile(audiobuffer, "mp3");
              //console.log(drawingNote);
              trackInstrument.add(drawingNote.clip, audiobuffer);
              setPendingUploadFiles((prev) => [
                ...prev,
                { file: file, index: drawingNote.clip, track: selectedTrack },
              ]);
              /* setInstrumentsInfo((prev) => {
                let newInfo = [...prev];
                newInfo[selectedTrack].filesInfo[drawingNote.clip] =
                  fileInfo;
                return newInfo;
              }); */
              setTracks((prev) => {
                let newTracks = [...prev];
                let newNote = {
                  ...drawingNote,
                  duration: parseFloat(audiobuffer.duration.toFixed(3)),
                  offset: 0,
                };

                newTracks[selectedTrack].score = [
                  ...newTracks[selectedTrack].score,
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

  const onFileClick = (fileId, fileUrl, audiobuffer, index, data) => {
    let newAudioIndex = 0;
    while (trackInstrument.has(newAudioIndex)) {
      newAudioIndex++;
    }

    trackInstrument.add(newAudioIndex, audiobuffer);

    setTracks((prev) => {
      let newTracks = [...prev];
      let newNote = {
        time: Tone.Transport.position,
        clip: newAudioIndex,
        duration: parseFloat(audiobuffer.duration.toFixed(3)),
        offset: 0,
      };

      newTracks[selectedTrack].score = [
        ...newTracks[selectedTrack].score,
        newNote,
      ];

      newTracks[selectedTrack].instrument.urls[newAudioIndex] = fileId;
      return newTracks;
    });

    setInstrumentsInfo((prev) => {
      let newII = [...prev];
      newII[selectedTrack].filesInfo[newAudioIndex] = data;
      if (!newII[selectedTrack].patch) {
        newII[selectedTrack].patch = { urls: { [newAudioIndex]: fileId } };
      } else {
        newII[selectedTrack].patch.urls[newAudioIndex] = fileId;
      }
      return newII;
    });

    setAddFileDialog(null);
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
          ? rowRef.current.offsetWidth / (zoomSize * gridSize * 2)
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
          (hoveredPos[1] / rowRef.current.offsetWidth) * zoomSize * gridSize
        ).toFixed(3)
      ) +
        zoomPosition[0] * gridSize,
    ];

    setFloatPos(pos);

    let gridPos = pos.map((e) => Math.floor(e));

    setGridPos((prev) =>
      JSON.stringify(prev) === JSON.stringify(gridPos) ? prev : gridPos
    );

    if (cursorMode === "edit" && trackType === 0) {
      let find =
        track.score.findIndex(
          (e) =>
            (e.note === trackRows[gridPos[0]].note ||
              e.note === 108 - gridPos[0]) &&
            e.time ===
              Tone.Time(
                (gridPos[1] * Tone.Time("1m").toSeconds()) / gridSize
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
      cursorMode !== "edit"
    )
      return;

    //console.log("mousedown triggered");

    if (trackType === 0) {
      let newNote = {
        note: trackRows[gridPos[0]].note,
        time: Tone.Time(
          (gridPos[1] * Tone.Time("1m").toSeconds()) / gridSize
        ).toBarsBeatsSixteenths(),
      };

      setTracks((prev) => {
        let newTracks = [...prev];

        newTracks[selectedTrack].score = deletableNote
          ? newTracks[selectedTrack].score.filter(
              (e) => e.note !== newNote.note || e.time !== newNote.time
            )
          : [...newTracks[selectedTrack].score, { ...newNote }];

        return newTracks;
      });
      return;
    } else {
      let newNote = {
        note: 108 - gridPos[0],
        time: (gridPos[1] * Tone.Time("1m").toSeconds()) / gridSize,
      };
      /* if (isClickOnNote && deletableNote) {
           console.log(
            "isClickOnNote",
            isClickOnNote,
            "deletableNote",
            deletableNote
          ); 

          setTracks((prev) => {
            let newTracks = [...prev];

            newTracks[selectedTrack].score = newTracks[
              selectedTrack
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
      return;
    }
  };

  const handleMouseUp = (e) => {
    //console.log(e.target);
    setIsMouseDown(false);
    if (trackType === 1 && drawingNote && cursorMode === "edit") {
      let newNote = { ...drawingNote };

      let duration =
        (gridPos[1] * Tone.Time("1m").toSeconds()) / gridSize - newNote.time ===
        0
          ? Tone.Time("1m").toSeconds() / gridSize
          : ((gridPos[1] + 1) * Tone.Time("1m").toSeconds()) / gridSize -
            newNote.time;

      newNote.duration = Tone.Time(duration).toBarsBeatsSixteenths();

      newNote.time = Tone.Time(newNote.time).toBarsBeatsSixteenths();

      setTracks((prev) => {
        let newTracks = [...prev];
        let find = newTracks[selectedTrack].score.findIndex(
          (e) => e.note === newNote.note && e.time === newNote.time
        );
        newTracks[selectedTrack].score =
          find === -1
            ? [...newTracks[selectedTrack].score, { ...newNote }]
            : newTracks[selectedTrack].score.filter(
                (e) => e.note !== newNote.note || e.time !== newNote.time
              );

        return newTracks;
      });
      setDrawingNote(null);
    }
  };

  const handleWheel = (e) => {
    /* console.log(e); */
    /* e.preventDefault();
    e.nativeEvent.preventDefault();
    e.stopPropagation(); */
    if (!e.metaKey && !e.ctrlKey) return;

    let minZoom = rowWrapperRef.current.offsetHeight / (88 * 18);

    setZoomY((prev) => {
      let value =
        prev + e.deltaY / 50 > 10
          ? 10
          : prev + e.deltaY / 50 < minZoom
          ? minZoom
          : prev + e.deltaY / 50;

      let newScrollTop = (rowWrapperRef.current.scrollTop * value) / prev;

      rowWrapperRef.current.scrollTop = newScrollTop;

      return value;
    });

    /*  e.preventDefault();
    e.nativeEvent.preventDefault();
    e.stopPropagation(); */
  };

  const onGridPosChange = () => {
    //drag note input
    if (isMouseDown) {
      if (cursorMode === "edit") {
        trackType === 0 && handleMouseDown();
      } else {
        //setSelection((prev) => [
        //  prev[0],
        //  (gridPos[1] * Tone.Time("1m").toSeconds()) / gridSize,
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
  }, [trackInstrument, track, track.score, isLoaded]);

  useEffect(() => {
    //console.log("change detected on trackRow");
    trackType === 2 && scheduleNotes();
  }, [isPlaying]);

  useEffect(() => {
    loadTrackRows();
  }, [
    trackInstrument,
    instruments,
    track,
    isLoaded,
    selectedTrack,
    trackOptions.showingAll,
  ]);

  useEffect(() => {
    onGridPosChange();
  }, [gridPos]);

  useEffect(() => {
    //console.log("trackInstrument", trackInstrument);
    setPlayNoteFunction && setPlayNoteFunction([playNote, releaseNote]);
  }, [trackInstrument, trackRows]);

  useEffect(() => {
    //console.log(drawingNote);
  }, [drawingNote]);

  useEffect(() => {
    setDeletableNote(false);
  }, [cursorMode]);

  useEffect(() => {
    rowWrapperRef.current.scrollTop =
      rowWrapperRef.current.scrollHeight / 2 -
      rowWrapperRef.current.offsetHeight / 2;
  }, [selectedTrack]);

  useEffect(() => {
    if (trackType === 2) toggleAudioRecording();
  }, [isRecording]);

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

  useEffect(() => {
    //console.log(zoomY);
  }, [zoomY]);

  /* ================================================================================== */
  /* ================================================================================== */
  /* ================================JSX=============================================== */
  /* ================================================================================== */
  /* ================================================================================== */

  return (
    <div
      className="track-grid-row-wrapper"
      ref={rowWrapperRef}
      onWheel={handleWheel}
      tabIndex={-1}
      style={{
        overflowY: trackType === 1 && "overlay",
        cursor: cursorMode === "edit" && deletableNote && "not-allowed",
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
        /*         style={{ maxHeight: trackType === 1 && trackRows.length * 17 * zoomY }}
         */
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

              minHeight: trackType === 1 && 16 * zoomY,
              bgcolor:
                trackType === 1 &&
                (rowIndex % 12 === 2 ||
                  rowIndex % 12 === 4 ||
                  rowIndex % 12 === 6 ||
                  rowIndex % 12 === 9 ||
                  rowIndex % 12 === 11) &&
                (theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.08)"
                  : colors[track.color][800] + "3a"),
            })}
            key={rowIndex}
          >
            <Typography
              className="track-inner-row-label"
              sx={(theme) => ({
                color:
                  trackType === 0 && !trackInstrument.has(row.note)
                    ? "lightgrey"
                    : theme.palette.mode === "dark"
                    ? "white"
                    : colors[track.color][900],
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
          track.score.length > 0 &&
          track.score
            //.filter((e) => e.time.split(":")[0] < sessionSize)
            .map((note, noteIndex) =>
              trackType === 0 ? (
                <SamplerNote
                  key={noteIndex}
                  rowRef={rowRef}
                  trackRows={trackRows}
                  note={note}
                  track={track}
                  sessionSize={sessionSize}
                  gridSize={gridSize}
                  deletableNote={deletableNote}
                  index={noteIndex}
                  selectedTrack={selectedTrack}
                  selectedNotes={selectedNotes}
                  zoomPosition={zoomPosition}
                  movingSelDelta={movingSelDelta}
                  a={rowRef.current}
                  exists={trackInstrument.has(note.note)}
                />
              ) : trackType === 1 ? (
                <MelodyNote
                  key={noteIndex}
                  rowRef={rowRef}
                  note={note}
                  drawingNote={drawingNote}
                  gridPos={gridPos}
                  deletableNote={deletableNote}
                  setDrawingNote={setDrawingNote}
                  index={noteIndex}
                />
              ) : (
                trackInstrument &&
                trackInstrument.has(note.clip) && (
                  <AudioClip
                    key={noteIndex}
                    rowRef={rowRef}
                    trackRows={trackRows}
                    note={note}
                    player={trackInstrument.player(note.clip)}
                    drawingNote={drawingNote}
                    track={track}
                    sessionSize={sessionSize}
                    gridSize={gridSize}
                    gridPos={gridPos}
                    deletableNote={deletableNote}
                    setDrawingNote={setDrawingNote}
                    index={noteIndex}
                    setTracks={setTracks}
                    isMouseDown={isMouseDown}
                    selectedTrack={selectedTrack}
                    selectedNotes={selectedNotes}
                    setSelectedNotes={setSelectedNotes}
                    zoomPosition={zoomPosition}
                    fileInfo={instrumentInfo.filesInfo[note.clip]}
                    movingSelDelta={movingSelDelta}
                    floatPos={floatPos}
                    loaded={true}
                  />
                )
              )
            )}
        {rowRef.current &&
          selectedTrack !== null &&
          cursorMode === "edit" &&
          !deletableNote &&
          (trackType === 0 ? (
            <SamplerNote
              ghost
              rowRef={rowRef}
              trackRows={trackRows}
              gridPos={gridPos}
              track={track}
              sessionSize={sessionSize}
              gridSize={gridSize}
              selectedTrack={selectedTrack}
              zoomPosition={zoomPosition}
            />
          ) : trackType === 1 ? (
            <MelodyNote
              ghost
              rowRef={rowRef}
              trackRows={trackRows}
              gridPos={gridPos}
              drawingNote={drawingNote}
              track={track}
              sessionSize={sessionSize}
              gridPos={gridPos}
              gridSize={gridSize}
              setTracks={setTracks}
              selectedNotes={[]}
              selectedTrack={selectedTrack}
              setDrawingNote={setDrawingNote}
              zoomPosition={zoomPosition}
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

            {isRecording && drawingNote && (
              <AudioClip
                recording
                note={drawingNote}
                rowRef={rowRef}
                trackRows={trackRows}
                zoomPosition={zoomPosition}
                player={{ buffer: { loaded: "" } }}
                track={track}
                fileInfo={{}}
              />
            )}
          </>
        )}
      </Box>

      {trackType === 2 && addFileDialog && (
        <FileEditor
          audioTrack
          open={addFileDialog}
          onClose={() => setAddFileDialog(false)}
          exists={false}
          instrument={trackInstrument}
          onFileClick={onFileClick}
          setInstrumentLoaded={setInstrumentLoaded}
        />
      )}
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

import React, { useState, useEffect, useRef, useContext } from "react";
import * as Tone from "tone";

import { colors } from "../../../utils/Pallete";

import { Typography, Box } from "@mui/material";

import "./style.css";

import useAudioRec from "../../../hooks/useAudioRec";

import { drumAbbreviations } from "../../../services/MiscData";

import SamplerNote from "./SamplerNote";
import MelodyNote from "./MelodyNote";
import AudioClip from "./AudioClip";
import FileInspector from "../../../components/InstrumentEditor/FileInspector";

import wsCtx from "../../../context/SessionWorkspaceContext";

function Track(props) {
  const rowRef = useRef(null);
  const rowWrapperRef = useRef(null);

  const [gridPos, setGridPos] = useState([]);
  const [floatPos, setFloatPos] = useState([]);

  const [drawingNote, setDrawingNote] = useState(null);

  const [deletableNote, setDeletableNote] = useState(false);
  const [zoomY, setZoomY] = useState(1);

  const [isMouseDown, setIsMouseDown] = useState(false);

  const { recStart, recStop, meterLevel } = useAudioRec();

  const {
    tracks,
    instruments,
    setTracks,
    setPendingUploadFiles,
    params,
    paramSetter,
    instrumentsInfo,
    setInstrumentsInfo,
  } = useContext(wsCtx);

  const {
    selectedTrack,
    trackOptions,
    zoomPosition,
    gridSize,
    isPlaying,
    isRecording,
    cursorMode,
    trackRows,
    openDialog,
  } = params;

  const { scheduleTrack } = props;

  const zoomSize = zoomPosition[1] - zoomPosition[0] + 1;

  const track = tracks[selectedTrack];
  const trackInstrument = instruments[selectedTrack];
  const trackType = track.type;

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
          //wavepath: drawWave(trackInstrument.player(e).buffer.toArray(0)),
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
    paramSetter("trackRows", rows);
  };

  const toggleAudioRecording = () => {
    if (isRecording) {
      let newAudioIndex = 0;
      while (trackInstrument.has(newAudioIndex)) {
        newAudioIndex++;
      }
      let dn = { time: Tone.Transport.position, clip: newAudioIndex };
      setDrawingNote(dn);

      let filename =
        (track.name ? track.name : "Audio") + "_" + (newAudioIndex + 1);

      recStart(filename);
    } else {
      recStop((file, audiobuffer) => {
        console.log(file, audiobuffer);
        trackInstrument.add(drawingNote.clip, audiobuffer);
        setPendingUploadFiles((prev) => [
          ...prev,
          { file: file, index: drawingNote.clip, track: selectedTrack },
        ]);

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
      let newII = { ...prev };
      newII[selectedTrack].filesInfo[newAudioIndex] = data;
      if (!newII[selectedTrack].patch) {
        newII[selectedTrack].patch = { urls: { [newAudioIndex]: fileId } };
      } else {
        newII[selectedTrack].patch.urls[newAudioIndex] = fileId;
      }
      return newII;
    });

    paramSetter("openDialog", null);
  };

  /* =============================MOUSE EVENTS========================================= */

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

    /*  if (!isClickOnNote) {
      paramSetter("selNotes", []);
    } */

    if (
      (e && e.target.className.includes("track-score-note-handle")) ||
      cursorMode !== "edit"
    )
      return;

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

  /* ================================USEEFFECTS======================================== */

  useEffect(() => {
    //console.log("change detected on trackRow");
    scheduleTrack(selectedTrack);
  }, [track.score]);

  useEffect(() => {
    //console.log("change detected on trackRow");
    trackType === 2 && scheduleTrack(selectedTrack);
  }, [isPlaying, isMouseDown]);

  useEffect(() => {
    loadTrackRows();
  }, [
    trackInstrument,
    instruments,
    track,
    selectedTrack,
    trackOptions.showingAll,
  ]);

  useEffect(() => {
    onGridPosChange();
  }, [gridPos]);

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
    }
  }, []);

  /* ================================JSX=============================================== */

  return (
    <div
      className="track-grid-row-wrapper"
      ref={rowWrapperRef}
      onWheel={handleWheel}
      disabled
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
        tabIndex={-1}
      >
        {trackRows.map((row, rowIndex) => (
          <Box
            className="track-inner-row"
            disabled
            tabIndex={-1}
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
                rowIndex % 12 === 11
                  ? theme.palette.mode === "dark"
                    ? ""
                    : colors[track.color][800] + "3a"
                  : theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.08)"
                  : ""),
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
                  note={note}
                  index={noteIndex}
                  a={rowRef.current}
                  gridPos={gridPos}
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
                  isMouseDown={isMouseDown}
                />
              ) : (
                trackInstrument &&
                trackInstrument.has(note.clip) && (
                  <AudioClip
                    key={noteIndex}
                    rowRef={rowRef}
                    player={trackInstrument.player(note.clip)}
                    deletableNote={deletableNote}
                    setDrawingNote={setDrawingNote}
                    index={noteIndex}
                    floatPos={floatPos}
                    note={note}
                    isMouseDown={isMouseDown}
                  />
                )
              )
            )}
        {rowRef.current &&
          cursorMode === "edit" &&
          !deletableNote &&
          (trackType === 0 ? (
            <SamplerNote ghost rowRef={rowRef} gridPos={gridPos} />
          ) : trackType === 1 ? (
            <MelodyNote
              ghost
              rowRef={rowRef}
              drawingNote={drawingNote}
              gridPos={gridPos}
              isMouseDown={isMouseDown}
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
                isRecClip
                note={drawingNote}
                rowRef={rowRef}
                player={{ buffer: { loaded: "" } }}
              />
            )}
          </>
        )}
      </Box>

      {trackType === 2 && (
        <FileInspector
          audioTrack
          open={openDialog === "addFile"}
          onClose={() => paramSetter("openDialog", null)}
          exists={false}
          instrument={trackInstrument}
          onFileClick={onFileClick}
          setInstrumentLoaded={() => {}}
        />
      )}
    </div>
  );
}

export default Track;

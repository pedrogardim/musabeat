import React, { useState, useEffect, useRef, Fragment } from "react";
import * as Tone from "tone";
import "./ModuleRow.css";

import Draggable from "react-draggable";

import { colors } from "../../utils/materialPalette";

import {
  IconButton,
  Icon,
  Tooltip,
  TextField,
  Typography,
} from "@material-ui/core";

function ModuleRow(props) {
  const rowRef = useRef(null);

  const [moduleRows, setModuleRows] = useState([]);
  const [cursorAnimator, setCursorAnimator] = useState(null);
  const [compact, setCompact] = useState(true);
  const [draggingSelect, setDraggingSelect] = useState(false);
  const [TLinputSessionSize, setTLinputSessionSize] = useState(
    props.sessionSize
  );
  const [gridPos, setGridPos] = useState([]);

  const loadModuleRows = () => {
    let rows = [];
    if (props.module.type === 0) {
      rows = Array(props.instrument && props.instrument._buffers._buffers.size)
        .fill(0)
        .map((e, i) => props.module.lbls[i]);
    }
    setModuleRows(rows);
  };

  const handleHover = (event) => {
    let hoveredPos = [
      event.pageY - rowRef.current.getBoundingClientRect().top,
      event.pageX - rowRef.current.getBoundingClientRect().left,
    ];

    let gridPos = [
      Math.floor(
        Math.abs(
          (hoveredPos[0] / rowRef.current.offsetHeight) * moduleRows.length
        )
      ),
      Math.floor(
        Math.abs(
          (hoveredPos[1] / rowRef.current.offsetWidth) *
            props.sessionSize *
            props.gridSize
        )
      ),
    ];

    setGridPos(gridPos);
  };

  useEffect(() => {
    loadModuleRows();
  }, [props.instrument, props.module]);

  useEffect(() => {
    console.log(moduleRows);
  }, [moduleRows]);

  return (
    <div className="module-grid-row" ref={rowRef} onMouseOver={handleHover}>
      {moduleRows.map((row, rowIndex) => (
        <div className="module-inner-row">
          <span className="module-inner-row-label">{row}</span>
          <div className="module-inner-row-line" />
        </div>
      ))}
      {rowRef.current && props.cursorMode === "edit" && (
        <div
          className="module-score-ghost"
          style={{
            height: rowRef.current.offsetHeight / moduleRows.length,
            width:
              rowRef.current.offsetWidth / (props.sessionSize * props.gridSize),
            top: gridPos[0] * (rowRef.current.offsetHeight / moduleRows.length),
            left:
              gridPos[1] *
              (rowRef.current.offsetWidth /
                (props.sessionSize * props.gridSize)),
            backgroundColor: colors[props.module.color][300],
          }}
        />
      )}
    </div>
  );
}

export default ModuleRow;

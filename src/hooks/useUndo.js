import { useState } from "react";

function useUndo(setter) {
  const [history, setHistory] = useState({
    past: [],
    present: null,
    future: [],
  });

  const Undo = () => {
    if (
      history.past.length === 0 ||
      history.past[history.past.length - 1] === null
    )
      return;
    let previous = history.past[history.past.length - 1];
    let newPast = history.past.slice(0, history.past.length - 1);
    setter(deepCopy(previous));
    setHistory({
      past: newPast,
      present: previous,
      future: [history.present, ...history.future],
    });
  };

  const Redo = () => {
    if (history.future.length === 0) return;
    let next = history.future[0];
    let newFuture = history.future.slice(1);
    setter(deepCopy(next));
    setHistory({
      past: [...history.past, history.present],
      present: history.next,
      future: newFuture,
    });
  };

  const onChange = (input) => {
    let areDifferent =
      JSON.stringify(history.present) !== JSON.stringify(input);

    //TEMP Solution: (currentTracks.length < past[past.length - 1].length) ===> Reset undo to prevent bringing back deleted tracks

    if (areDifferent)
      setHistory({
        past: [...history.past, history.present],
        present: deepCopy(input),
        future: [],
      });
  };

  const resetHistory = () => {
    setHistory({
      past: [],
      present: null,
      future: [],
    });
  };

  return [Undo, Redo, onChange, resetHistory];
}

const deepCopy = (a) => JSON.parse(JSON.stringify(a));

export default useUndo;

import React, { createContext, useState } from "react";

const GlobalStateContest = createContext();

const emptyData = Array.from({ length: 8 }, () =>
  Array.from({ length: 8 }, () => {})
);
const emptyAlert = { data: "", state: false };
const emptyPosition = { start: null, end: null };

const GlobalStateProvider = ({ children }) => {
  const [showAlert, setShowAlert] = useState(deepCopy(emptyAlert));
  const [data, setData] = useState(deepCopy(emptyData));
  const [knightAdded, setKnightAdded] = useState(false);
  const [blockCells, setBlockCells] = useState(false);
  const [position, setPosition] = useState(deepCopy(emptyPosition));

  return (
    <GlobalStateContest.Provider
      value={{
        showAlert,
        setShowAlert,
        data,
        setData,
        knightAdded,
        setKnightAdded,
        blockCells,
        setBlockCells,
        position,
        setPosition,
      }}
    >
      {children}
    </GlobalStateContest.Provider>
  );
};

export {
  GlobalStateContest,
  GlobalStateProvider,
  emptyData,
  emptyAlert,
  emptyPosition,
};

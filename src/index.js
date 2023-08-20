import React from "react";
import ReactDOM from "react-dom/client";
import App from "./frontend/App.js";
import "./style.css";

const grid = document.querySelector(".grid-container");
const root = ReactDOM.createRoot(grid);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

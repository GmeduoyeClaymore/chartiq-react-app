import React from "react";
import ReactDom from "react-dom";

// Base styles required for all charts
import "./chartiq/styles/base-imports";

import { AdvancedChart } from "./chartiq";

// Optional callback function to access chart engine and uiContext
const chartInitialized = ({ chartEngine, uiContext }) => {
  // chartEngine provides access to chart engine CIQ.ChartEngine
  // uiContext provides access to UI component interaction CIQ.UI.Context
};

const el = document.querySelector("#app");

if (el) {
  ReactDom.render(<AdvancedChart chartInitialized={chartInitialized} />, el);
}

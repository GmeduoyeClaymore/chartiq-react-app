import React from "react";
import ReactDom from "react-dom";

// Base styles required for all charts
import "./chartiq/styles/base-imports";

import { AdvancedChart } from "./chartiq";
import { SubscriptionChart } from "./chartiq";

const el = document.querySelector("#app");

if (el) {
  ReactDom.render(<AdvancedChart />, el);
}

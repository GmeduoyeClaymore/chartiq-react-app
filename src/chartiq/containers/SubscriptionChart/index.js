import React from "react";

import { default as SubscriptionChart } from "./SubscriptionChart";

import { config } from "./resources"; // ChartIQ library resources

export default () => <SubscriptionChart config={config} />;

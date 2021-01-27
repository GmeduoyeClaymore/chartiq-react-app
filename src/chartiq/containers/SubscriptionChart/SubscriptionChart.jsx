import React from "react";
import { CIQ } from "chartiq/js/componentUI";

import ChartTemplate from "./Template";

import { connection } from "./SubscriptionViewserverFeed";

export default class SubscriptionChart extends React.Component {
  constructor(props) {
    super(props);
    this.container = React.createRef();
    this.chartId = props.chartId || "_advanced-chart";

    this.initialSymbol = props.symbol || {
      symbol: "VOD LN Equity",
      name: "Vodaphone",
      exchDisp: "XLON",
    };

    this.state = {
      chart: new CIQ.UI.Chart(),
      stx: null,
      UIContext: null,
      chartInitializedCallback: props.chartInitialized,
    };
  }

  componentDidMount() {
    const container = this.container.current;
    const { chart, chartInitializedCallback } = this.state;
    let { config } = this.props;

    // Update chart configuration by modifying default configuration
    config.chartId = this.chartId;
    config.initialSymbol = this.initialSymbol;

    // Hide menu items used by the Active Trader plugin when it is not loaded
    if (!config.plugins.marketDepth) {
      config.menuChartPreferences = config.menuChartPreferences.filter(
        (item) => item.label !== "Market Depth" && item.label !== "L2 Heat Map"
      );
    }

    portalizeContextDialogs(container);
    // Delay the call to createChartAndUI so any other AdvancedChart components on the page
    // have a chance to call portalizeContextDialogs
    window.setTimeout(() => {
      connection.connectionSubject.subscribe((status) => {
        console.log(status);
        if (!status.isConnected) return;
        const uiContext = this.createChartAndUI({ container, config });
        const chartEngine = uiContext.stx;

        this.setState({ stx: chartEngine, UIContext: uiContext });

        if (chartInitializedCallback) {
          chartInitializedCallback({ chartEngine, uiContext });
        }
      });
      connection.connect();
    }, 0);
  }

  componentWillUnmount() {
    this.state.stx.destroy();
  }

  createChartAndUI({ container, config }) {
    const uiContext = this.state.chart.createChartAndUI({ container, config });
    const stx = uiContext.stx;

    return uiContext;
  }

  // Return elements for chart plugin toggle buttons
  getPluginToggles() {
    const { tfc } = this.state.stx || {};
    return (
      <div className="trade-toggles ciq-toggles">
        {tfc && (
          <cq-toggle class="tfc-ui sidebar stx-trade" cq-member="tfc">
            <span></span>
            <cq-tooltip>Trade</cq-tooltip>
          </cq-toggle>
        )}
        <cq-toggle
          class="analystviews-ui stx-analystviews tc-ui stx-tradingcentral"
          cq-member="tc"
        >
          <span></span>
          <cq-tooltip>Analyst Views</cq-tooltip>
        </cq-toggle>
        <cq-toggle
          class="technicalinsights-ui stx-technicalinsights recognia-ui stx-recognia"
          cq-member="recognia"
        >
          <span></span>
          <cq-tooltip>Technical Insights</cq-tooltip>
        </cq-toggle>
      </div>
    );
  }

  render() {
    const pluginToggles = this.getPluginToggles();

    let chartTemplate = <ChartTemplate pluginToggles={pluginToggles} />;
    if (this.props.children) chartTemplate = this.props.children;

    return <cq-context ref={this.container}>{chartTemplate}</cq-context>;
  }
}

/**
 * For applications that have more then one chart, keep single dialog of the same type
 * and move it outside context node to be shared by all chart components
 */
function portalizeContextDialogs(container) {
  container.querySelectorAll("cq-dialog").forEach((dialog) => {
    dialog.remove();
    if (!dialogPortalized(dialog)) {
      document.body.appendChild(dialog);
    }
  });
}

function dialogPortalized(el) {
  const tag = el.firstChild.nodeName.toLowerCase();
  let result = Array.from(document.querySelectorAll(tag)).some(
    (el) => !el.closest("cq-context")
  );
  return result;
}

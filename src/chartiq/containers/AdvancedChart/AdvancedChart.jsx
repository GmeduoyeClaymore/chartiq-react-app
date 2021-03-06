import React from "react";
import { CIQ } from "chartiq/js/componentUI";

import ChartTemplate from "./Template";

import { connection } from "./viewserverFeed";

export default class AdvancedChart extends React.Component {
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
    // Destroy the ChartEngine instance when unloading the component.
    // This will stop internal processes such as quotefeed polling.
    this.state.stx.destroy();
  }

  createChartAndUI({ container, config }) {
    const uiContext = this.state.chart.createChartAndUI({ container, config });
    const stx = uiContext.stx;
    //stx.setMarket(CIQ.Market.LSE);

    // Methods for capturing state changes in chart engine and UI

    // Channel subscribe
    // const { channels } = config;
    // const channelSubscribe = CIQ.UI.BaseComponent.prototype.channelSubscribe;
    // channelSubscribe(channels.breakpoint, (value) => {
    // 	console.log('channels.breakpoint',value);
    // }, stx);

    // Create layout listener, see parameters at https://documentation.chartiq.com/global.html#layoutEventListener
    // stx.addEventListener('layout', ({ layout }) => {
    // 	console.log('layout changed', layout);
    // });

    // Simulate L2 data using https://documentation.chartiq.com/CIQ.ChartEngine.html#updateCurrentMarketData
    // CIQ.simulateL2({ stx, onInterval: 1000, onTrade: true });

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

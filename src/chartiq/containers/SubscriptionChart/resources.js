// Required imports from chartiq for advanced chart

import { CIQ } from 'chartiq/js/chartiq';
import 'chartiq/js/advanced';

import 'chartiq/js/advanced';

import 'chartiq/js/addOns';

// Symbol mapping to market definition
import 'chartiq/examples/markets/marketDefinitionsSample';
import 'chartiq/examples/markets/marketSymbologySample';

import 'chartiq/examples/feeds/symbolLookupChartIQ';

import 'chartiq/examples/translations/translationSample';

import 'chartiq/js/componentUI';
import 'chartiq/js/components';

// Event Markers 
import marker from 'chartiq/examples/markers/markersSample.js';
import 'chartiq/examples/markers/tradeAnalyticsSample';
import 'chartiq/examples/markers/videoSample';

//import quoteFeed from "./viewserverFeed";
//import quoteFeed from "chartiq/examples/feeds/quoteFeedSimulator.js";

import PerfectScrollbar from "chartiq/js/thirdparty/perfect-scrollbar.esm.js";

import getConfig from 'chartiq/js/defaultConfiguration'; 



const config = getConfig({ 
	//quoteFeed,
	markerSample: marker.MarkersSample,
	scrollStyle: PerfectScrollbar,
});

config.marketFactory = undefined;
config.market = CIQ.Market.LSE;

const { 

	timeSpanEventPanel,
} = config.plugins;
// Select only plugin configurations that needs to be active for this chart
config.plugins = { 
	timeSpanEventPanel,
};

export { CIQ, config };
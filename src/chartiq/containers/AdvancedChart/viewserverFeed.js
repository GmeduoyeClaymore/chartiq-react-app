import {
  SubscriptionClient,
  ServerConnection,
  RxDataSink,
  DataSinkEventType,
  Logger,
  LogLevel,
} from "@reddeer/viewserver-core-jsclient";
import { filter, takeWhile, take, debounceTime } from "rxjs/operators";
import * as moment from "moment";

Logger.level = LogLevel.TRACE;

export const EXISTENT_END_POINT = "http://raiduatapp2.mbam.local:5094";
export const connection = new ServerConnection(
  "main",
  `${EXISTENT_END_POINT}/viewserver`
);
const client = new SubscriptionClient(connection);
const dataSink = new RxDataSink("main");
const RowEvents = [DataSinkEventType.ROW_ADDED, DataSinkEventType.ROW_UPDATED, DataSinkEventType.ROW_REMOVED];
let ticker;

let subscription;

const transform = (feedData = []) => {
  var newQuotes = [];
  for (var i = 0; i < feedData.length; i++) {
    const { key, open, high, low, close, volume } = feedData[i];
    var newQuote = {};
    newQuote.DT = moment(key.slice(0, 19), "YYYY-MM-DD_HH.mm.ss").toDate(); // DT is a string in ISO format, make it a Date instance
    newQuote.Open = open;
    newQuote.High = high;
    newQuote.Low = low;
    newQuote.Close = close;
    newQuote.Volume = volume;
    newQuotes.push(newQuote);
  }
  newQuotes.sort((a, b) => b.DT.getTime() - a.DT.getTime());
  return newQuotes;
};

const subscribeToTickerData = (ticker, cb) => {
  dataSink.dataSinkUpdated
    .pipe(filter((ev) => ev.Type === DataSinkEventType.ERROR))
    .subscribe((ev) => cb({ error: ev.error.ErrorMessage }));
  dataSink.dataSinkUpdated
    .pipe(filter((ev) => ev.Type === DataSinkEventType.SNAPSHOT_COMPLETE))
    .pipe(take(1))
    .subscribe((ev) => {
      const doCallBack = () => cb({
        quotes: transform(dataSink.snapshot),
        moreAvailable: true,
        attribution: { source: "simulator", exchange: "RANDOM" },
      });
      doCallBack()
      dataSink.dataSinkUpdated.pipe(filter(ev => !!~RowEvents.indexOf(ev.Type))).pipe(debounceTime(50)).subscribe(ev => doCallBack());
    });
  subscription = client.subscribeAny(
    "SubscribeToReport",
    {
      ReportKey: "IntradayPriceHistory",
      ParameterValues: {
        BBGTicker: ticker,
        DateFrame: "3",
      },
    },
    dataSink,
    () => {},
    [
      {
        Name: "Authorization",
        Value:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vZmlyZWZseS91c2VyaWQiOiIzNTIiLCJodHRwOi8vZmlyZWZseS9yZWFsdXNlcmlkIjoiMzUyIiwiaHR0cDovL2ZpcmVmbHkvaXBhZGRyZXNzIjoiOjpmZmZmOjE5Mi4xNjguNS45OSIsImh0dHA6Ly9maXJlZmx5L3JvbGUiOiJEZXZlbG9wZXIiLCJodHRwOi8vZmlyZWZseS9ibG9vbWJlcmd1dWlkIjoiMzA2MDIxNzciLCJ1bmlxdWVfbmFtZSI6Ik1CQU1cXGJlbS5tZWR1b3llIiwicHJpbWFyeXNpZCI6IlMtMS01LTIxLTIyNzgzODM0MDAtMjQ3NjE0OTg4MS0yNTIxNDU5MzIwLTg4NTYiLCJwcmltYXJ5Z3JvdXBzaWQiOiJTLTEtNS0yMS0yMjc4MzgzNDAwLTI0NzYxNDk4ODEtMjUyMTQ1OTMyMC01MTMiLCJncm91cHNpZCI6WyJTLTEtNS0yMS0yMjc4MzgzNDAwLTI0NzYxNDk4ODEtMjUyMTQ1OTMyMC01MTMiLCJTLTEtMS0wIiwiUy0xLTUtMzItNTQ1IiwiUy0xLTUtMiIsIlMtMS01LTExIiwiUy0xLTUtMTUiLCJTLTEtNS0yMS0yMjc4MzgzNDAwLTI0NzYxNDk4ODEtMjUyMTQ1OTMyMC05NDM0IiwiUy0xLTUtMjEtMjI3ODM4MzQwMC0yNDc2MTQ5ODgxLTI1MjE0NTkzMjAtMTg1NiIsIlMtMS01LTIxLTIyNzgzODM0MDAtMjQ3NjE0OTg4MS0yNTIxNDU5MzIwLTk0MzUiLCJTLTEtNS0yMS0yMjc4MzgzNDAwLTI0NzYxNDk4ODEtMjUyMTQ1OTMyMC05MTAzIiwiUy0xLTUtMjEtMjI3ODM4MzQwMC0yNDc2MTQ5ODgxLTI1MjE0NTkzMjAtODcyMyIsIlMtMS01LTIxLTIyNzgzODM0MDAtMjQ3NjE0OTg4MS0yNTIxNDU5MzIwLTE4MTkiLCJTLTEtNS0yMS0yMjc4MzgzNDAwLTI0NzYxNDk4ODEtMjUyMTQ1OTMyMC04OTI2IiwiUy0xLTUtMjEtMjI3ODM4MzQwMC0yNDc2MTQ5ODgxLTI1MjE0NTkzMjAtODk0MSIsIlMtMS01LTIxLTIyNzgzODM0MDAtMjQ3NjE0OTg4MS0yNTIxNDU5MzIwLTE2OTMiLCJTLTEtNS02NC0xMCJdLCJuYmYiOjE2MTE1NjQ3NTksImV4cCI6MTYxMTYyMjM1OSwiaWF0IjoxNjExNTY0NzU5LCJpc3MiOiJodHRwOi8vcmFpZHVhdGFwcCIsImF1ZCI6Imh0dHA6Ly9yYWlkdWF0YXBwIn0.-TxKMJPMRc0LhXF_TgEMYv_mn1fh2oGtKhS0qfQtUwE",
      },
    ]
  );
};

var quoteFeedSimulator = {}; // the quotefeed object
// local, non-dependent implementation of XmlHttpRequest

//quoteFeedSimulator.maxTicks = 20000;
//quoteFeedSimulator.url = "https://simulator.chartiq.com/datafeed";
// called by chart to fetch initial data
quoteFeedSimulator.fetchInitialData = function (
  symbol,
  suggestedStartDate,
  suggestedEndDate,
  params,
  cb
) {
  ticker = symbol;
  subscribeToTickerData(ticker, cb);
};
// called by chart to fetch update data
quoteFeedSimulator.fetchUpdateData = function (symbol, startDate, params, cb) {
  if (true) {
    cb({
      quotes: transform(dataSink.snapshot),
      attribution: { source: "simulator", exchange: "RANDOM" },
    });
  } else {
    subscription.unsubscribe(true).then((payload) => {
      console.log(JSON.stringify(payload, null, 2));
      subscribeToTickerData(ticker, cb);
    });
  }
};
// called by chart to fetch pagination data
quoteFeedSimulator.fetchPaginationData = function (
  symbol,
  suggestedStartDate,
  endDate,
  params,
  cb
) {
  console.log("fetching pagination data");
  /*subscription.unsubscribe(true).then((payload) => {
    console.log(JSON.stringify(payload, null, 2));
    subscribeToTickerData(ticker, cb);
  });*/
};
export default quoteFeedSimulator;

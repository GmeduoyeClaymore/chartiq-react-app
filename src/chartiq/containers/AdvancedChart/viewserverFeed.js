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
        moreAvailable: false,
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
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vZmlyZWZseS91c2VyaWQiOiIzOTIiLCJodHRwOi8vZmlyZWZseS9yZWFsdXNlcmlkIjoiMzkyIiwiaHR0cDovL2ZpcmVmbHkvaXBhZGRyZXNzIjoiOjpmZmZmOjE5Mi4xNjguNS4xODMiLCJodHRwOi8vZmlyZWZseS9tYWNoaW5laWQiOiJmYzFiOGQ3YS04YWYzLTRlZTctYTM4Yi1jZWNjZTdmY2UyNDMiLCJodHRwOi8vZmlyZWZseS9yb2xlIjoiRGV2ZWxvcGVyIiwiaHR0cDovL2ZpcmVmbHkvYmxvb21iZXJndXVpZCI6IjMwNjAyMjEzIiwidW5pcXVlX25hbWUiOiJNQkFNXFxKb24uVGFuc2V5IiwicHJpbWFyeXNpZCI6IlMtMS01LTIxLTIyNzgzODM0MDAtMjQ3NjE0OTg4MS0yNTIxNDU5MzIwLTEyMjA2IiwicHJpbWFyeWdyb3Vwc2lkIjoiUy0xLTUtMjEtMjI3ODM4MzQwMC0yNDc2MTQ5ODgxLTI1MjE0NTkzMjAtNTEzIiwiZ3JvdXBzaWQiOlsiUy0xLTUtMjEtMjI3ODM4MzQwMC0yNDc2MTQ5ODgxLTI1MjE0NTkzMjAtNTEzIiwiUy0xLTEtMCIsIlMtMS01LTMyLTU0NSIsIlMtMS01LTIiLCJTLTEtNS0xMSIsIlMtMS01LTE1IiwiUy0xLTUtMjEtMjI3ODM4MzQwMC0yNDc2MTQ5ODgxLTI1MjE0NTkzMjAtMjA2NSIsIlMtMS01LTIxLTIyNzgzODM0MDAtMjQ3NjE0OTg4MS0yNTIxNDU5MzIwLTk0MzQiLCJTLTEtNS0yMS0yMjc4MzgzNDAwLTI0NzYxNDk4ODEtMjUyMTQ1OTMyMC0xODU2IiwiUy0xLTUtMjEtMjI3ODM4MzQwMC0yNDc2MTQ5ODgxLTI1MjE0NTkzMjAtMjI4MyIsIlMtMS01LTIxLTIyNzgzODM0MDAtMjQ3NjE0OTg4MS0yNTIxNDU5MzIwLTkxMDMiLCJTLTEtNS0yMS0yMjc4MzgzNDAwLTI0NzYxNDk4ODEtMjUyMTQ1OTMyMC04NzIzIiwiUy0xLTUtMjEtMjI3ODM4MzQwMC0yNDc2MTQ5ODgxLTI1MjE0NTkzMjAtMTgxOSIsIlMtMS01LTIxLTIyNzgzODM0MDAtMjQ3NjE0OTg4MS0yNTIxNDU5MzIwLTg5MjYiLCJTLTEtNS0yMS0yMjc4MzgzNDAwLTI0NzYxNDk4ODEtMjUyMTQ1OTMyMC04OTQxIiwiUy0xLTUtMjEtMjI3ODM4MzQwMC0yNDc2MTQ5ODgxLTI1MjE0NTkzMjAtMTY5MyIsIlMtMS0xOC0xIl0sIm5iZiI6MTYxMTMwNDMyOSwiZXhwIjoxNjExMzYxOTI5LCJpYXQiOjE2MTEzMDQzMjksImlzcyI6Imh0dHA6Ly9yYWlkdWF0YXBwIiwiYXVkIjoiaHR0cDovL3JhaWR1YXRhcHAifQ.LijePQgwzsz3907rsBEuj_MSKngmUW0f0HAjRniw5Ew",
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
  // if (true) {
  //   cb({
  //     quotes: transform(dataSink.snapshot),
  //     attribution: { source: "simulator", exchange: "RANDOM" },
  //   });
  // } else {
  //   subscription.unsubscribe(true).then((payload) => {
  //     console.log(JSON.stringify(payload, null, 2));
  //     subscribeToTickerData(ticker, cb);
  //   });
  // }
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

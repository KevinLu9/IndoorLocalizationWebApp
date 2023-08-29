
// Distance Webworker Calculator using Bluetooth RSSI Values
// import KalmanFilter from "../../node_modules/kalman-filter/index"

// import KalmanFilter from "./kalman-filter/lib/kalman-filter";
// const {KalmanFilter} = require('kalman-filter');

importScripts('kalman-filter.js')
var {KalmanFilter} = kalmanFilter;
const kFilter = new KalmanFilter();
// const res = kFilter.filterAll(observations);
if (typeof Worker == "undefined") {
  throw new Error("Device does not support Web Workers!");
}

let bluetoothDataDict = {};
let n = 1.15416;
let e = 2.718;
class BluetoothDevice {
  constructor(id, txPower) {
    this.id = id;
    this.txPower = txPower;
    this.rssi = [];
    this.time = [];
  }
  addData(time, rssi) {
    this.rssi.push(rssi);
    this.time.push(time);
  }
  getLatestData() {
    return this.rssi.length > 0
      ? [this.time[this.time.length - 1], this.rssi[this.rssi.length - 1]]
      : null;
  }
}

const getLatestData = () => {
  const res = [];
  const keys = Object.keys(bluetoothDataDict);
  for (let key of keys) {
    res.push(bluetoothDataDict[key].getLatestData());
  }
  return res;
};

let previousCorrected = kFilter.getInitState();

const runKalmanFilter = (newData) => {
  // console.log({previousCorrected, newData});
  const predicted = kFilter.predict({previousCorrected});
  previousCorrected = kFilter.correct({
    predicted,
    observation: newData,
  });
  
  return previousCorrected.mean.map(m => m[0])[0];
}


const calculateDistance = (data) => {
  // Calculates distance using Log-Distance path loss model
  return e **(-(bluetoothDataDict[data.values.id].txPower + data.values.rssi) / (10 * n) );
}

onmessage = ({ data }) => {
  let workerResult = undefined;
  // console.log(data)
  if (data.command == "rssi") {
    // If data is an rssi value, calculate distance
    bluetoothDataDict[data.values.id].addData(
      data.values.time,
      data.values.rssi
    );
    // workerResult = `[DISTANCE WORKER] ID: ${data.values.id}, TIME: ${data.values.time}, RSSI: ${data.values.rssi}`;
    let distance = calculateDistance(data);
    let kalman_distance = runKalmanFilter([distance]);
    // workerResult = `[DISTANCE WORKER] ID: ${data.values.id}, Distance: ${
    //   calculateDistance(data).toFixed(2)
    // } m, RSSI: ${data.values.rssi}`;
    workerResult = {distance, kalman_distance};
    // console.log(workerResult);
  } else if (data.command == "device") {
    // If data is a device, add to bluetooth dict
    bluetoothDataDict[data.values.id] = new BluetoothDevice(
      data.values.id,
      data.values.txPower
    );
    console.log(
      `[DISTANCE WORKER] New Bluetooth Device Registered: ID: ${data.values.id}, txPower: ${data.values.txPower}`
    );
  }
  if (workerResult) {
    postMessage(workerResult);
  }
};

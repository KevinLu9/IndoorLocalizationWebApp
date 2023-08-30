
// Distance Webworker Calculator using Bluetooth RSSI Values
importScripts('kalman-filter.js')
var {KalmanFilter} = kalmanFilter;
const kFilter = new KalmanFilter();
if (typeof Worker == "undefined") {
  throw new Error("Device does not support Web Workers!");
}

let bluetoothDataDict = {};
let n = 2;//1.15416;
let e = 2.718;
class BluetoothDevice {
  constructor(id, txPower) {
    this.id = id;
    this.txPower = txPower;
    this.rssi = [];
    this.time = [];
    this.previousCorrected = kFilter.getInitState();
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
  runKalmanFilter = (data) => {
    const predicted = kFilter.predict({previousCorrected: this.previousCorrected});
    this.previousCorrected = kFilter.correct({
      predicted,
      observation: data,
    });
    return this.previousCorrected.mean.map(m => m[0])[0];
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

const calculateDistance = (data) => {
  // Calculates distance using Log-Distance path loss model
  return e **(-(bluetoothDataDict[data.values.id].txPower + data.values.rssi) / (10 * n) );
}

onmessage = ({ data }) => {
  let workerResult = undefined;
  // console.log(data)
  if (data.command == "rssi") {
    let distance = calculateDistance(data);
    let kalman_distance = bluetoothDataDict[data.values.id].runKalmanFilter([distance]);
    workerResult = {distance, kalman_distance, id: data.values.id};
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

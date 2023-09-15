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
// Bluetooth Beacon Class (locally stored for distance worker)
class BluetoothBeacon {
  constructor(id, txPower, x, y, z) {
    this.id = id;
    this.txPower = txPower;
    this.x = x;
    this.y = y;
    this.z = z;
    this.rssi = [];
    this.time = [];
    this.distance = [];
    this.kalmanDistance = [];
    this.maxBufferSize = 20;
    this.previousCorrected = kFilter.getInitState();
  }
  addData(time, rssi) {
    // Adds new data to the beacon
    // Keep length within maxBufferSize
    if (rssi.length >= this.maxBufferSize) {
      this.rssi.shift();
        this.time.shift();
        this.distance.shift();
        this.kalmanDistance.shift();
    }
    // Add new values
    this.rssi.push(rssi);
    this.time.push(time);
    // Calculate distance with and without kalman filter based on the rssi
    const dist = this.calculateDistance(rssi);
    const kalmanDist = this.runKalmanFilter([dist]);
    this.distance.push(dist);
    this.kalmanDistance.push(kalmanDist);

    return [dist, kalmanDist];
  }
  getLatestData() {
    // Gets the latest data from the beacon
    return this.rssi.length > 0
      ? {'time': this.time[this.time.length - 1], 'rssi': this.rssi[this.rssi.length - 1], 'distance': this.distance[this.distance.length - 1], 'kalmanDistance': this.kalmanDistance[this.kalmanDistance.length - 1]}
      : null;
  }
  calculateDistance(rssi) {
    // Calculates distance using Log-Distance path loss model
    return e **(-(this.txPower + rssi) / (10 * n) );
  }
  runKalmanFilter = (data) => {
    // Kalman filter for the data
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
  // Filter for only recent values (2 seconds ago)
  res.filter((value) => {value.time < new Date().getTime() - 2000})
  return res;
};

// Handle Messages received
onmessage = ({ data }) => {
  let workerResult = undefined;
  // console.log(data)
  if (data.command == "rssi") {
    let distance;
    let kalman_distance;
    [distance, kalman_distance] = bluetoothDataDict[data.values.id].addData(new Date().getTime(), data.values.rssi);

    workerResult = {distance, kalman_distance, id: data.values.id};
  } else if (data.command == "device") {
    // If data is a device, add to bluetooth dict
    bluetoothDataDict[data.values.id] = new BluetoothBeacon(
      data.values.id,
      data.values.txPower,
      data.values.x,
      data.values.y,
      data.values.z
    );
    console.log(
      `[DISTANCE WORKER] New Bluetooth Device Registered: ID: ${data.values.id}, txPower: ${data.values.txPower}`
    );
  }
  if (workerResult) {
    postMessage(workerResult);
  }
};

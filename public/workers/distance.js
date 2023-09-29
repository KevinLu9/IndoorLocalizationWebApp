// Distance Webworker Calculator using Bluetooth RSSI Values
// importScripts('kalman-filter.js')
// var { KalmanFilter } = kalmanFilter;
// const kFilter = new KalmanFilter({

// });
importScripts('kalman.js');

if (typeof Worker == "undefined") {
  throw new Error("Device does not support Web Workers!");
}

let bluetoothDataDict = {};
let n = 2; // 2;//1.15416;
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
    this.latestUsed = false;
    // this.flagged = [];
    this.maxBufferSize = 20;
    // this.previousCorrected = kFilter.getInitState();
    this.kalman = new KalmanFilter(0.5, 0.5, 0.05); //(0.5, 0.7, 0.4); // 0.5, 0.5, 0.05
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
    this.latestUsed = false;
    // Calculate distance with and without kalman filter based on the rssi
    const dist = this.calculateDistance(rssi);
    const kalmanDist = this.runKalmanFilter(dist);
    this.distance.push(dist);
    this.kalmanDistance.push(kalmanDist);

    return [dist, kalmanDist];
  }
  getLatestData() {
    // Gets the latest data from the beacon
    if (this.rssi.length > 0 && !this.latestUsed) {
      return { 'time': this.time[this.time.length - 1], 'rssi': this.rssi[this.rssi.length - 1], 'distance': this.distance[this.distance.length - 1], 'kalmanDistance': this.kalmanDistance[this.kalmanDistance.length - 1], x: this.x, y: this.y, z: this.z, id: this.id };
    }
    return null;
  }
  calculateDistance(rssi) {
    // Calculates distance using Log-Distance path loss model
    return e ** (-(this.txPower + rssi) / (10 * n));
  }
  runKalmanFilter = (data) => {
    // Kalman filter for the data
    // const predicted = kFilter.predict({ previousCorrected: this.previousCorrected });
    // this.previousCorrected = kFilter.correct({
    //   predicted,
    //   observation: data,
    //   covariance:
    // });
    // return this.previousCorrected.mean.map(m => m[0])[0];
    return this.kalman.calculateKalman(data);
    // return data;
  }
}

const getLatestData = (currentTime) => {
  let res = [];
  const keys = Object.keys(bluetoothDataDict);
  for (let key of keys) {
    // If the bluetooth beacon does not have a location of (0, 0, 0)
    if (bluetoothDataDict[key].x != 0 || bluetoothDataDict[key].y != 0 || bluetoothDataDict[key].z != 0) {
      const latestData = bluetoothDataDict[key].getLatestData();
      if (latestData) {
        res.push(latestData);
      }

    }
  }
  // Filter for only recent values (2 seconds ago)
  res = res.filter((value) => { return new Date().getTime() - value.time < 1000 })
  // console.log('res', res)02
  // Get 4 smallest values
  if (res.length >= 3) {
    res = res.sort((a, b) => a.kalmanDistance - b.kalmanDistance)
    res = res.slice(0, 3);
    res.forEach((value) => {
      bluetoothDataDict[value.id].latestUsed = true;
    })
    return res
  }
  return undefined
};

// Handle Messages received
onmessage = ({ data }) => {
  let workerResult = undefined;
  // console.log(data)
  if (data.command == "rssi") {
    let distance;
    let kalman_distance;
    const currentTime = new Date().getTime();
    [distance, kalman_distance] = bluetoothDataDict[data.values.id].addData(currentTime, data.values.rssi);
    const distanceVals = getLatestData(currentTime);
    // console.log('[LOCATION] distanceVals: ', distanceVals)
    workerResult = { distance, kalman_distance, id: data.values.id, time: currentTime / 1000, x: bluetoothDataDict[data.values.id].x, y: bluetoothDataDict[data.values.id].y, distanceVals };


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

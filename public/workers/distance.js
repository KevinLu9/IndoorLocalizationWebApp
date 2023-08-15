// Distance Webworker Calculator using Bluetooth RSSI Values

if (typeof(Worker) == 'undefined') {
  throw new Error('Device does not support Web Workers!')
};

let bluetoothDataDict = {};

class BluetoothDevice {
  constructor(id, txPower) {
    this.id = id;
    this.txPower = txPower;
    this.rssi = [];
    this.time = [];
  };
  addData(time, rssi) {
    this.rssi.push(rssi);
    this.time.push(time);
  };

}

onmessage = ({data}) => {
  let workerResult = undefined
  if (data.command == 'rssi') { // If data is an rssi value, calculate distance
    bluetoothDataDict[data.values.id].addData(data.values.time, data.values.rssi)
    workerResult = `[DISTANCE WORKER] ID: ${data.values.id}, TIME: ${data.values.time}, RSSI: ${data.values.rssi}`;
    console.log(workerResult);
  }
  else if (data.command == 'device') { // If data is a device, add to bluetooth dict
    bluetoothDataDict[data.values.id] = new BluetoothDevice(data.values.id, data.values.txPower);
    console.log(`[DISTANCE WORKER] New Bluetooth Device Registered: ID: ${data.values.id}, txPower: ${data.values.txPower}`)
  }
  if (workerResult) {
    postMessage(workerResult);
  }
};
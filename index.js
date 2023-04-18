// Enable Tooltips
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

const PARAM = {
  ORIENTATION_A: 'Orientation_a',
  ORIENTATION_B: 'Orientation_b',
  ORIENTATION_G: 'Orientation_g',
  ACCELEROMETER_X: 'Accelerometer_x', 
  ACCELEROMETER_Y: 'Accelerometer_y', 
  ACCELEROMETER_Z: 'Accelerometer_z',
  GYROSCOPE_A: 'Gyroscope_a',
  GYROSCOPE_B: 'Gyroscope_b',
  GYROSCOPE_G: 'Gyroscope_g',

}

function updateFieldIfNotNull(fieldName, value, precision=0) {
  if (value != null) {
    document.getElementById(fieldName).innerHTML = value.toFixed(precision).toString();
    switch (fieldName) {
      case PARAM.ORIENTATION_A: 
      case PARAM.ORIENTATION_B: 
      case PARAM.ORIENTATION_G:         
      document.getElementById(fieldName).innerHTML = value.toFixed(precision).toString() + "&#0176";
        break;
      default:
        document.getElementById(fieldName).innerHTML = value.toFixed(precision).toString();
        break;
    }
  }
}

function handleOrientation(event) {
  updateFieldIfNotNull(PARAM.ORIENTATION_A, event.alpha);
  updateFieldIfNotNull(PARAM.ORIENTATION_B, event.beta);
  updateFieldIfNotNull(PARAM.ORIENTATION_G, event.gamma);
}

function handleMotion(event) {
  updateFieldIfNotNull(PARAM.ACCELEROMETER_X, event.acceleration.x);
  updateFieldIfNotNull(PARAM.ACCELEROMETER_Y, event.acceleration.y);
  updateFieldIfNotNull(PARAM.ACCELEROMETER_Z, event.acceleration.z);

  //updateFieldIfNotNull('Accelerometer_i', event.interval, 2);

  updateFieldIfNotNull(PARAM.GYROSCOPE_A, event.rotationRate.alpha);
  updateFieldIfNotNull(PARAM.GYROSCOPE_B, event.rotationRate.beta);
  updateFieldIfNotNull(PARAM.GYROSCOPE_G, event.rotationRate.gamma);
}

window.addEventListener("deviceorientation", handleOrientation);
window.addEventListener("devicemotion", handleMotion);

// --------------------------------- Bluetooth Data Implementation ---------------------------------
// Bluetooth Data Class
class BluetoothDeviceData {
  constructor(name, time, rssi, txPower){
    this.name = name;
    this.time = [time];
    this.rssi = [rssi];
    this.txPower = txPower;
  }

  addTime(time) {
    this.time.push(time);
  }

  addRSSI(rssi) {
    this.rssi.push(rssi);
  }

  setTxPower(txPower) {
    this.txPower = txPower;
  }
}

// Check for bluetooth device hardware 
navigator.bluetooth.getAvailability().then((available) => {
  if (available) {
    console.log("Bluetooth Status: This Device Supports Bluetooth!");
  } else {
    console.log("Bluetooth Status: This Device Does Not Support Bluetooth!");
  }
});

// Initialize Bluetooth Data Collection Storage
var bluetooth_data_dict = {'TestDevice': new BluetoothDeviceData('TestDevice', new Date().getTime(), 60, 30)};

// On Button Click to Start Scanning for BLE devices
async function onButtonClick() {
  let filters = [];
  let options = {};
  options.acceptAllAdvertisements = true;
  //options.filters = filters;
  bluetooth_data_dict = {}; // Reset the bluetooth data dictionary every button press
  document.getElementById('scan-button').innerHTML = "Restart Scan";
  try {
    let scanText = document.getElementById("BLEScanList");
    if (!navigator.bluetooth.getAvailability()) {
      scanText.innerHTML =
        "<li class='list-group-item'>Web Bluetooth API not available!</li>";
    } else {
      scanText.innerHTML =
        "<li class='list-group-item'>Requesting Bluetooth Scan with options: " +
        JSON.stringify(options) +
        "</li>";
    }
    //options.acceptAllDevices = true;
    //const test = await navigator.bluetooth.requestDevice(options);
    const scan = await navigator.bluetooth.requestLEScan(options);
    console.log("TEST")

    scanText.innerHTML +=
      "<li class='list-group-item'> Scan started with:" +
      " acceptAllAdvertisements: " +
      scan.acceptAllAdvertisements +
      " active: " +
      scan.active +
      " keepRepeatedDevices: " +
      scan.keepRepeatedDevices +
      " filters: " +
      JSON.stringify(scan.filters) +
      "</li>";

    const logDataView = (labelOfDataSource, key, valueDataView) => {
      const hexString = [...new Uint8Array(valueDataView.buffer)]
        .map((b) => {
          return b.toString(16).padStart(2, "0");
        })
        .join(" ");
      const textDecoder = new TextDecoder("ascii");
      const asciiString = textDecoder.decode(valueDataView.buffer);
      return (
        `  ${labelOfDataSource} Data: ` +
        key +
        "<br>    (Hex) " +
        hexString +
        "<br>    (ASCII) " +
        asciiString
      );
    };

    const getCurrentTime = (ms_time) => {
      time = new Date();
      time.setTime(ms_time);
      return time.getDay() +
          "/" +
          time.getMonth() +
          "/" +
          time.getFullYear() +
          " | " +
          (time.getHours() % 12) +
          ":" +
          time.getMinutes() +
          ":" +
          time.getSeconds() +
          "." +
          time.getMilliseconds() +
          (time.getHours() < 12 ? " AM" : " PM");
    }

    navigator.bluetooth.addEventListener("advertisementreceived", (event) => {
      if (event.device.name != null) {
        if (bluetooth_data_dict[event.device.name] != undefined) {
          // Add data to existing device in dictionary
          bluetooth_data_dict[event.device.name].addTime(new Date().getTime());
          bluetooth_data_dict[event.device.name].addRSSI(event.rssi);
          bluetooth_data_dict[event.device.name].setTxPower(event.txPower);

          // Update new device to website display
          let deviceDisplay = document.getElementById(event.device.name);
          deviceDisplay.innerHTML = `
            name: ${event.device.name}, <br/>
            Last Packet Time: ${getCurrentTime(bluetooth_data_dict[event.device.name].time[bluetooth_data_dict[event.device.name].time.length-1])}, <br/>
            rssi: ${bluetooth_data_dict[event.device.name].rssi},<br/>
            txPower: ${bluetooth_data_dict[event.device.name].txPower} <br/>`;
        }
        else {
          // Add new device to dictionary
          bluetooth_data_dict[event.device.name] = new BluetoothDeviceData(event.device.name, new Date().getTime(), event.rssi, event.txPower);

          // Add new device to website display
          scanText.innerHTML += `<li class='list-group-item' id='${event.device.name}' style='word-wrap: break-word'>
            name: ${event.device.name}, <br/>
            time: ${getCurrentTime(bluetooth_data_dict[event.device.name].time[0])}, <br/>
            rssi: ${bluetooth_data_dict[event.device.name].rssi},<br/>
            txPower: ${bluetooth_data_dict[event.device.name].txPower} <br/> 
          </li>`;
        }
      }
    });


    function stopScan() {
      scanText.innerHTML +=
        "<li class='list-group-item'> Stopping Scan ... </li>";
      scan.stop();
      scanText.innerHTML +=
        "<li class='list-group-item'> Scan Stopped! scan.active = " +
        scan.active +
        "</li>";
    }
    //setTimeout(stopScan, 10000);
  } catch (error) {
    console.log("Argh! " + error);
  }
}




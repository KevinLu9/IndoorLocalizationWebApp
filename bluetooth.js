// --------------------------------- Bluetooth Data Implementation ---------------------------------
// Bluetooth Data Class
class BluetoothDeviceData {
  constructor(name, id, time, rssi, txPower) {
    this.name = name;
    this.id = id
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
var bluetoothDataDict = {
  TestDevice: new BluetoothDeviceData(
    "TestDevice",
    "asdasdsadasf",
    new Date().getTime(),
    60,
    30
  ),
};

// On Button Click to Start Scanning for BLE devices
async function onButtonClickStartScan() {
    console.log("Start Scan Pressed")
  // let filters = [];
  //let filters = [{"name":"FYP tag"}]
  let filters = [{name:"BLE BEACON", companyIdentifier:0xEEEE}] // Filter by name, and company (0x0118 is Radius Networks, Inc.)
  let options = {};
  //options.acceptAllAdvertisements = true;
  options.filters = filters;
  bluetoothDataDict = {}; // Reset the bluetooth data dictionary every button press
  //document.getElementById('StartScanButton').innerHTML = "Restart Scan";
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
    console.log("Scan Request Success")
    // Disable StartScanButton and Enable StopScanButton
    startScanButton = document.getElementById("StartScanButton");
    stopScanButton = document.getElementById("StopScanButton");
    startScanButton.disabled = true;
    stopScanButton.disabled = false;

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
      return (
        time.getDay() +
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
        (time.getHours() < 12 ? " AM" : " PM")
      );
    };

    // Process Advertisement data and display onto the GUI
    const OnAdvertisementReceived = (event) => {
      if (event.device.name != null) {
        if (bluetoothDataDict[event.device.name] != undefined) {
          // Add data to existing device in dictionary
          bluetoothDataDict[event.device.name].addTime(new Date().getTime());
          bluetoothDataDict[event.device.name].addRSSI(event.rssi);
          bluetoothDataDict[event.device.name].setTxPower(event.txPower);

          // Update new device to website display
          let deviceDisplay = document.getElementById(event.device.name);
          deviceDisplay.innerHTML = `
              name: ${event.device.name}, <br/>
              id: ${event.device.id}, <br/>
              Last Packet Time: ${getCurrentTime(
                bluetoothDataDict[event.device.name].time[
                  bluetoothDataDict[event.device.name].time.length - 1
                ]
              )}, <br/>
              rssi: ${bluetoothDataDict[event.device.name].rssi},<br/>
              txPower: ${bluetoothDataDict[event.device.name].txPower} <br/>`;
        } else {
          // Add new device to dictionary
          bluetoothDataDict[event.device.name] = new BluetoothDeviceData(
            event.device.name,
            event.device.id,
            new Date().getTime(),
            event.rssi,
            event.txPower
          );

          // Add new device to website display
          scanText.innerHTML += `<li class='list-group-item' id='${
            event.device.name
          }' style='word-wrap: break-word'>
              name: ${event.device.name}, <br/>
              id: ${event.device.id}, <br/>
              time: ${getCurrentTime(
                bluetoothDataDict[event.device.name].time[0]
              )}, <br/>
              rssi: ${bluetoothDataDict[event.device.name].rssi},<br/>
              txPower: ${bluetoothDataDict[event.device.name].txPower} <br/> 
            </li>`;
        }
      }
    };
    // Event listener for advertisements received
    navigator.bluetooth.addEventListener(
      "advertisementreceived",
      OnAdvertisementReceived
    );

    // Event listening to StopScanButton press
    stopScanButton.addEventListener("click", () => {
      console.log("StopScanButton pressed!");
      // Toggle scan buttons
      startScanButton.disabled = false;
      stopScanButton.disabled = true;
      scan.stop();
      // Remove Event listeners
      stopScanButton.removeEventListener("click", this); // This event listener
      navigator.bluetooth.removeEventListener(
        "advertisementreceived",
        OnAdvertisementReceived
      ); // The bluetooth advertisement listener
      scanText.innerHTML =
        "<li class='list-group-item'>Begin Scan for Advertisements</li>";
    });

    //   function stopScan() {
    //     scanText.innerHTML +=
    //       "<li class='list-group-item'> Stopping Scan ... </li>";
    //     scan.stop();
    //     scanText.innerHTML +=
    //       "<li class='list-group-item'> Scan Stopped! scan.active = " +
    //       scan.active +
    //       "</li>";
    //   }
    //setTimeout(stopScan, 10000);
  } catch (error) {
    console.log("Argh! " + error);
  }
}

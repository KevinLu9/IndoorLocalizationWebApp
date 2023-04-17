var bluetooth_data_dict = {};

async function onButtonClick() {
  let filters = [];
  let options = {};
  options.acceptAllAdvertisements = true;
  //options.filters = filters;

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

    const scan = await navigator.bluetooth.requestLEScan(options);

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

    navigator.bluetooth.addEventListener("advertisementreceived", (event) => {
      if (event.device.name != null) {
        time = new Date();
        let scanTextString = "<li class='list-group-item'>" +
          "<br>Device Name: " +
          event.device.name +
          "<br>Time Captured: " +
          time.getDay() + "-" + time.getMonth() + "-" + time.getYear() + " " + 
          time.getHours()%12 + ":" + time.getMinutes() + ":" + time.getSeconds() + "." + 
          time.getMilliseconds() + ((time.getHours() < 12) ? " AM" : " PM") +
          "<br>RSSI: " +
          event.rssi +
          "<br>TX Power: " +
          event.txPower +
          "<br>UUIDs: " +
          event.uuids + "<br>";
          event.manufacturerData.forEach((valueDataView, key) => {
            scanTextString += logDataView("Manufacturer", key, valueDataView);
          })

          //scanTextString += "<br> Service Data: "

          event.serviceData.forEach((valueDataView, key) => {
            scanTextString += logDataView("Service", key, valueDataView);
          });
           
        scanTextString += "</li>";
        scanText.innerHTML += scanTextString;

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
  } catch (error) {
    console.log("Argh! " + error);
  }
}

setTimeout(stopScan, 10000);

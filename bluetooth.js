// --------------------------------- Bluetooth Data Implementation ---------------------------------
// Bluetooth Data Class
class BluetoothDeviceData {
    constructor(name, id, time, rssi, txPower) {
        this.name = name;
        this.id = id;
        this.time = [time];
        this.rssi = [rssi];
        this.txPower = txPower;

        // Set up Chart attributes
        this.chart = null;
        this.maxPointsShow = 10;
        this.xLabel = Array.from(Array(this.maxPointsShow).keys()); // Creates an array of [0..N]
        this.yLabel = new Array(this.maxPointsShow).fill(null);
        this.yLabel[0] = rssi;
        this.currentIndex = 1;
    }

    createChart() {
        // Create a new Chart from ChartJS
        this.chart = new Chart(`graph_${this.id}`, {
            type: "line",
            data: {
                labels: this.xLabel,
                datasets: [
                    {
                        fill: false,
                        radius: 1,
                        lineTension: 0,
                        backgroundColor: "rgba(0,0,255,1.0)",
                        borderColor: "rgba(0,0,255,1)",
                        data: this.yLabel,
                    },
                ],
            },
            options: {
                animation: false, // Disable animations for better performance
                scales: {
                    y: { suggestedMin: -100, suggestedMax: 0 },
                    x: { type: "linear", ticks: { stepSize: 1 } },
                },
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: "RSSI",
                    },
                },
            },
        });
    }

    addTime(time) {
        this.time.push(time);
    }

    addRSSI(rssi) {
        this.rssi.push(rssi);
        if (this.currentIndex >= this.maxPointsShow) {
            // Shift all the values left by one
            for (let i = 0; i < this.maxPointsShow - 1; i++) {
                this.yLabel[i] = this.yLabel[i + 1];
                this.xLabel[i] = this.xLabel[i + 1];
            }
            // Show the latest data onto the graph
            this.yLabel[this.maxPointsShow - 1] = rssi;
            this.xLabel[this.maxPointsShow - 1] = this.rssi.length - 1;
        } else {
            this.yLabel[this.currentIndex] = rssi;
            this.currentIndex = this.currentIndex + 1;
        }
        // Update chartJS to display latest rssi values
        this.chart.update();
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
        console.log(
            "Bluetooth Status: This Device Does Not Support Bluetooth!"
        );
    }
});

// Initialize Bluetooth Data Collection Storage
var bluetoothDataDict = {};

// On Button Click to Start Scanning for BLE devices
async function onButtonClickStartScan() {
    console.log("Start Scan Pressed");
    // let filters = [];
    //let filters = [{"name":"FYP tag"}]
    let filters = [{ name: "BLE BEACON", companyIdentifier: 0xeeee }]; // Filter by name, and company (0x0118 is Radius Networks, Inc.)
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
        console.log("Scan Request Success");
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
            //const textDecoder = new TextDecoder("ascii");
            //const asciiString = textDecoder.decode(valueDataView.buffer);
            return (
                `  ${labelOfDataSource} Data: ` +
                //key +
                hexString +
                " (Hex)"

                //+ "<br>    (ASCII) " +
                //asciiString
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
            if (event.device.id != null) {
                if (bluetoothDataDict[event.device.id] != undefined) {
                    // Add data to existing device in dictionary
                    bluetoothDataDict[event.device.id].addTime(
                        new Date().getTime()
                    );
                    bluetoothDataDict[event.device.id].addRSSI(event.rssi);
                    bluetoothDataDict[event.device.id].setTxPower(
                        event.txPower
                    );

                    // Get Manufacturer Data
                    let mData = "";
                    event.manufacturerData.forEach((valueDataView, key) => {
                        mData =
                            mData +
                            logDataView("Manufacturer", key, valueDataView);
                    });

                    // Update new device to website display
                    let deviceDisplay = document.getElementById(
                        event.device.id
                    );
                    deviceDisplay.innerHTML = `
                        name: ${event.device.name}, <br/>
                        id: ${event.device.id}, <br/>
                        Last Packet Time: ${getCurrentTime(
                            bluetoothDataDict[event.device.id].time[
                                bluetoothDataDict[event.device.id].time.length -
                                    1
                            ]
                        )}, <br/>
                        txPower: ${
                            bluetoothDataDict[event.device.id].txPower
                        } <br/>
                        ${mData} <br/>`;
                } else {
                    // ELSE add a new device to dictionary and display on website.
                    // Add new device to dictionary
                    bluetoothDataDict[event.device.id] =
                        new BluetoothDeviceData(
                            event.device.name,
                            event.device.id,
                            new Date().getTime(),
                            event.rssi,
                            event.txPower
                        );

                    // Add new device to website display
                    // Get Manufacturer Data
                    let mData = "";
                    event.manufacturerData.forEach((valueDataView, key) => {
                        mData =
                            mData +
                            logDataView("Manufacturer", key, valueDataView);
                    });

                    // Create a DOM for the new bluetooth beacon
                    let bluetoothListItem = document.createElement("li");
                    bluetoothListItem.setAttribute("class", "list-group-item");
                    bluetoothListItem.innerHTML = `<div id='${
                        event.device.id
                    }' style='word-wrap: break-word'>
                    Name: ${event.device.name}, <br/>
                    ID: ${event.device.id}, <br/>
                    Time: ${getCurrentTime(
                        bluetoothDataDict[event.device.id].time[0]
                    )}, <br/>
                    ${mData} <br/>
                    txPower: ${
                        bluetoothDataDict[event.device.id].txPower
                    } <br/> 
                    </div>
                    <canvas id="graph_${
                        event.device.id
                    }" style="width:100%;max-width:600px"></canvas>`;
                    scanText.appendChild(bluetoothListItem);

                    // Create the chart
                    bluetoothDataDict[event.device.id].createChart();
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
    } catch (error) {
        console.log("Argh! " + error);
    }
}

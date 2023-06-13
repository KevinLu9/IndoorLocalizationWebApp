<script>
    import { onMount, afterUpdate, onDestroy } from 'svelte'
    import Icon from "heroicons-for-svelte"
    import { ClipboardList, ClipboardCheck, BadgeCheck, XCircle } from "heroicons-for-svelte/icons/outline"
    import Chart from "chart.js/auto"

    let clipboardClicked = false
    let hasExperimentalFlagEnabled = null
    let bluetoothAvailable = null
    let hasUserPermission = false
    let scan = null
    let bluetoothDataDict = null
    let isScanning = false

    $: bluetoothDataDict = {}

    // --------------------------------- Bluetooth Debugging ---------------------------------
    const getBluetooth = () => {try {
        navigator.bluetooth.getAvailability().then((res) => {bluetoothAvailable = res})
        scan = getScan()
        // scan.then( (res) => {hasUserPermission = res})
        hasExperimentalFlagEnabled = true
    }
    catch {
        hasExperimentalFlagEnabled = false
        console.log("Web Bluetooth Not Available")
    }}
     async function getScan() {
        let options = {}
        let filters = [{ name: "BLE BEACON", companyIdentifier: 0xeeee }]; // Filter by name, and company (0x0118 is Radius Networks, Inc.)
        options.filters = filters;
        // options.acceptAllAdvertisements = true
        scan = await navigator.bluetooth.requestLEScan(options)
        if (scan) {
            hasUserPermission = true
        }
        return scan
    }
    // setTimeout(getBluetooth, 1000)
    onMount(getBluetooth)
    // --------------------------------- Bluetooth Implementation ---------------------------------
    class BluetoothDevice {
        /**
         * Represents a Bluetooth Device and its properties
         * @param {*} name : The name of the Bluetooth device
         * @param {*} id  : The address of the bluetooth device
         * @param {*} time : The times that packets were received from the device
         * @param {*} rssi : The received signal strength indicator values received from the device 
         * @param {*} txPower : The transmission power of the device in dBm
         */
        constructor(name, id, time, rssi, txPower) {
            this.name = name;
            this.id = id;
            this.time = [time];
            this.rssi = [rssi];
            this.txPower = txPower;

            // Set up Chart attributes
            this.chart = null;
            this.maxPointsShow = 50;
            this.xLabel = Array.from(Array(this.maxPointsShow).keys()); // Creates an array of [0..N]
            this.yLabel = new Array(this.maxPointsShow).fill(null);
            this.yLabel[0] = rssi;
            this.currentIndex = 1;
        }
        /**
         * Creates a new chart from the ChartJS library to display RSSI values to the user.
         */
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

        /**
         * Appends a new time to the time list.
         * @param {*} time 
         */
        addTime(time) {
            this.time.push(time);
        }

        /**
         * Appends a new RSSI value to the RSSI list.
         * @param {*} rssi 
         */
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
            if (this.chart)
            {
                this.chart.update();
            }
        }

        /**
         * Assigns the transmission power of the BLE device
         * @param {*} txPower 
         */
        setTxPower(txPower) {
            this.txPower = txPower;
        }
    }

    const getCurrentTime = (ms_time) => {
            let time = new Date();
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
            )
        }

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
                } else {
                    // ELSE add a new device to dictionary and display on website.
                    // Add new device to dictionary
                    bluetoothDataDict[event.device.id] =
                        new BluetoothDevice(
                            event.device.name,
                            event.device.id,
                            new Date().getTime(),
                            event.rssi,
                            event.txPower
                        );
                    }
                }
        };

        // Function to stop the bluetooth scanning
        const stopScan = () => {
            isScanning = false
            scan.stop()
            navigator.bluetooth.removeEventListener(
                "advertisementreceived",
                OnAdvertisementReceived
                );
                
            
            console.log("Bluetooth Advertising Scanning Stopped")
            }

        const startScan = () => {
        if (bluetoothAvailable && hasExperimentalFlagEnabled && hasUserPermission) {
            isScanning = true
            console.log("Bluetooth Advertising Scanning Started")
            bluetoothDataDict = {}
            // Event listener for advertisements received
            navigator.bluetooth.addEventListener(
                "advertisementreceived",
                OnAdvertisementReceived
            );
            
        }
    }


    

    

    // --------------------------------- Sensor Implementation ---------------------------------
    // Orientation Sensor, Accelerometer Sensor, and Gyroscope Sensor
    const PARAM = {
        ORIENTATION_A: "Orientation_a",
        ORIENTATION_B: "Orientation_b",
        ORIENTATION_G: "Orientation_g",
        ACCELEROMETER_X: "Accelerometer_x",
        ACCELEROMETER_Y: "Accelerometer_y",
        ACCELEROMETER_Z: "Accelerometer_z",
        GYROSCOPE_A: "Gyroscope_a",
        GYROSCOPE_B: "Gyroscope_b",
        GYROSCOPE_G: "Gyroscope_g",
    };

    let orientation
    let accelerometer
    let gyroscope
    $: {
        orientation = [0, 0, 0]
        accelerometer = [0, 0, 0]
        gyroscope = [0, 0, 0]
    }

    function handleOrientation(event) {
        orientation = [event.alpha, event.beta, event.gamma]
    }

    function handleMotion(event) {
        accelerometer = [event.acceleration.x, event.acceleration.y, event.acceleration.z]
        gyroscope = [event.rotationRate.alpha, event.rotationRate.beta, event.rotationRate.gamma]
    }

    window.addEventListener("deviceorientation", handleOrientation);
    window.addEventListener("devicemotion", handleMotion);

    onDestroy( () => {
        window.removeEventListener("deviceorientation", handleOrientation)
        window.addEventListener("devicemotion", handleMotion)
    })

</script>



<div class="flex flex-col items-center m-4 justify-items-end">
    <span class="flex">
        <h1 class="pb-2 flex-shrink-0">Bluetooth Available</h1>
        {#if bluetoothAvailable}
        <Icon icon={BadgeCheck} class="scale-150 ml-2 w-16 h-16 text-green-500 flex-shrink-0"></Icon>
        {:else if bluetoothAvailable === false}
        <Icon icon={XCircle} class="scale-150 ml-2 flex-1 text-red-500 flex-shrink-0"></Icon>
        {:else if bluetoothAvailable === null}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 animate-spin text-gray-300 ml-2 flex-shrink-0">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
        {/if}
    </span>
    <span class="flex">
        <h1 class="flex items-center w-full text-center pb-2">Experimental Features Enabled</h1>
        {#if hasExperimentalFlagEnabled}
        <Icon icon={BadgeCheck} class="scale-150 ml-2 w-16 h-16 text-green-500 flex-shrink-0"></Icon>
        {:else if bluetoothAvailable}
        <Icon icon={XCircle} class="scale-150 ml-2 w-16 h-16 text-red-500 flex-shrink-0"></Icon>
        {/if}
    </span>
    <span class="flex">
        <h1 class="flex items-center w-full text-center pb-2">User Permission</h1>
        {#if hasUserPermission}
        <Icon icon={BadgeCheck} class="scale-150 ml-2 w-16 h-16 text-green-500 flex-shrink-0"></Icon>
        {:else}
        <Icon icon={XCircle} class="scale-150 ml-2 w-16 h-16 text-red-500 flex-shrink-0"></Icon>
        {/if}
    </span>
    
    
    {#if !hasExperimentalFlagEnabled}
    <div class="divider"/>
    <h1 class="text-center pb-2 font-bold">Enable Experimental Web Platform Features</h1>
    <h1 class="text-center pb-2">Copy and Paste into URL:</h1>
    <button class="btn h-full p-2" on:click={() => {navigator.clipboard.writeText("chrome://flags/#enable-experimental-web-platform-features");clipboardClicked = true}}>
        <span class="flex">
            <h1>chrome://flags/#enable-experimental-web-platform-features</h1>
            <div class="flex items-center ml-2">
                {#if clipboardClicked}
                <Icon icon={ClipboardCheck} class="scale-150 text-green-500"></Icon>
                {:else}
                <Icon icon={ClipboardList} class="scale-150"></Icon>
                {/if}
            </div>
        </span>
    </button>
    <h1 class="text-center pt-2">Then hit 'Relaunch' at the bottom.</h1>
    {/if}

    {#if !hasUserPermission}
    <div class="divider"/>
    <button class='btn btn-primary justify-end mt-4 bg-blue-500' on:click={() => getBluetooth()}>Prompt User Bluetooth Permission</button>
    {:else}
    <div class="divider"/>
    <h1 class="font-bold">Bluetooth Was Setup Successfully</h1>
    {/if}
    <div class="divider"/>
    <!-- Device Sensor Data -->
    <h2 class="justify-center font-bold">Device Sensor Data</h2>
    <div style="text-align: center">
      <ul class="list-group">
        <li class="list-group-item">
          <h4>Orientation</h4>
          <button class="btn bg-cyan-900 text-white w-12 h-12 disabled">{orientation[0].toFixed(0)}</button>
          <button class="btn bg-cyan-900 text-white w-12 h-12 disabled">{orientation[1].toFixed(0)}</button>
          <button class="btn bg-cyan-900 text-white w-12 h-12 disabled">{orientation[2].toFixed(0)}</button>
        </li>
        <li class="list-group-item">
          <h4 style="text-align: center; margin: 5px">Accelerometer</h4>
          <button class="btn bg-cyan-900 text-white w-12 h-12 disabled">{accelerometer[0].toFixed(0)}</button>
          <button class="btn bg-cyan-900 text-white w-12 h-12 disabled">{accelerometer[1].toFixed(0)}</button>
          <button class="btn bg-cyan-900 text-white w-12 h-12 disabled">{accelerometer[2].toFixed(0)}</button>
        </li>
        <li class="list-group-item">
          <h4 style="text-align: center; margin: 5px">Gyroscope</h4>
          <button class="btn bg-cyan-900 text-white w-12 h-12 disabled">{gyroscope[0].toFixed(0)}</button>
          <button class="btn bg-cyan-900 text-white w-12 h-12 disabled">{gyroscope[1].toFixed(0)}</button>
          <button class="btn bg-cyan-900 text-white w-12 h-12 disabled">{gyroscope[2].toFixed(0)}</button>
        </li>
      </ul>
      
    </div>
    <div class="divider"/>
    <h1 class="font-bold">Bluetooth Advertisement Scanning</h1>
    {#if isScanning}
    <button class='btn btn-primary justify-end mt-4 bg-red-500' on:click={() => stopScan()}>Stop Scan</button>
    {:else}
    <button class='btn btn-primary justify-end mt-4 bg-orange-500' on:click={() => startScan()}>Start Scan</button>
    {/if}
    <div class="divider"/>
    <ul class="">
        {#if Object.keys(bluetoothDataDict).length > 0}
            {#each Object.keys(bluetoothDataDict) as id}
                <li>
                    <h1 class="font-bold">Name: {bluetoothDataDict[id].name}</h1>
                    <h2>ID: {id}</h2>
                    <h2>txPower: {bluetoothDataDict[id].txPower}dB</h2>
                    <h2>Click on Map to View RSSI</h2>
                    <canvas class="outline" id={`graph_${id}`} on:click={() => {bluetoothDataDict[id].createChart()}}></canvas>
                </li>
                <div class="divider"/>
            {/each}
        {:else}
        <h1>No Bluetooth Devices Found</h1>
        {/if}
    </ul>
</div>



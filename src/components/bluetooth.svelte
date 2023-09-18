<script>
  import { onMount, afterUpdate, onDestroy } from "svelte";
  import Icon from "heroicons-for-svelte";
  import {
    ClipboardList,
    ClipboardCheck,
    BadgeCheck,
    XCircle,
    InformationCircle,
    ChevronDown,
    ChevronUp,
  } from "heroicons-for-svelte/icons/outline";
  import Chart from "chart.js/auto";
  import { url } from "@roxi/routify";
  import { distanceWorker, positionWorker } from "../store";
  import { api } from "../api";
  import { beacons } from "../store";

  let clipboardClicked = false;
  let hasExperimentalFlagEnabled = null;
  let deviceHasBluetooth = null;
  let hasUserPermission = false;
  let scan = null;
  let bluetoothDataDict = {};
  let isScanning = false;
  let confirmModalDiv;
  $: {
    beacons.set(Object.values(bluetoothDataDict).map((value) => {return {id: value.id, txPower: value.txPower, name: value.name, x: value.x, y: value.y, z: value.z, content: value.content}}));
  };

  $: {
    bluetoothDataDict;
  }

  // Distance worker Setup
  // distanceWorker.onmessage = (e) => {
  //   console.log('[BLUETOOTH FROM DISTANCE WORKER]', e.data);
  // };
  // --------------------------------- Bluetooth Debugging ---------------------------------

  const getBluetooth = () => {
    navigator.bluetooth.getAvailability().then((res) => {
      deviceHasBluetooth = res;
      hasExperimentalFlagEnabled =
        navigator?.bluetooth?.requestLEScan != undefined;
      scan = getScan();
    });

    // scan.then( (res) => {hasUserPermission = res})
  };
  async function getScan() {
    let options = {};
    let filters = [{ name: "BLE BEACON", companyIdentifier: 0xeeee }]; // Filter by name, and company (0x0118 is Radius Networks, Inc.)
    options.filters = filters;
    // options.acceptAllAdvertisements = true
    try {
      scan = await navigator.bluetooth.requestLEScan(options);
    } catch {
      console.log("Web Bluetooth API Not Available");
      scan = undefined;
    }

    if (scan) {
      hasUserPermission = true;
      startScan();
    }

    if (
      deviceHasBluetooth &&
      hasExperimentalFlagEnabled &&
      !hasUserPermission
    ) {
      confirmModalDiv.click();
    }

    return scan;
  }
  // setTimeout(getBluetooth, 1000)
  getBluetooth();
  // onMount();
  // --------------------------------- Bluetooth Implementation ---------------------------------
  class BluetoothBeacon {
    /**
     * Represents a Bluetooth Beacon and its properties
     * @param {*} name : The name of the Bluetooth beacon
     * @param {*} id  : The address of the bluetooth beacon
     * @param {*} time : The times that packets were received from the beacon
     * @param {*} rssi : The received signal strength indicator values received from the beacon
     * @param {*} txPower : The transmission power of the beacon in dBm
     */
    constructor(id, name, txPower, x, y, z, content, rssi, time) {
      this.name = name;
      this.id = id;
      this.x = x;
      this.y = y;
      this.z = z;
      this.time = [];
      this.rssi = [];
      this.txPower = txPower;
      this.content = content;

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
      bluetoothDataDict = bluetoothDataDict;
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
      if (this.chart) {
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
onMount(() => {
  // get bluetooth beacons from api
  api.get_beacon().then((res) => {
    // console.log("[BLUETOOTH] INITIAL BEACONS: ", res.data)
    res?.data?.forEach((beacon) => {
      bluetoothDataDict[beacon.id] = new BluetoothBeacon(
        beacon.id,
        beacon.name,
        beacon.txPower,
        beacon.x,
        beacon.y,
        beacon.z,
        beacon.content,
        0,
        new Date().getTime()
      );
      distanceWorker.postMessage({
          command: "device",
          values: { id: beacon.id, txPower: beacon.txPower, x: beacon.x, y: beacon.y, z: beacon.z },
        });
    })
  })
})
  

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
    );
  };

  const logDataView = (labelOfDataSource, key, valueDataView) => {
  const hexString = [...new Uint8Array(valueDataView.buffer)].map(b => {
    return b.toString(16).padStart(2, '0');
  }).join(' ');
  const textDecoder = new TextDecoder('ascii');
  const asciiString = textDecoder.decode(valueDataView.buffer);
  console.log(`  ${labelOfDataSource} Data: ` + key +
      '\n    (Hex) ' + hexString +
      '\n    (ASCII) ' + asciiString);
};

  // Process Advertisement data and display onto the GUI
  const OnAdvertisementReceived = (event) => {
    let manufacturer = undefined
    event?.manufacturerData?.forEach((valueDataView, key) => {
      if (key != 61166) {
        return;
      }
      manufacturer = valueDataView;
    }); // Find key with 0xEEEE manufacturer
    if (manufacturer) {
      const manufacturerID = [...new Uint8Array(manufacturer.buffer)].map(b => {
          return b.toString(16).padStart(2, '0');
        }).join(' ');
      if (bluetoothDataDict[manufacturerID] != undefined) {

      //   event.manufacturerData.forEach((valueDataView, key) => {
      //     logDataView('Manufacturer: ', key, valueDataView);
      // });
      // Set id as manufacturer information
      
        // Add data to existing device in dictionary
        let time = new Date().getTime();
        bluetoothDataDict[manufacturerID].addTime(time);
        bluetoothDataDict[manufacturerID].addRSSI(event.rssi);
        bluetoothDataDict[manufacturerID].setTxPower(event.txPower);
        distanceWorker.postMessage({
          command: "rssi",
          values: { id: manufacturerID, time: time, rssi: event.rssi },
        });
      } else {
        // ELSE add a new device to dictionary and display on website.
        // Add new device to dictionary
        bluetoothDataDict[manufacturerID] = new BluetoothBeacon(
          manufacturerID,
          event.device.name,
          event.txPower,
          null,
          null,
          null,
          event.rssi,
          new Date().getTime(),
        );
        api.create_beacon(manufacturerID, event.device.name, event.txPower, 0, 0, 0)
        .then((res) => {
          console.log("[API] Created Beacon: ", res);
        })
        distanceWorker.postMessage({
          command: "device",
          values: { id: manufacturerID, txPower: event.txPower, x: 0, y: 0, z: 0 },
        });
      }
    }
  };

  // Function to stop the bluetooth scanning
  const stopScan = () => {
    isScanning = false;
    scan.stop();
    navigator.bluetooth.removeEventListener(
      "advertisementreceived",
      OnAdvertisementReceived
    );

    console.log("Bluetooth Advertising Scanning Stopped");
  };

  const startScan = () => {
    if (deviceHasBluetooth && hasExperimentalFlagEnabled && hasUserPermission) {
      isScanning = true;
      console.log("Bluetooth Advertising Scanning Started");
      // bluetoothDataDict = {};
      // Event listener for advertisements received
      navigator.bluetooth.addEventListener(
        "advertisementreceived",
        OnAdvertisementReceived
      );
    }
  };
</script>

<div class="flex flex-col items-center m-4 justify-items-end">
  <span class="flex">
    <h1 class="pb-2 flex-shrink-0">Device has Bluetooth Module</h1>
    {#if deviceHasBluetooth}
      <Icon
        icon={BadgeCheck}
        class="scale-150 ml-2 w-16 h-16 text-green-500 flex-shrink-0"
      />
    {:else if deviceHasBluetooth === false}
      <Icon
        icon={XCircle}
        class="scale-150 ml-2 flex-1 text-red-500 flex-shrink-0"
      />
    {:else if deviceHasBluetooth === null}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-5 h-5 animate-spin text-gray-300 ml-2 flex-shrink-0"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
        />
      </svg>
    {/if}
  </span>
  <span class="flex">
    <h1 class="flex items-center w-full text-center pb-2">
      Experimental Features Enabled
    </h1>
    {#if hasExperimentalFlagEnabled}
      <Icon
        icon={BadgeCheck}
        class="scale-150 ml-2 w-16 h-16 text-green-500 flex-shrink-0"
      />
    {:else if deviceHasBluetooth}
      <Icon
        icon={XCircle}
        class="scale-150 ml-2 w-16 h-16 text-red-500 flex-shrink-0"
      />
    {/if}
  </span>
  <span class="flex">
    <h1 class="flex items-center w-full text-center pb-2">User Permission</h1>
    {#if hasUserPermission}
      <Icon
        icon={BadgeCheck}
        class="scale-150 ml-2 w-16 h-16 text-green-500 flex-shrink-0"
      />
    {:else}
      <Icon
        icon={XCircle}
        class="scale-150 ml-2 w-16 h-16 text-red-500 flex-shrink-0"
      />
    {/if}
  </span>
  <p class="font-bold underline">Please make sure Bluetooth is Enabled!</p>

  {#if !hasExperimentalFlagEnabled}
    <div class="divider" />
    <h1 class="text-center pb-2 font-bold">
      Enable Experimental Web Platform Features
    </h1>
    <h1 class="text-center pb-2">Copy and Paste into URL:</h1>
    <button
      class="btn h-full p-2"
      on:click={() => {
        navigator.clipboard.writeText(
          "chrome://flags/#enable-experimental-web-platform-features"
        );
        clipboardClicked = true;
      }}
    >
      <span class="flex">
        <h1>chrome://flags/#enable-experimental-web-platform-features</h1>
        <div class="flex items-center ml-2">
          {#if clipboardClicked}
            <Icon icon={ClipboardCheck} class="scale-150 text-green-500" />
          {:else}
            <Icon icon={ClipboardList} class="scale-150" />
          {/if}
        </div>
      </span>
    </button>
    <h1 class="text-center pt-2">Then hit 'Relaunch' at the bottom.</h1>
  {/if}

  {#if !hasUserPermission}
    <div class="divider" />
    <button
      class="btn btn-primary justify-end mt-4 bg-blue-500"
      id="bluetooth-button"
      on:click={() => getBluetooth()}>Prompt User Bluetooth Permission</button
    >
  {:else}
    <div class="divider" />
    <h1 class="font-bold">Bluetooth Was Setup Successfully</h1>
  {/if}
  <div class="divider" />

  <h1 class="font-bold">Bluetooth Advertisement Scanning</h1>
  {#if isScanning}
    <button
      class="btn btn-primary justify-end mt-4 bg-red-500"
      on:click={() => stopScan()}>Stop Scan</button
    >
  {:else}
    <button
      class="btn btn-primary justify-end mt-4 bg-orange-500"
      on:click={() => startScan()}>Start Scan</button
    >
  {/if}
  <div class="divider" />
  <ul class="">
    {#if Object.keys(bluetoothDataDict).length > 0}
      {#each Object.keys(bluetoothDataDict) as id}
        <li>
          <h1 class="font-bold">Name: {bluetoothDataDict[id].name}</h1>
          <h2>ID: {id}</h2>
          <h2>txPower: {bluetoothDataDict[id].txPower}dB</h2>
          <h2>RSSI: {bluetoothDataDict[id].rssi[bluetoothDataDict[id].rssi.length - 1]}</h2>
          <h2>Click on Map to View RSSI</h2>
          <canvas
            class="outline"
            id={`graph_${id}`}
            on:click={() => {
              bluetoothDataDict[id].createChart();
            }}
          />
        </li>
        <div class="divider" />
      {/each}
    {:else}
      <h1>No Bluetooth Devices Found</h1>
    {/if}
  </ul>
</div>

<button
  bind:this={confirmModalDiv}
  class="btn hidden"
  onclick="my_modal_1.showModal()">open modal</button
>
<dialog id="my_modal_1" class="modal">
  <form method="dialog" class="modal-box">
    <h3 class="font-bold text-xl">Setting Up Bluetooth</h3>
    <div class="divider p-0 m-0" />
    <div
      class="flex flex-col items-center p-4 w-full max-h-[35vh] dark:bg-gray-800 overflow-y-auto"
    >
      <span class="flex">
        <h1 class="pb-2 flex-shrink-0">Device has Bluetooth Module</h1>
        {#if deviceHasBluetooth}
          <Icon
            icon={BadgeCheck}
            class="scale-150 ml-2 w-16 h-16 text-green-500 flex-shrink-0"
          />
        {:else if deviceHasBluetooth === false}
          <Icon
            icon={XCircle}
            class="scale-150 ml-2 flex-1 text-red-500 flex-shrink-0"
          />
        {:else if deviceHasBluetooth === null}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-5 h-5 animate-spin text-gray-300 ml-2 flex-shrink-0"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
        {/if}
      </span>
      <span class="flex">
        <h1 class="flex items-center w-full text-center pb-2">
          Experimental Features Enabled
        </h1>
        {#if hasExperimentalFlagEnabled}
          <Icon
            icon={BadgeCheck}
            class="scale-150 ml-2 w-16 h-16 text-green-500 flex-shrink-0"
          />
        {:else if deviceHasBluetooth}
          <Icon
            icon={XCircle}
            class="scale-150 ml-2 w-16 h-16 text-red-500 flex-shrink-0"
          />
        {/if}
      </span>
      <span class="flex">
        <h1 class="flex items-center w-full text-center pb-2">
          User Permission
        </h1>
        {#if hasUserPermission}
          <Icon
            icon={BadgeCheck}
            class="scale-150 ml-2 w-16 h-16 text-green-500 flex-shrink-0"
          />
        {:else}
          <Icon
            icon={XCircle}
            class="scale-150 ml-2 w-16 h-16 text-red-500 flex-shrink-0"
          />
        {/if}
      </span>
      <p class="font-bold underline">Please make sure Bluetooth is Enabled!</p>

      {#if !hasExperimentalFlagEnabled}
        <div class="divider" />
        <h1 class="text-center pb-2 font-bold">
          Enable Experimental Web Platform Features
        </h1>
        <h1 class="text-center pb-2">Copy and Paste into URL:</h1>
        <button
          class="btn h-full p-2"
          on:click|preventDefault={() => {
            navigator.clipboard.writeText(
              "chrome://flags/#enable-experimental-web-platform-features"
            );
            clipboardClicked = true;
          }}
        >
          <span class="flex">
            <h1>chrome://flags/#enable-experimental-web-platform-features</h1>
            <div class="flex items-center ml-2">
              {#if clipboardClicked}
                <Icon icon={ClipboardCheck} class="scale-150 text-green-500" />
              {:else}
                <Icon icon={ClipboardList} class="scale-150" />
              {/if}
            </div>
          </span>
        </button>
        <h1 class="text-center pt-2">Then hit 'Relaunch' at the bottom.</h1>
      {/if}
    </div>
    <div class="divider p-0 m-0" />
    <p class="pt-4">
      This website requires Bluetooth to work. By pressing confirm, you
      acknowledge that your location data is being tracked.
    </p>
    <p class="">
      If you pressed 'Block' for the bluetooth popup, please clear website
      permissions.
    </p>
    <div class="modal-action">
      <!-- if there is a button in form, it will close the modal -->
      <button class="btn">Decline</button>
      <button
        class="btn {deviceHasBluetooth && hasExperimentalFlagEnabled
          ? 'btn-primary'
          : 'btn-disabled'}"
        on:click={getBluetooth}>Accept</button
      >
    </div>
  </form>
</dialog>

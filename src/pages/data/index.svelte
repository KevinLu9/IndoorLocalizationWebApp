<script>
  import { onMount } from "svelte";
  import { rawData, dataCollection } from "../../store.js"
  
  let isLogging = false;
  let kalmanDataString = "";

  class KalmanFilter {
    constructor(meas_uncertainty, est_uncertainty, q, cur_est = 0) {
        /**
         * Represents a Bluetooth Beacon and its properties
         * @param {*} meas_uncertainty : measurement uncertainty
         * @param {*} est_uncertainty  : estimate uncertainty
         * @param {*} q : process noise
         */
        this.meas_uncertainty = meas_uncertainty;
        this.est_uncertainty = est_uncertainty;
        this.q = q;
        this.prev_est = undefined;
        this.cur_est = cur_est;
        this.kalman_gain = 0;
    }
    calculateKalman(meas) {
        // meas: is the new value.
        if (this.prev_est == undefined) {
            this.prev_est = meas;
            this.cur_est = meas;
            return this.cur_est;
        }
        // Kalman steps
        this.kal_gain = this.est_uncertainty / (this.est_uncertainty + this.meas_uncertainty); // compute kalman gain
        // console.log('kalman gain: ', this.kal_gain);
        this.cur_est = this.prev_est + this.kal_gain * (meas - this.prev_est); // compute estimate for current time step
        this.est_uncertainty = (1 - this.kal_gain) * this.est_uncertainty + Math.abs(this.prev_est - this.cur_est) * this.q; // update estimate uncertainty
        this.prev_est = this.cur_est; // update previous estimate for next loop iteration
        return this.cur_est;
    }
}

  const sleep = ms => new Promise(res => setTimeout(res, ms));
  const startLogging = async () => {
    isLogging = true;
    // Raw Data Format
    // $rawData[manufacturerID] = {name: event.device.name, rssi: event.rssi, time: [new Date().getTime], used: false};
    const keys = Object.keys($rawData);
    while (isLogging) {
      console.log("1asdasdasd");
      let packet = {};
      for (let key of keys) {
        if (!$rawData[key]?.used) {
          packet[key] =  $rawData[key].rssi[$rawData[key].rssi.length - 1]
          $rawData[key].used = true;
        }
      }
      $dataCollection.push(packet);
      // console.log($dataCollection)
      await sleep(250);
    }
  }

  const stopLogging = () => {
    isLogging = false;
  }

  const clearLogs = () => {
    $dataCollection = [];
  }

  const copyData = () => {
    const stringData = JSON.stringify($dataCollection);
    navigator.clipboard.writeText(stringData);
  }

  const filterData = () => {
    let kFilter1 = new KalmanFilter(0.5, 0.5, 0.05);
    let kFilter2 = new KalmanFilter(0.5, 0.5, 0.05);
    let kFilter3 = new KalmanFilter(0.5, 0.5, 0.05);
    let kFilter4 = new KalmanFilter(0.5, 0.5, 0.05);
    let data = JSON.parse(kalmanDataString);
    let res = [];
    for (let d of data) {
      let val = {}
      if (d["01"]) {
        val["01"] = kFilter1.calculateKalman(d["01"])
      }
      if (d["02"]) {
        val["02"] = kFilter1.calculateKalman(d["02"])
      }
      if (d["03"]) {
        val["03"] = kFilter1.calculateKalman(d["03"])
      }
      if (d["04"]) {
        val["04"] = kFilter1.calculateKalman(d["04"])
      }
      res.push(val);
    }
    navigator.clipboard.writeText(JSON.stringify(res));
  }

  $: {
    // console.log({test:$dataCollection});
    
  }
</script>

<div class="m-2 flex flex-col gap-4 items-center justify-center">
  <p class="font-bold text-2xl">Data Collection</p>
  <div class="flex items-center w-full justify-center gap-2">
    <button class="btn btn-primary" on:click={startLogging} disabled={isLogging}>
      Start Logging
    </button>
    <button class="btn btn-secondary" on:click={stopLogging} disabled={!isLogging}>
      Stop Logging
    </button>
  </div>
  <div class="flex items-center w-full justify-center gap-2">
    <button class="btn btn-warning" on:click={clearLogs} disabled={isLogging}>
      Clear Logs
    </button>
    <button class="btn btn-success" on:click={copyData} disabled={isLogging}>
      Copy Logs
    </button>
  </div>
  
  <div class="w-full px-4 outline">
    <p class="font-bold text-md text-center">Devices Found ({Object.keys($rawData).length})</p>
    <ul class="w-full divide-y-2 divide-gray-400">
      <li class="flex justify-between items-center">
        <p class="font-bold">
          ID
        </p>
        <p class="font-bold">
          Last Data Time (UTC)
        </p>
      </li>
      {#if Object.keys($rawData).length > 0}
        {#each Object.entries($rawData) as [deviceID, deviceData]}
          <li class="flex justify-between items-center">
            <p>
              {deviceID}
            </p>
            <p>
              {deviceData?.time[deviceData?.time.length - 1]}
            </p>
            <p>
              {deviceData?.used}
            </p>
          </li>
        {/each}
      {:else}
        <p class="text-center">NO DEVICES FOUND</p>
      {/if}
    </ul>
  </div>

  <div class="w-full px-4 outline">
    <ul class="w-full divide-y-2 divide-gray-400 max-h-[200px] overflow-y-auto">
      <li class="flex justify-between items-center">
        <p class="font-bold">
          IDs
        </p>
        {#each Object.entries($rawData) as [deviceID, deviceData]}
        <p class="font-bold">
          {deviceID}
        </p>
        {/each}
      </li>
      {#if Object.keys($rawData).length > 0}
        {#each $dataCollection as data, index}
          <li class="flex justify-between items-center">
            <p>
              {index+1}
            </p>
            {#each Object.entries($rawData) as [deviceID, deviceData]}
              {#if Object.keys(data).includes(deviceID)}
              <p>
                {data[deviceID]}
              </p>
              {:else}
                <p>-200</p>
              {/if}
            {/each}
          </li>
        {/each}
      {:else}
        <p class="text-center">NO DEVICES FOUND</p>
      {/if}
    </ul>
  </div>

  <div class="flex items-center gap-4 w-full">
    <p class="font-bold">Kalman Filter Data String</p>
    <input bind:value={kalmanDataString} class="input input-bordered outline outline-base-200" />
    <button class="btn btn-primary" on:click={filterData}>Submit</button>
  </div>
  
</div>

<script>
  import { onMount } from "svelte";
  import { rawData, dataCollection } from "../../store.js"
  
  let isLogging = false;

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
  
</div>

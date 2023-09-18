<script>
  import { api } from "../../api.js";
  import { beacons } from "../../store.js";

  let ble_beacons = [];
  let isLoading = false;
  let isSuccess = false;
  let isError = false;
  let currentBeacon;
  let topDiv;

  beacons.subscribe(value => {
    value.forEach((beacon) => {
      if (ble_beacons.filter((item) => item.id == beacon.id).length <= 0) {
        ble_beacons.push(beacon);
        ble_beacons = ble_beacons;
      }
    });
  })


  const updateBeacon = (beacon) => {
    console.log(beacon)
    currentBeacon = beacon;
    isLoading = true;
    api.update_beacon(beacon.id, beacon.name, beacon.txPower, beacon.x, beacon.y, beacon.z)
    .then((res) => {
      console.log("updateBeacon: ", res);
      if (!res.error) {
        isSuccess = true;
        topDiv.focus();
      } else {
        isError = true;
      }
      isLoading = false;
      setTimeout(() => {
        isError = false;
        isSuccess = false;
      }, "4000");
    })
  } 
</script>

<template>
  <div class="p-4" tabindex=0 bind:this={topDiv}>
    <p class="font-bold text-center text-xl">Setup Bluetooth Beacons</p>
    <p class="text-center">Beacons with coordinates (0, 0, 0) will be ignored! The App should also be reloaded after changing these values.</p>
  </div>
  
  <div class="w-full flex flex-col items-center justify-center p-4">
      {#if isLoading}
        <span class="loading loading-spinner loading-lg mb-2"></span>
      {:else if isSuccess}
        <div class="w-full bg-success border border-black dark:border-white m-4 p-2 text-center rounded-lg">
          <p class="text-black font-bold">Success!</p>
          <p class="text-black">Successfully Updated Beacon with ID: {currentBeacon.id}</p>
        </div>
      {:else if isError}
      <div class="w-full bg-error border border-black dark:border-white m-4 p-2 text-center rounded-lg">
        <p class="text-black font-bold">Error!</p>
        <p class="text-black">Failed to Updated Beacon with ID: {currentBeacon.id}</p>
      </div>
      {/if}
    
    <ul class="w-full">
      {#each ble_beacons as beacon}
        <li class="text-center bg-gray-200 dark:bg-gray-600 p-2 rounded-lg border border-black dark:border-white mb-4">
          <div class="flex items-center justify-center mb-2">
            <p class="w-1/3 font-bold">ID:</p>
            <p class="w-2/3">{beacon.id}</p>
          </div>
          <div class="flex items-center justify-center mb-2">
            <p class="w-1/3 font-bold">Name:</p>
            <p class="w-2/3">{beacon.name}</p>
          </div>
          <div class="flex items-center justify-center mb-2">
            <p class="w-1/3 font-bold">Transmission Power:</p>
            <input type="number" class="input input-warning w-2/3" bind:value={beacon.txPower} />
          </div>
          <div class="flex w-full">
            <p class="w-1/3 font-bold">x</p>
            <p class="w-1/3 font-bold">y</p>
            <p class="w-1/3 font-bold">z</p>
          </div>
          <div class="flex w-full mb-2">
            <input type="number" class="input input-warning w-1/3" bind:value={beacon.x} />
            <input type="number" class="input input-warning w-1/3" bind:value={beacon.y} />
            <input type="number" class="input input-warning w-1/3" bind:value={beacon.z} />
          </div>
          <button class="btn btn-info border-warning w-full" on:click={() => {updateBeacon(beacon)}}>UPDATE</button>
        </li>
      {/each}
    </ul>
  </div>
</template>

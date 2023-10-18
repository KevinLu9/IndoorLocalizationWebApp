<script>
  import { api } from "../../api.js";
  import { beacons } from "../../store.js";
  import Editor from '@tinymce/tinymce-svelte';
  import { goto } from "@roxi/routify";
  import { isLoggedIn } from "../../store.js";
  import { get } from "svelte/store";

  // If not logged in
  let loggedIn = get(isLoggedIn);
  isLoggedIn.subscribe((val) => {
    loggedIn = val;
  })
  $: {
        if (!loggedIn) {
        $goto("/")
      }
    }

  let ble_beacons = [];
  let isLoading = false;
  let isSuccess = false;
  let isError = false;
  let currentBeacon;
  let topDiv;
  let customHTML = "Empty";
  let selectedBeaconForContentSave;
  let beaconContent = {};
  let isContentLoading = false;
  let isContentError = false;
  let selectedTab = "Beacons"

  const getBeaconContent = (beacon) => {
  isContentLoading = true;
  // console.log('getBeaconContent: ', beacon.id)
  api.get_beacon_content(beacon.id)
  .then((res) => {
    // console.log("getBeaconContent Res: ", res);
    if (!res.error) {
      beaconContent[beacon.id] = res?.data;
      customHTML = res?.data[0]?.content || "Empty"
    } else {
      isContentError = true;
    }
    isContentLoading = false;
  })
  } 

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
    api.update_beacon({id: beacon.id, name: beacon.name, txPower: beacon.txPower, x: beacon.x, y: beacon.y, z: beacon.z})
    .then((res) => {
      // console.log("updateBeacon: ", res);
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

  const updateBeaconContent = (beacon) => {
    console.log(beacon)
    currentBeacon = beacon;
    isLoading = true;
    console.log(beacon.id, customHTML)
    api.update_beacon_content(beacon.id, customHTML)
    .then((res) => {
      // console.log("updateBeaconContent: ", res);
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
    
  </div>
  <div class="w-full flex justify-center items-center p-2">
    <div class="btn btn-outline rounded-none {selectedTab == 'Beacons' ? ' bg-green-700 text-white' : ''}" on:click={() => {selectedTab="Beacons"}}>Beacons</div> 
    <div class="btn btn-outline rounded-none {selectedTab == 'Content' ? 'bg-green-700 text-white' : ''}" on:click={() => {selectedTab="Content"}}>Content</div> 
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
  </div>
  
  {#if selectedTab == 'Beacons'}
  <p class="text-center">Beacons with coordinates (0, 0, 0) will be ignored! The App should also be reloaded after changing these values.</p>
  <div class="w-full flex flex-col items-center justify-center p-4">
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
  {:else if selectedTab == 'Content'}
    <div class="w-full h-full px-4">
      <h1 class="font-bold text-2xl text-center my-2">Content Editor</h1>
      <h2 class="text-center mb-2">Change the content associated with each beacon.</h2>
      <div class="w-full flex justify-center mb-2">
        <select class="select select-warning max-w-xs w-full" bind:value={selectedBeaconForContentSave} on:change={() => { getBeaconContent(selectedBeaconForContentSave)}}>
          <option disabled selected value={undefined}>Select Beacon</option>
            {#each ble_beacons as beacon}
              <option value={beacon}>{beacon.id}</option>
            {/each}
        </select>
      </div>
      
      {#if isContentLoading}
        <div class="flex flex-col items-center justify-center w-full my-4">
          <span class="loading loading-spinner loading-lg mb-2"></span>
        </div>
      {:else if isContentError}
      <div class="w-full bg-error border border-black dark:border-white m-4 p-2 text-center rounded-lg">
        <p class="text-black font-bold">Error!</p>
        <p class="text-black">Failed to Updated Beacon with ID: {currentBeacon.id}</p>
      </div>
      {:else if !selectedBeaconForContentSave}
        <div class="flex flex-col items-center justify-center w-full my-2">
          <p>Select a Beacon...</p>
        </div>
      {:else if customHTML}
        <Editor
          class="w-full h-full"
          disabled={!selectedBeaconForContentSave}
          apiKey='0ow2pzndz0pfd60uq2ifx71mk5xs0m09ksr0a4ah68d244my'
          bind:value={customHTML}
        />

        <div class="flex flex-col w-full items-center justify-center">
          <div class="divider" />

          <p class="font-bold">HTML String</p>
          <div class="overflow-auto w-full h-full">
            <textarea bind:value={customHTML} class="w-full rounded-lg border border-black p-2" rows="15" />
          </div>
          
          <div class="divider" />
          <p class="font-bold text-center">Rendered HTML</p>
          <div class="m-4 p-4 w-full bg-200-600 rounded-lg border border-black no-tailwindcss-base">{@html customHTML}</div>
        </div>
        <div class="m-4 p-4 flex justify-end">
          <button class="btn btn-warning ml-2" on:click={() => {updateBeaconContent(selectedBeaconForContentSave)}}>Save</button>
        </div>
      {/if}
    </div>
  {/if}
</template>

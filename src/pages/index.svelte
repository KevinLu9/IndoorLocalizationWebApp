<script>
    import { metatags, url } from '@roxi/routify'
    import { kalmanDistance, beacons } from '../store';
    import { api } from '../api';
    import { onMount } from 'svelte';
    metatags.title = 'Indoor Localisation'
    metatags.description = 'Description coming soon...'

    let distances;
    let beaconsInRange;
    let beaconToShow = undefined;
    let isLoading = false;
    let isError = false;
    let topDiv;
    let beaconContent = {};

    const getBeaconContent = (beacon_id) => {
    isLoading = true;
    // console.log('getBeaconContent: ', beacon_id)
    api.get_beacon_content(beacon_id)
    .then((res) => {
    //   console.log("getBeaconContent Res: ", res);
      if (!res.error) {
        topDiv.focus();
        beaconContent[beacon_id] = res?.data[0]?.content;
      } else {
        isError = true;
      }
      isLoading = false;
    })
  } 

    $: {
        distances = Object.entries($kalmanDistance).map(([key, value]) => {
            return {id: key, distance: value[value.length - 1]};
        })

        beaconsInRange = distances.filter((beacon) =>  beacon.distance < 1).sort((a, b) => a.distance - b.distance)
        beaconToShow = (beaconsInRange.length > 0) ? beaconsInRange[0] : undefined;
        if (beaconToShow) {
            beaconToShow = $beacons.filter((beacon) => beacon.id == beaconToShow.id)[0]
            console.log(!beaconContent[beaconToShow.id])
            if (!beaconContent[beaconToShow.id] && !isLoading) {
                getBeaconContent(beaconToShow?.id);
                console.log({beaconContent})
            }
        }
        console.log(beaconToShow)
        
    }

    // onMount(() => {
    //     beaconToShow = {id:'01'}
    //     getBeaconContent(beaconToShow?.id)
    // })
    
</script>


<h1 bind:this={topDiv} class="font-bold text-center text-2xl my-2">Advertisements</h1>
{#if isLoading}
    <div class="flex flex-col items-center justify-center w-full my-4">
        <span class="loading loading-spinner loading-lg mb-2"></span>
    </div>
{:else if isError}
    <div class="w-full bg-error border border-black dark:border-white m-4 p-2 text-center rounded-lg">
        <p class="text-black font-bold">Error!</p>
        <p class="text-black">Failed to Fetch Content for Beacon with ID: {beaconToShow?.id}</p>
    </div>
{/if}
{#if beaconToShow}
    <p class="text-center">
        Project ID: {beaconToShow.id}
    </p>
    <div class="m-4 p-4 bg-200-600 rounded-lg border border-black no-tailwindcss-base">
        {@html beaconContent[beaconToShow.id]}
    </div>
{:else}
    <div class="m-4 p-4 bg-200-600 rounded-lg border border-black no-tailwindcss-base">
        <h3 class="text-center text-red-600">There are no nearby advertisements!</h3>
    </div>
{/if}
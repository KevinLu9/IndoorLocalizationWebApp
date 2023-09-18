<script>
    import { metatags, url } from '@roxi/routify'
    import { kalmanDistance, beacons } from '../store';
    metatags.title = 'Indoor Localisation'
    metatags.description = 'Description coming soon...'

    let distances;
    let beaconsInRange;
    let beaconToShow = undefined;
    $: {
        distances = Object.entries($kalmanDistance).map(([key, value]) => {
            return {id: key, distance: value[value.length - 1]};
        })

        beaconsInRange = distances.filter((beacon) =>  beacon.distance < 1).sort((a, b) => a.distance - b.distance)
        beaconToShow = (beaconsInRange.length > 0) ? beaconsInRange[0] : undefined;
        if (beaconToShow) {
            beaconToShow = $beacons.filter((beacon) => beacon.id == beaconToShow.id)[0]
        }
        // console.log(beaconToShow)
    }
    
</script>


<h1 class="font-bold text-center text-2xl">Projects Nearby</h1>
{#if beaconToShow}
    <p class="text-center">
        Project ID: {beaconToShow.id}
    </p>
    <div class="m-4 p-4 bg-200-600 rounded-lg border border-black no-tailwindcss-base">
        {@html beaconToShow.content}
    </div>
{:else}
    <div class="m-4 p-4 bg-200-600 rounded-lg border border-black no-tailwindcss-base">
        <h3 class="text-center text-red-600">You are not near any displays!</h3>
    </div>
{/if}
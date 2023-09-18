<script>
    import { metatags, url } from '@roxi/routify'
    import { kalmanDistance } from '../store';
    metatags.title = 'Indoor Localisation'
    metatags.description = 'Description coming soon...'

    let distances;
    let beaconsInRange;
    let pageToShow = undefined;
    $: {
        distances = Object.entries($kalmanDistance).map(([key, value]) => {
            return {id: key, distance: value[value.length - 1]};
        })

        beaconsInRange = distances.filter((beacon) =>  beacon.distance < 1).sort((a, b) => a.distance - b.distance)
        pageToShow = (beaconsInRange.length > 0) ? beaconsInRange[0].id : undefined;
        console.log()
    }
    
</script>


<h1 class="font-bold">Home Page</h1>
{#if pageToShow}
    <h2>{pageToShow}</h2>
{:else}
    <h2>You are not near any displays!</h2>
{/if}
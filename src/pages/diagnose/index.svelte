<script>
  import Chart from "chart.js/auto";
  import { onMount } from "svelte";
  import {
    location,
    previousLocations,
    updateLocation,
    distance,
    kalmanDistance,
    distanceLabels,
    distanceWorker, 
    beacons,
  } from "../../store.js";

  // Location View Chart

  // Chart Plugin for image background
  const image = new Image();
  image.src = "/images/building_test.jpg";

  const plugin = {
    // id: "customCanvasBackgroundImage",
    // beforeDraw: (chart) => {
    //   if (image.complete) {
    //     const ctx = chart.ctx;
    //     const { top, left, width, height } = chart.chartArea;
    //     // const x = left + width / 2 - image.width / 2;
    //     // const y = top + height / 2 - image.height / 2;
    //     ctx.drawImage(image, left, top, width, height);
    //   } else {
    //     image.onload = () => chart.draw();
    //   }
    // },
  };
  // Setup Location Chart

  let chartLoc;
  let locationChart;
  onMount(() => {
    const data = {
      datasets: [
        {
          label: "User Live Location",
          data: [],
          backgroundColor: "rgb(255, 0, 0)",
        },
        {
          label: "User Past Locations",
          data: [],
          backgroundColor: "rgb(0, 255, 0)",
        },
        {
          label: "Beacon Locations",
          data: [],
          backgroundColor: "rgba(0, 0, 255, 0.5)",
        },
      ],
    };

    const config = {
      type: "scatter",
      data: data,
      plugins: [plugin],
      options: {
        aspectRatio: 1,
        animations: true,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            type: "linear",
            position: "bottom",
            suggestedMin: -2,
            suggestedMax: 3,
            ticks: {
              stepSize: 1,
            },
          },
          y: {
            type: "linear",
            position: "left",
            suggestedMin: -2,
            suggestedMax: 3,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    };

    chartLoc = new Chart(locationChart, config);
    location.subscribe((value) => {
      // console.log(chartLoc)
      if (!chartLoc || !data) {
        return;
      }
      data.datasets[0].data.shift();
      data.datasets[1].data.push($previousLocations[$previousLocations.length - 1]);
      data.datasets[0].data.push($location);
      data.datasets[1].data = data.datasets[1].data;
      chartLoc?.update();
    })

    beacons.subscribe((value) => {
      data.datasets[2].data = value.map((beacon) => {return {x: beacon.x, y: beacon.y}})
      chartLoc.update()
    })
  }); 

  // Setup Charts for kalman distances
  class BeaconChart {
    constructor(id, chartWidth = 10) {
      this.chartDiv = undefined;
      this.CHARTWIDTH = chartWidth;
      this.distanceData = [0];
      this.kalmanDistanceData = [0];
      this.labels = [0];
      this.latestDistance = 0;
      this.latestKalmanDistance = 0;
      this.id = `${id}-CHART}`;
      this.config = {
        type: "line",
        data: {
          labels: this.labels,
          datasets: [
            {
              label: "Distance",
              data: this.distanceData,
              fill: true,
              borderColor: "rgb(0, 0, 255)",
              tension: 0.1,
            },
            {
              label: "Distance with Kalman Filter",
              data: this.kalmanDistanceData,
              fill: true,
              borderColor: "rgb(0, 255, 0)",
              tension: 0.1,
            },
          ],
          options: {
            animation: false,
            scales: {
              x: {
                type: "linear",
                position: "bottom",
                // suggestedMin: 0,
                ticks: {
                  stepSize: 1,
                },
              },
              y: {
                type: "linear",
                position: "left",
                suggestedMin: 0,
                ticks: {
                  stepSize: 1,
                },
              },
            },
          },
        },
      };
      this.chart = undefined;
    }
    createChart() {
      this.chartDiv = document.getElementById(this.id);
      if (!this.chart && this.chartDiv) {
        this.chart = new Chart(this.chartDiv, this.config);
        // console.log(`CREATED CHART for ${this.id}`);
      }
    }
    addData(label, dist, kalman_dist) {
      if (!this.chart) {
        this.createChart();
      }
      if (this.distanceData.length > this.CHARTWIDTH) {
        this.distanceData.shift();
      }
      this.distanceData.push(dist);

      if (this.kalmanDistanceData.length > this.CHARTWIDTH) {
        this.kalmanDistanceData.shift();
      }
      this.kalmanDistanceData.push(kalman_dist);

      if (this.labels.length > this.CHARTWIDTH) {
        this.labels.shift();
      }
      this.labels.push(label);

      this.latestDistance = dist;
      this.latestKalmanDistance = kalman_dist;
      this.chart?.update();
      charts=charts;
    }
  }

  let charts = {};
  $beacons.forEach((beacon) => {
    charts[beacon.id] = new BeaconChart(beacon.id);
  })

  beacons.subscribe((value) => {
    value.forEach((beacon) => {
      if (!charts[beacon.id]) {
        charts[beacon.id] = new BeaconChart(beacon.id);
      }

    })
  })
  
  distanceLabels.subscribe((value) => {
    // console.log('distanceLabels updated: ', value)
    Object.entries(value).forEach(([id, labels]) => {
      if (charts[id]?.labels?.length == labels.length) {
        return
      }
      charts[id].addData(labels[labels.length - 1], $distance[id][$distance[id].length - 1], $kalmanDistance[id][$kalmanDistance[id].length - 1]);
    })
  })

</script>

<div>
  <div class="w-full aspect-square p-4">
    <canvas class="aspect-square bg-gray-400 outline outline-black" bind:this={locationChart} />
  </div>
  <div class="font-bold w-full text-center">
    Location Coordinatates: 
    {#if $location}
      ({$location?.x?.toFixed(2)}, {$location?.y?.toFixed(2)})
    {/if}
  </div>
  {#each Object.entries(charts) as [id, beaconChart]}
    <div class="w-full h-fit p-4">
      <p class="font-bold w-full text-center">Beacon ID: {id}</p>
      <p class="w-full text-center">
        Raw: {beaconChart.latestDistance.toFixed(2)} m, Kalman: {beaconChart.latestKalmanDistance.toFixed(
          2
        )} m
      </p>
      <canvas class="" id={beaconChart.id} />
    </div>
  {/each}
</div>

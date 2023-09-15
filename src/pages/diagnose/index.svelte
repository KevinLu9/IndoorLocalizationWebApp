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
    beacons
  } from "../../store.js";
  import { distanceWorker } from "../../store.js";

  // Location View Chart

  // Chart Plugin for image background
  const image = new Image();
  image.src = "/images/building_test.jpg";

  const plugin = {
    id: "customCanvasBackgroundImage",
    beforeDraw: (chart) => {
      if (image.complete) {
        const ctx = chart.ctx;
        const { top, left, width, height } = chart.chartArea;
        // const x = left + width / 2 - image.width / 2;
        // const y = top + height / 2 - image.height / 2;
        ctx.drawImage(image, left, top, width, height);
      } else {
        image.onload = () => chart.draw();
      }
    },
  };
  // Setup Location Chart

  let chartLoc;
  let locationChart;
  onMount(() => {
    const data = {
      datasets: [
        {
          label: "User Live Location",
          data: [
            {
              x: $location.x,
              y: $location.y,
            },
          ],
          backgroundColor: "rgb(255, 0, 0)",
        },
        {
          label: "User Past Locations",
          data: $previousLocations,
          backgroundColor: "rgb(0, 255, 0)",
        },
        {
          label: "Beacon Locations",
          data: [],
          backgroundColor: "rgb(0, 0, 255)",
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
        scales: {
          x: {
            type: "linear",
            position: "bottom",
            suggestedMin: 0,
            suggestedMax: 10,
            ticks: {
              stepSize: 1,
            },
          },
          y: {
            type: "linear",
            position: "left",
            suggestedMin: 0,
            suggestedMax: 10,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    };
    chartLoc = new Chart(locationChart, config);
    beacons.subscribe((value) => {
      data.datasets[2].data = value.map((beacon) => {return {x: beacon.x, y: beacon.y}})
      chartLoc.update()
    })
  });

  

  // Setup Charts for kalman distances
  let charts;
  $: {
    charts = {};
  }

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
    addData(dist, kalman_dist) {
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
      this.labels.push(this.labels[this.labels.length - 1] + 1);

      this.latestDistance = dist;
      this.latestKalmanDistance = kalman_dist;
      this.chart?.update();
      charts=charts;
    }
  }
  distanceWorker.onmessage = (e) => {
    // console.log("[BLUETOOTH FROM DISTANCE WORKER]", e.data);

    if (!charts[e.data.id]) {
      charts[e.data.id] = new BeaconChart(e.data.id);
    }
    distance.update((items) => {
      // console.log(e.data.distance);
      items.push(e.data.distance);
      return items;
    });
    kalmanDistance.update((items) => {
      items.push(e.data.kalman_distance);
      return items;
    });
    distanceLabels.update((items) => {
      items.push(items.length);
      return items;
    });
    const CHARTWIDTH = 20;
    charts[e.data.id].addData(e.data.distance, e.data.kalman_distance);

    if (chartLoc) {
      chartLoc.update();
    }
  };
</script>

<div>
  <div class="w-full aspect-square p-4">
    <canvas class="aspect-square" bind:this={locationChart} />
  </div>
  <div class="font-bold w-full text-center">
    Location Coordinatates: ({$location.x}, {$location.y})
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

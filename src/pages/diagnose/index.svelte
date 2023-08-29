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
  } from "../../store.js";
  import { distanceWorker } from "../../store.js";

  //   distanceWorker.onmessage = (e) => {
  //   console.log(`[BLUETOOTH FROM DISTANCE WORKER] ${e.data}`);
  // };

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
  });

  // Setup Distance Chart
  let distanceChart;
  let chartDist;
  onMount(() => {
    const dataDist = {
      labels: labels,
      datasets: [
        {
          label: "Distance",
          data: distanceData,
          fill: true,
          borderColor: "rgb(0, 0, 255)",
          tension: 0.1,
        },
        {
          label: "Distance with Kalman Filter",
          data: kalmanDistanceData,
          fill: true,
          borderColor: "rgb(0, 255, 0)",
          tension: 0.1,
        },
      ],
      // datasets: [
      //   {
      //     label: "Distance",
      //     data: $distance,
      //     backgroundColor: "rgb(255, 0, 0)",
      //   },
      //   {
      //     label: "Distance with Kalman Filter",
      //     data: $kalmanDistance,
      //     backgroundColor: "rgb(0, 255, 0)",
      //   },
      // ],
    };

    const configDist = {
      type: "line",
      data: dataDist,
      options: {
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
    };
    chartDist = new Chart(distanceChart, configDist);
    // console.log("dist", $distance);
  });

  const distanceData = [];
  const kalmanDistanceData = [];
  const labels = [];
  distanceWorker.onmessage = (e) => {
    console.log("[BLUETOOTH FROM DISTANCE WORKER]", e.data);
    
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

    if ($distance.length > 10) {
      distanceData.shift(); 
    } 
    distanceData.push(e.data.distance);
    kalmanDistanceData.push(e.data.distance);
    if ($distance.length > 10) {
      kalmanDistanceData.shift(); 
    } 
    kalmanDistanceData.push(e.data.kalman_distance);
    if ($distanceLabels.length > 10) {
      labels.shift(); 
    } 
    labels.push($distanceLabels.length);

    // kalmanDistanceData.splice(0, kalmanDistanceData.length)
    // kalmanDistanceData.concat(($kalmanDistance.length > 10) ? $kalmanDistance.slice($kalmanDistance.length-10, $kalmanDistance.length) : $kalmanDistance);
    // labels.splice(0, labels.length)
    // labels.concat(($distanceLabels.length > 10) ? $distanceLabels.slice($distanceLabels.length-10, $distanceLabels.length) : $distanceLabels);
    console.log(distanceData, labels)
    if (chartLoc) {
      chartLoc.update();
    }
    if (chartDist) {
      chartDist.update();
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
  <div class="w-full aspect-square p-4">
    <canvas class="" bind:this={distanceChart} />
  </div>
</div>

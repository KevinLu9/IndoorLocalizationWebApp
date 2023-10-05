import { writable } from "svelte/store";
export const location = writable({ x: 0, y: 0 });
export const previousLocations = writable([]);

export const updateLocation = (loc) => {
  previousLocations.update((items) => {
    items.push(loc);
    return items;
  });
  location.set(loc);
};


export const distance = writable({});
export const kalmanDistance = writable({});
export const distanceLabels = writable({});
export const beacons = writable([]);
export const distanceWorker = new Worker("workers/distance.js");
export const positionWorker = new Worker("workers/position.js");

const testData = []; // Keep track of all points
const initialTime = new Date().getTime() / 1000;
const timeLastCalculatedLocation = new Date().getTime()

export const printTestData = () => {
  console.log("Test Data: ", JSON.stringify(testData));
}

positionWorker.onmessage = (e) => {
  // console.log('[PositionWorker Result]', e.data);
  // testData.push(e.data);
  updateLocation({ x: e.data.x, y: e.data.y })

}

// Handle new distances from Distance Worker.
distanceWorker.onmessage = (e) => {
  // console.log("[BLUETOOTH FROM STORE]", e.data);
  testData.push(e.data.distanceVals);
  distance.update((value) => {
    if (!value[e.data.id]) {
      value[e.data.id] = [];
    }
    value[e.data.id].push(e.data.distance);
    return value
  })

  kalmanDistance.update((value) => {
    if (!value[e.data.id]) {
      value[e.data.id] = [];
    }
    value[e.data.id].push(e.data.kalman_distance);
    return value
  })

  distanceLabels.update((value) => {
    if (!value[e.data.id]) {
      value[e.data.id] = [];
    }
    value[e.data.id].push((e.data.time - initialTime).toFixed(1));
    return value
  })

  // Only post if it has been at least one second since the last calculation
  if (new Date().getTime() - timeLastCalculatedLocation > 500) {
    if (e.data.distanceVals) {
      positionWorker.postMessage(e.data.distanceVals);
    }
  }

}


function createNewBeacon(id, txPower, x, y, z) {
  distanceWorker.postMessage({
    command: "device",
    values: {
      id: manufacturerID,
      txPower: txPower,
      x: x,
      y: y,
      z: z,
    },
  });
}

function sendDataToDistanceWorker(id, time, rssi) {
  distanceWorker.postMessage({
    command: "rssi",
    values: { id, time, rssi },
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

import data from './testData5.json';

export async function runSimulation() {
  // beacons: [{id, txPower, x, y, z}, ...]
  // data: [{id, time, rssi}, ...]
  // beacons.forEach((beacon) => {
  //   createNewBeacon(beacon?.id, beacon?.txPower, beacon?.x, beacon?.y, beacon?.z);
  // })
  
  for(let point of data) {
    // console.log({point});
    for(let beacon of point) {
      sendDataToDistanceWorker(beacon?.id, beacon?.time, beacon?.rssi);
    }
    await sleep(250);
  }
}
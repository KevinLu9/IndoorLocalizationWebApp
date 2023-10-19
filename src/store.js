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
export const globalLoadingMessage = writable("");
export const isGlobalLoading = writable(true);
export const isLoggedIn = writable(false);

const testData = []; // Keep track of all points
const initialTime = new Date().getTime() / 1000;
let timeLastCalculatedLocation = new Date().getTime()

positionWorker.onmessage = (e) => {
  // console.log('[PositionWorker Result]', e.data);
  testData.push(e.data);
  updateLocation({ x: e.data.x, y: e.data.y })

}

// Handle new distances from Distance Worker.
distanceWorker.onmessage = (e) => {
  // console.log("[BLUETOOTH FROM STORE]", e.data);
  // if (e.data.distanceVals) {
  //   testData.push(e.data.distanceVals);
  // }
  if (e.data.is_print) {
    navigator.clipboard.writeText(e.data.vals);
    console.log(e.data.vals);
    return
  }
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
  if (e.data.distanceVals) {
    positionWorker.postMessage(e.data.distanceVals);
  }
  // if (new Date().getTime() - timeLastCalculatedLocation > 250) {
  //   if (e.data.distanceVals) {
  //     positionWorker.postMessage(e.data.distanceVals);
  //   }
  // }

}


// Setting user's ID to keep track of their device (randomly generated not linked to the device in anyway).
if (!localStorage.getItem("ID")) {
  function generateUUID() { // Public Domain/MIT
    var d = new Date().getTime();//Timestamp
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if(d > 0){//Use timestamp until depleted
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}
// Put ID into localStorage
  localStorage.setItem("ID", generateUUID())
}



// Testing/Simulation Functions
export const printTestData = () => {
  const stringData = JSON.stringify(testData);
  navigator.clipboard.writeText(stringData);
  console.log("Test Data: ", stringData);
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

// import data from './testData5.json';
export const testString = writable("");
let dataString = "";
testString.subscribe((value) => {
  dataString = value;
})
export async function runSimulation() {
  // beacons: [{id, txPower, x, y, z}, ...]
  // data: [{id, time, rssi}, ...]
  // beacons.forEach((beacon) => {
  //   createNewBeacon(beacon?.id, beacon?.txPower, beacon?.x, beacon?.y, beacon?.z);
  // })
  const data = JSON.parse(dataString);
  console.log({ data })

  for (let point of data) {
    // console.log({point});
    for (let beacon of point['distanceVals']) {
      sendDataToDistanceWorker(beacon?.id, beacon?.time, beacon?.rssi);
    }
    await sleep(250);
  }
}
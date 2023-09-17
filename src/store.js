import { writable } from "svelte/store";

export const location = writable({ x: 0, y: 0 });
export const previousLocations = writable([]);
export const updateLocation = (location) => {
  previousLocations.update((items) => {
    items.push(location);
    return items;
  });
  location.set(location);
};
export const distance = writable({});
export const kalmanDistance = writable({});
export const distanceLabels = writable({});
export const beacons = writable([]);
export const distanceWorker = new Worker("workers/distance.js");
export const positionWorker = new Worker("workers/position.js")

const initialTime = new Date().getTime() / 1000;


// Handle new distances from Distance Worker.
distanceWorker.onmessage = (e) => {
  // console.log("[BLUETOOTH FROM STORE]", e.data);
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
  
}
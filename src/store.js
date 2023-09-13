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
export const distance = writable([]);
export const kalmanDistance = writable([]);
export const distanceLabels = writable([]);

export const beacons = writable([]);

export const distanceWorker = new Worker("workers/distance.js");
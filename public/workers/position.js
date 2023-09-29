importScripts('tf.js')
importScripts('math.js')
importScripts('kalman.js');
// importScripts('kalman-filter.js')
// var {KalmanFilter} = kalmanFilter;
// const kFilter = new KalmanFilter();
// if (typeof Worker == "undefined") {
//   throw new Error("Device does not support Web Workers!");
// }

// Trilateration 3D and 2D implementation START ---------------------------------------------------------------------------------------
// // Kalman filter
// let previousCorrected_X = kFilter.getInitState();
// let previousCorrected_Y = kFilter.getInitState();
// let predicted_X;
// let predicted_Y;

// onmessage = ({data}) => {
//   // Assume 4 beacons are given
//   const x = [];
//   const y = [];
//   const z = [];
//   const d = [];
//   data.forEach((item, index) => {
//     x.push(item.x);
//     y.push(item.y);
//     z.push(item.z);
//     d.push(item.kalmanDistance);
//   })
// -------------------------------------------------------------------
//   // 3D IMPLEMENTATION
//   // const G = [
//   //   [x[1] - x[0], y[1] - y[0]],
//   //   [x[2] - x[0], y[2] - y[0]], 

//   // ]
//   // const h = [
//   //   [0.5 * (x[1]**2 - x[0]**2 + y[1]**2 - y[0]**2 - d[1]**2 + d[0]**2)],
//   //   [0.5 * (x[2]**2 - x[0]**2  + y[2]**2 - y[0]**2 - d[2]**2 + d[0]**2)]
//   // ]

//   // let p_x;
//   // let p_y;
//   // let p_z;

//   // [p_x, p_y, p_z] = math.transpose(math.multiply(math.pinv(G), h))[0];
// -------------------------------------------------------------------
//   // 2D IMPLEMENTATION
//   const A = -2*x[0] + 2*x[1];
//   const B = -2*y[0] + 2*y[1];
//   const C = d[0]**2 - d[1]**2 - x[0]**2 + x[1]**2 - y[0]**2 + y[1]**2;
//   const D = -2*x[1] + 2*x[2];
//   const E = -2*y[1] + 2*y[2];
//   const F = d[1]**2 - d[2]**2 - x[1]**2 + x[2]**2 - y[1]**2 + y[2]**2;

//   let p_x = (C*E - B*F) / (A*E - B*D);
//   let p_y = (A*F - C*D) / (A*E - B*D);
//   let p_z = 0;


//   // Apply kalman filter on locations
//   predicted_X = kFilter.predict({previousCorrected: previousCorrected_X});
//   previousCorrected_X = kFilter.correct({
//       predicted: predicted_X,
//       observation: [p_x],
//     });
//   p_x = previousCorrected_X.mean.map(m => m[0])[0];

//   predicted_Y = kFilter.predict({previousCorrected: previousCorrected_Y});
//   previousCorrected_Y = kFilter.correct({
//       predicted: predicted_Y,
//       observation: [p_y],
//     });
//   p_y = previousCorrected_Y.mean.map(m => m[0])[0];

//   previousPredictedLocation = {x: p_x, y: p_y};

//   postMessage({x: p_x, y: p_y, z: p_z});
// }
// Trilateration 3D and 2D implementation END ---------------------------------------------------------------------------------------

// ML using Linear Regression START --------------------------------------------------------------------------------------------------
const dF = (point, estimate) => {
  // Calculates the derivative of the loss function to be minimised
  // point: location of beacon as [x_i, y_i]
  // estimate: estimate of location as [x_e, y_e]
  [x_i, y_i] = point;
  [x_e, y_e] = estimate;
  // console.log({point, estimate})
  return [(x_i - x_e) / ((x_i - x_e) ** 2 + (y_i - y_e) ** 2) ** 0.5, (y_i - y_e) / ((x_i - x_e) ** 2 + (y_i - y_e) ** 2) ** 0.5];
}

const RMSE = (d, point, estimate) => {
  // Calculates the Root Mean Square Error of the distances
  // d: distance to beacon
  // point: location of beacon as [x_i, y_i]
  // estimate: estimate of location as [x_e, y_e]
  [x_i, y_i] = point;
  [x_e, y_e] = estimate;
  // console.log({d, point, estimate})
  return d - ((x_i - x_e) ** 2 + (y_i - y_e) ** 2) ** 0.5;
}

const w_new = (X, y) => {
  // Closed form solution for multivariate linear regression
  // w* = (X' X)^(-1) X' y
  const X_T = math.transpose(X);
  const res = math.multiply(math.multiply(math.pinv(math.multiply(X_T, X)), X_T), y);
  return res
}
// kalman = new KalmanFilter(0.5, 0.7, 0.4); // 0.5, 0.5, 0.05
let previousPredictedLocation = undefined;
const EPOCH = 50; //50;
const learning_rate = 0.5; //0.1;
const kalmanX = new KalmanFilter(0.5, 0.8, 0.2);
const kalmanY = new KalmanFilter(0.5, 0.8, 0.2);
onmessage = ({ data }) => {
  const inputs = data.map((item) => [item.x, item.y])
  const labels = data.map((item) => [item.kalmanDistance])
  const initial_position = math.mean([math.max(inputs, 0), math.min(inputs, 0)], 0); // start at the mean of all beacons
  // const initial_position = inputs[0]; // start at the closest beacon
  let x_e = initial_position[0];
  let y_e = initial_position[1];
  // let x_e = math.random(3); //2;
  // let y_e = math.random(3); //2;
  // console.log("initial estimate: ", {x_e, y_e})
  if (previousPredictedLocation) {
    x_e = previousPredictedLocation.x;
    y_e = previousPredictedLocation.y;
  }
  let B;
  let f;
  let dx;
  let dy;
  let new_weights;
  let estimates = [];
  let error;
  let previousError = 100000;
  let final_x = x_e;
  let final_y = y_e;
  const error_arr = [];

  for (let i = 0; i < EPOCH; i++) {
    B = data.map((item) => {
      // console.log('[dF] ', dF([item.x, item.y], [x_e, y_e]))
      return dF([item.x, item.y], [x_e, y_e]);
    });
    f = data.map((item, index) => {
      // console.log('[RMSE] ', -1 * RMSE(labels[index], [item.x, item.y], [x_e, y_e]))
      return RMSE(labels[index], [item.x, item.y], [x_e, y_e])
    });
    // console.log('[B] Shape: ', B.shape);
    // console.log('[f] Shape: ', f.shape);
    // w_new(B, f).print()
    new_weights = w_new(B, f);
    dx = new_weights[0];
    dy = new_weights[1];
    error = Math.abs(math.mean(f));
    // console.log('[Iteration ', i,  ']', 'Delta: ', {dx, dy}, 'Error: ', error)
    error_arr.push(error)
    estimates.push({ x: x_e, y: y_e, error: error })
    x_e = x_e - learning_rate * dx;
    y_e = y_e - learning_rate * dy;
    // Keep track of location with smallest error
    if (error < previousError) {
      previousError = error;
      final_x = x_e;
      final_y = y_e;
    }
    else {
      // Break out of epoch early if overshoot on error (for performance)
      break;
    }

    // // If error is low enough
    // if (Math.abs(math.sum(f)) < 0.05) {
    //   break;
    // }
  }
  // previousPredictedLocation = {x: x_e, y: y_e};
  // console.log({estimates})
  // console.log({x_e, y_e})
  // console.log({x: final_x, y: final_y, error: previousError})
  // console.log(error_arr.toString())
  final_x = kalmanX.calculateKalman(final_x);
  final_y = kalmanY.calculateKalman(final_y);
  previousPredictedLocation = { x: final_x, y: final_y, error: previousError };
  postMessage({ x: final_x, y: final_y, error: previousError });
};

// ML using Linear Regression END --------------------------------------------------------------------------------------------------

// ML using Linear Regression Using MathJS Hardcoded Example START ------------------------------------------------------------------------------
// // data = [{'time', 'rssi', 'distance', 'kalmanDistance', x, y, z, id}, ...]
// // data = [{kalmanDistance: 0, x: 3, y: 3, z: 0}, {kalmanDistance: 3, x: 0, y: 3, z: 0}, {kalmanDistance: 3, x: 3, y: 0, z: 0}] // 3, 3
// // data = [{kalmanDistance: 4.2426, x: 3, y: 3, z: 0}, {kalmanDistance: 3, x: 0, y: 3, z: 0}, {kalmanDistance: 3, x: 3, y: 0, z: 0}] // 0,0
// // data = [{kalmanDistance: 2.1213, x: 3, y: 3, z: 0}, {kalmanDistance: 2.1213, x: 0, y: 3, z: 0}, {kalmanDistance: 2.1213, x: 3, y: 0, z: 0}] // 1.5, 1.5
// // data = [{kalmanDistance: 2.8284, x: 3, y: 3, z: 0}, {kalmanDistance: 2.2361, x: 0, y: 3, z: 0}, {kalmanDistance: 2.2361, x: 3, y: 0, z: 0}] // 1, 1
// // data = [{kalmanDistance: 1.4142, x: 3, y: 3, z: 0}, {kalmanDistance: 2.2361, x: 0, y: 3, z: 0}, {kalmanDistance: 2.2361, x: 3, y: 0, z: 0}] // 2, 2
// data = [{kalmanDistance: 1.8028, x: 3, y: 3, z: 0}, {kalmanDistance: 4.272, x: 0, y: 3, z: 0}, {kalmanDistance: 1.8028, x: 3, y: 0, z: 0}] // 4, 1.5

// const dF = (point, estimate) => {
//   // Calculates the derivative of the loss function to be minimised
//   // point: location of beacon as [x_i, y_i]
//   // estimate: estimate of location as [x_e, y_e]
//   [x_i, y_i] = point;
//   [x_e, y_e] = estimate;
//   // console.log({point, estimate})
//   return [(x_i - x_e) / ((x_i - x_e)**2 + (y_i - y_e)**2)**0.5,  (y_i - y_e) / ((x_i - x_e)**2 + (y_i - y_e)**2)**0.5];
// }

// const RMSE = (d, point, estimate) => {
//   // Calculates the Root Mean Square Error of the distances
//   // d: distance to beacon
//   // point: location of beacon as [x_i, y_i]
//   // estimate: estimate of location as [x_e, y_e]
//   [x_i, y_i] = point;
//   [x_e, y_e] = estimate;
//   // console.log({d, point, estimate})
//   return d - ((x_i - x_e)**2 + (y_i - y_e)**2)**0.5;
// }

// const w_new = (X, y) => {
//   // Closed form solution for multivariate linear regression
//   // w* = (X' X)^(-1) X' y
//   const X_T = math.transpose(X);
//   const res = math.multiply(math.multiply(math.pinv(math.multiply(X_T, X)), X_T), y);
//   return res
// }

//   let previousPredictedLocation = undefined;
//   const EPOCH = 50;
//   const learning_rate = 0.1;
//   const inputs = data.map((item) => [item.x, item.y])
//   const labels = data.map((item) => [item.kalmanDistance])
//   let x_e = 2;
//   let y_e = 2;
//   // let x_e = math.random(3); //2;
//   // let y_e = math.random(3); //2;
//   // console.log("initial estimate: ", {x_e, y_e})
//   if (previousPredictedLocation) {
//     x_e = previousPredictedLocation.x;
//     y_e = previousPredictedLocation.y;
//   }
//   let B;
//   let f;
//   let dx;
//   let dy;
//   let new_weights;
//   let estimates = [];
//   let error;
//   let previousError = 100000;
//   let final_x = x_e;
//   let final_y = y_e;
//   const error_arr = [];

//   for (let i = 0; i < EPOCH; i++) {
//     B = data.map((item) => {
//       // console.log('[dF] ', dF([item.x, item.y], [x_e, y_e]))
//       return dF([item.x, item.y], [x_e, y_e]);
//     });
//     f = data.map((item, index) => {
//       // console.log('[RMSE] ', -1 * RMSE(labels[index], [item.x, item.y], [x_e, y_e]))
//       return RMSE(labels[index], [item.x, item.y], [x_e, y_e])
//     });
//     // console.log('[B] Shape: ', B.shape);
//     // console.log('[f] Shape: ', f.shape);
//     // w_new(B, f).print()
//     new_weights = w_new(B, f);
//     dx = new_weights[0];
//     dy = new_weights[1];
//     error = Math.abs(math.mean(f));
//     // console.log('[Iteration ', i,  ']', 'Delta: ', {dx, dy}, 'Error: ', error)
//     error_arr.push(error)
//     estimates.push({x: x_e, y: y_e, error: error})
//     x_e = x_e - learning_rate*dx;
//     y_e = y_e - learning_rate*dy;
//     // Keep track of location with smallest error
//     if (error < previousError) {
//       previousError = error;
//       final_x = x_e;
//       final_y = y_e;
//     }
//     else {
//       // Break out of epoch early if overshoot on error (for performance)
//       break;
//     }

//     // // If error is low enough
//     // if (Math.abs(math.sum(f)) < 0.05) {
//     //   break;
//     // }
//   }
//   previousPredictedLocation = {x: x_e, y: y_e};
//   console.log({estimates})
//   console.log({x_e, y_e})
//   console.log({x: final_x, y: final_y, error: previousError})
//   console.log(error_arr.toString())


// ML using Linear Regression Using MathJS Hardcoded Example END ------------------------------------------------------------------------------

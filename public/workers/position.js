importScripts('tf.js')
importScripts('math.js')
importScripts('kalman-filter.js')
var {KalmanFilter} = kalmanFilter;
const kFilter = new KalmanFilter();
if (typeof Worker == "undefined") {
  throw new Error("Device does not support Web Workers!");
}

// // Kalman filter
let previousCorrected_X = kFilter.getInitState();
let previousCorrected_Y = kFilter.getInitState();
let predicted_X;
let predicted_Y;

onmessage = ({data}) => {
  // Assume 4 beacons are given
  const x = [];
  const y = [];
  const z = [];
  const d = [];
  data.forEach((item, index) => {
    x.push(item.x);
    y.push(item.y);
    z.push(item.z);
    d.push(item.kalmanDistance);
  })

  const G = [
    [x[1] - x[0], y[1] - y[0], z[1] - z[0]],
    [x[3] - x[0], y[2] - y[0], z[2] - z[0]], 
    [x[2] - x[0], y[3] - y[0], z[3] - z[0]]
  ]
  const h = [
    [0.5 * (x[1]**2 + y[1]**2 + z[1]**2 - x[0]**2 - y[0]**2 - d[1]**2 + d[0]**2)], 
    [0.5 * (x[2]**2 + y[2]**2 + z[2]**2 - x[0]**2 - y[0]**2 - d[2]**2 + d[0]**2)], 
    [0.5 * (x[3]**2 + y[3]**2 + z[3]**2 - x[0]**2 - y[0]**2 - d[3]**2 + d[0]**2)]
  ]
  let p_x;
  let p_y;
  let p_z;

  [p_x, p_y, p_z] = math.transpose(math.multiply(math.pinv(G), h))[0];

  // Apply kalman filter on locations
  predicted_X = kFilter.predict({previousCorrected: previousCorrected_X});
  previousCorrected_X = kFilter.correct({
      predicted: predicted_X,
      observation: [p_x],
    });
  p_x = previousCorrected_X.mean.map(m => m[0])[0];

  predicted_Y = kFilter.predict({previousCorrected: previousCorrected_Y});
  previousCorrected_Y = kFilter.correct({
      predicted: predicted_Y,
      observation: [p_y],
    });
  p_y = previousCorrected_Y.mean.map(m => m[0])[0];

  previousPredictedLocation = {x: p_x, y: p_y};

  postMessage({x: p_x, y: p_y, z: p_z});
}


// onmessage = ({data}) => {
//   // console.log({data})
//   const inputs = tf.tensor2d(data.map((item) => [item.x, item.y]))
//   const labels = tf.tensor2d(data.map((item) => [item.kalmanDistance]))
//   // inputs.print()
//   // labels.print()
//   const model = tf.sequential();
//   model.add(tf.layers.dense({units: 1, inputShape: [2]}));
//   model.compile({loss: 'meanSquaredError', optimizer: 'sgd'});
//   model.fit(inputs, labels, {epochs: 100}).then(() => {

//     const w = model.getWeights()[0].arraySync();
//     const b = model.getWeights()[1].arraySync()[0];
//     const predictions = data.map((item) => model.predict(tf.tensor2d([item.x, item.y])).dataSync());
//     predictions.split()
    
//     console.log('[POSITION]: ', {x: w[0][0], y: w[1][0], b: b});
//     const x = w[0][0] > 0 ? w[0][0]**0.5 + b : -1 * Math.abs(w[0][0])**0.5 + b;
//     const y = w[1][0] > 0 ? w[1][0]**0.5 + b : -1 * Math.abs(w[1][0])**0.5 + b;

//     postMessage({x: y, y: x});
//   });
//   // postMessage({x: 0, y: 0, b});
// };

// --------------------------------------------------------------------------------

// // console.log({data})
// // data = [{'time', 'rssi', 'distance', 'kalmanDistance', x, y, z, id}, ...]
// data = [{kalmanDistance: 0.85, x: 0, y: 0, z: 0}, {kalmanDistance: 1.2, x: 0, y: 1, z: 0}, {kalmanDistance: 0.9, x: 1, y: 1, z: 0}]
// let previousLocation = [0, 0];
// previousLocation = tf.tensor2d([tf.tensor1d([0.5, 0.5]), tf.tensor1d([0])], [2, 1]);

// const inputs = tf.tensor2d(data.map((item) => [item.x, item.y]))
// const labels = tf.tensor2d(data.map((item) => [item.kalmanDistance]))
// inputs.print()
// labels.print()
// const model = tf.sequential();
// model.add(tf.layers.dense({units: 1, inputShape: [2]}));
// model.compile({loss: 'meanSquaredError', optimizer: 'sgd'});
// model.fit(inputs, labels, {epochs: 100}).then(() => {

//   const w = model.getWeights()[0].arraySync();
//   const b = model.getWeights()[1].arraySync()[0];
//   console.log({w, b});
//   const predictions = data.map((item) => model.predict(tf.tensor2d([item.x, item.y], [1,2])).dataSync());
//   const welp = data.map((item) => {
//     let x = (w[0][0] > 0 ? w[0][0]**0.5 : -1 * Math.abs(w[0][0])**0.5) * item.x + b;
//     let y = (w[1][0] > 0 ? w[1][0]**0.5 : -1 * Math.abs(w[1][0])**0.5) * item.y + b;
//     // console.log({x, y})
//     return [x, y]
//   })
//   console.log(welp.reduce((acc, value) => {return [acc[0] + value[0], acc[1] + value[1]]}).map((value) => value/welp.length))
//   // console.log(welp)

//   // console.log({predictions})
//   // console.log(tf.mean(predictions).dataSync())
  
//   console.log('[POSITION]: ', {x: w[0][0], y: w[1][0], b: b});
//   const x = w[0][0] > 0 ? w[0][0]**0.5 + b : -1 * Math.abs(w[0][0])**0.5 + b;
//   const y = w[1][0] > 0 ? w[1][0]**0.5 + b : -1 * Math.abs(w[1][0])**0.5 + b;
//   previousLocation = [x, y] || [0, 0];

//   postMessage({x: y, y: x});
// });

// --------------------------------------------------------------------------------


// // Kalman filter
// let previousCorrected_X = kFilter.getInitState();
// let previousCorrected_Y = kFilter.getInitState();
// let predicted_X;
// let predicted_Y;

// // Machine Learning Approach with 50 EPOCH
// let previousPredictedLocation = undefined;
// const EPOCH = 20;

// const dF = (point, estimate) => {
//   // Calculates the derivative of the loss function to be minimised
//   // point: location of beacon as [x_i, y_i]
//   // estimate: estimate of location as [x_e, y_e]
//   [x_i, y_i] = point;
//   [x_e, y_e] = estimate;
//   // console.log({point, estimate})
//   return [(x_i - x_e) / ((x_i - x_e)**2 + (y_i - y_e)**2)**0.5 || 0,  (y_i - y_e) / ((x_i - x_e)**2 + (y_i - y_e)**2)**0.5 || 0];
// }

// const RMSE = (d, point, estimate) => {
//   // Calculates the Root Mean Square Error of the distances
//   // d: distance to beacon
//   // point: location of beacon as [x_i, y_i]
//   // estimate: estimate of location as [x_e, y_e]
//   [x_i, y_i] = point;
//   [x_e, y_e] = estimate;
//   // console.log({d, point, estimate})
//   return Math.abs(d - ((x_i - x_e)**2 + (y_i - y_e)**2)**0.5);
// }

// const w_new = (X, y) => {
//   // Closed form solution for multivariate linear regression
//   // w* = (X' X)^(-1) X' y
//   const X_T = tf.transpose(X);
//   // console.log('huh?: ', X.dataSync())
//   // tf.matMul(X, X_T).print()
//   // console.log(tf.tensor(math.pinv(tf.matMul(X, X_T).arraySync())).shape)
//   // console.log(X.shape)
//   const XX_INV = tf.tensor2d(math.pinv(tf.matMul(X_T, X).arraySync()))
//   return tf.matMul(tf.matMul(XX_INV, X_T), y);
// }
  

// onmessage = ({data}) => {
//   const inputs = tf.tensor2d(data.map((item) => [item.x, item.y]))
//   const labels = tf.tensor2d(data.map((item) => [item.kalmanDistance])).dataSync()
//   let x_e = 0.5;
//   let y_e = 0.5;
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

//   for (let i = 0; i < EPOCH; i++) {
//     B = tf.tensor(data.map((item) => {
//       // console.log('[dF] ', dF([item.x, item.y], [x_e, y_e]))
//       return dF([item.x, item.y], [x_e, y_e]);
//     }), [3, 2])
//     f = tf.tensor(data.map((item, index) => {
//       // console.log('[RMSE] ', -1 * RMSE(labels[index], [item.x, item.y], [x_e, y_e]))
//       return RMSE(labels[index], [item.x, item.y], [x_e, y_e])
//     }), [3, 1])
//     // console.log('[B] Shape: ', B.shape);
//     // console.log('[f] Shape: ', f.shape);
//     // w_new(B, f).print()
//     new_weights = w_new(B, f).dataSync();
//     dx = new_weights[0];
//     dy = new_weights[1];
//     error = Math.abs(tf.sum(f).dataSync());
//     // console.log('[Iteration ', i,  ']', 'Delta: ', {dx, dy}, 'Error: ', error)
//     estimates.push({x: x_e, y: y_e})
//     x_e = x_e + dx;
//     y_e = y_e + dy;
    
//     // Keep track of location with smallest error
//     if (error < previousError) {
//       previousError = error;
//       final_x = x_e;
//       final_y = y_e;
//     }

//     // If error is low enough
//     // if (Math.abs(tf.sum(f).dataSync()) < 0.05) {
//     //   break;
//     // }
//   }
//   // console.log({estimates})
//   // console.log({x_e, y_e})
//   // console.log({x: final_x, y: final_y, error: previousError})

//   // Apply kalman filter on locations
//   predicted_X = kFilter.predict({previousCorrected: previousCorrected_X});
//   previousCorrected_X = kFilter.correct({
//       predicted: predicted_X,
//       observation: [final_x],
//     });
//   final_x = previousCorrected_X.mean.map(m => m[0])[0];

//   predicted_Y = kFilter.predict({previousCorrected: previousCorrected_Y});
//   previousCorrected_Y = kFilter.correct({
//       predicted: predicted_Y,
//       observation: [final_y],
//     });
//   final_y = previousCorrected_Y.mean.map(m => m[0])[0];

//   previousPredictedLocation = {x: final_x, y: final_y, error: previousError};
//   postMessage({x: final_x, y: final_y, error: previousError});
// };

// --------------------------------------------------------------------------------

// data = [{kalmanDistance: 0.85, x: 0, y: 0, z: 0}, {kalmanDistance: 1.2, x: 0, y: 1, z: 0}, {kalmanDistance: 0.9, x: 1, y: 1, z: 0}]

// const inputs = tf.tensor2d(data.map((item) => [item.x, item.y]))
//   const labels = tf.tensor2d(data.map((item) => [item.kalmanDistance])).dataSync()
//   let x_e = 0.5;
//   let y_e = 0.5;
//   let B;
//   let f;
//   let dx;
//   let dy;
//   let new_weights;
//   let estimates = [];
//   let error;

//   for (let i = 0; i < EPOCH; i++) {
//     B = tf.tensor(data.map((item) => {
//       // console.log('[dF] ', dF([item.x, item.y], [x_e, y_e]))
//       return dF([item.x, item.y], [x_e, y_e]);
//     }), [3, 2])
//     f = tf.tensor(data.map((item, index) => {
//       // console.log('[RMSE] ', -1 * RMSE(labels[index], [item.x, item.y], [x_e, y_e]))
//       return -1 * RMSE(labels[index], [item.x, item.y], [x_e, y_e])
//     }), [3, 1])
//     // console.log('[B] Shape: ', B.shape);
//     // console.log('[f] Shape: ', f.shape);
//     w_new(B, f).print()
//     new_weights = w_new(B, f).dataSync();
//     dx = new_weights[0];
//     dy = new_weights[1];
//     error = Math.abs(tf.sum(f).dataSync());
//     console.log('[Iteration ', i,  ']', 'Delta: ', {dx, dy}, 'Error: ', error)
//     estimates.push({x: x_e, y: y_e})
//     x_e = x_e + dx;
//     y_e = y_e + dy;
//     // If error is low enough
//     if (Math.abs(tf.sum(f).dataSync()) < 0.1) {
//       break;
//     }
//   }
//   console.log({estimates})
//   console.log({x_e, y_e})


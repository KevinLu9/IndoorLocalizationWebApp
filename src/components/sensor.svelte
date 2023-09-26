<script>
  import { ColorSwatch } from "heroicons-for-svelte/icons/outline";
  import { onDestroy } from "svelte";

  class KalmanFilter {
    constructor(meas_uncertainty, est_uncertainty, q) {
        /**
         * Represents a Bluetooth Beacon and its properties
         * @param {*} meas_uncertainty : measurement uncertainty
         * @param {*} est_uncertainty  : estimate uncertainty
         * @param {*} q : process noise
         */
        this.meas_uncertainty = meas_uncertainty;
        this.est_uncertainty = est_uncertainty;
        this.q = q;
        this.prev_est = 0;
        this.cur_est = 0;
        this.kalman_gain = 0;
    }
    calculateKalman(meas) {
        // meas: is the new value.
        // Kalman steps
        this.kal_gain = this.est_uncertainty / (this.est_uncertainty + this.meas_uncertainty); // compute kalman gain
        // console.log('kalman gain: ', this.kal_gain);
        this.cur_est = this.prev_est + this.kal_gain * (meas - this.prev_est); // compute estimate for current time step
        this.est_uncertainty = (1 - this.kal_gain) * this.est_uncertainty + Math.abs(this.prev_est - this.cur_est) * this.q; // update estimate uncertainty
        this.prev_est = this.cur_est; // update previous estimate for next loop iteration
        return this.cur_est;
    }
}

  // --------------------------------- Sensor Implementation ---------------------------------
  // Orientation Sensor, Accelerometer Sensor, and Gyroscope Sensor

  let orientation = [0, 0, 0];
  let accelerometer = [0, 0, 0];
  let gyroscope = [0, 0, 0];

  let x = 0;
  let y = 0;
  let z = 0;

  let kalmanX = new KalmanFilter(-0.5, 1, 0.0005);
  let kalmanY = new KalmanFilter(-0.5, 1, 0.0005);
  let kalmanValueX = 0;
  let kalmanValueY = 0;

  let prev_v_x = 0;
  let prev_v_y = 0;
  let curr_v_x = 0;
  let curr_v_y = 0;

  let prev_a_x = 0;
  let prev_a_y = 0;
  let curr_a_x = 0;
  let curr_a_y = 0;

  let deltaTime = 0;
  let lastMotionTime = new Date().getTime();
  let currentTime = new Date().getTime();
  let count = 0;
  let x_arr = [];
  let y_arr = [];
  const movingMean = 10;

  $: {
    // orientation = orientation;
    // accelerometer = accelerometer;
    // gyroscope = gyroscope;
  }

  function quaternionToEulerAngle(quat) {
  const q0 = quat[0];
  const q1 = quat[1];
  const q2 = quat[2];
  const q3 = quat[3];

  const Rx = Math.atan2(2 * (q0 * q1 + q2 * q3), 1 - (2 * (q1 * q1 + q2 * q2)));
  const Ry = Math.asin(2 * (q0 * q2 - q3 * q1));
  const Rz = Math.atan2(2 * (q0 * q3 + q1 * q2), 1 - (2  * (q2 * q2 + q3 * q3)));

  const euler = [Rx, Ry, Rz];

  return(euler);
  };

  function mean(arr) {
      return arr.reduce((acc, val) => acc + val, 0) * 1/arr.length
    }

  function handleOrientation(event) {
    orientation = [event.alpha, event.beta, event.gamma];
  }

  function handleMotion(event) {
    accelerometer = [
      event.acceleration.x,
      event.acceleration.y,
      event.acceleration.z,
    ];

    if (x_arr.length >= movingMean) {
      x_arr.shift();
      y_arr.shift();
    }
    x_arr.push(event.acceleration.x);
    y_arr.push(event.acceleration.y);
    
    // kalmanValueX = kalmanX.calculateKalman(accelerometer[0]);
    // kalmanValueY = kalmanY.calculateKalman(accelerometer[1]);

    // curr_v_x = (kalmanValueX - prev_a_x) * (deltaTime);
    // curr_v_y = (kalmanValueY - prev_a_y) * (deltaTime);
    // console.log(16.7)
    // console.log((deltaTime).toFixed(2));
    let D = 0.5 * ((mean(x_arr))**2 + (mean(y_arr))**2 )**0.5 * (deltaTime)**2;
    currentTime = new Date().getTime();
    deltaTime = (currentTime - lastMotionTime) / 1000;
    x += D * Math.cos(orientation[0] * Math.PI / 180);
    y += D * Math.sin(orientation[0] * Math.PI / 180);
    lastMotionTime = currentTime;
    count += 1;
    if (count >= 10) {
      count = 0;
      // console.log((x*100).toFixed(4), (y*100).toFixed(4), z.toFixed(4));
    }
    
    
    
    // z = z + accelerometer[2] * (16.7/1000)**2 * Math.cos(orientation[2]);

    gyroscope = [
      event.rotationRate.alpha,
      event.rotationRate.beta,
      event.rotationRate.gamma,
    ];
    prev_a_x = accelerometer[0];
    prev_a_y = accelerometer[1];
    prev_v_x = curr_v_x;
    prev_v_y = curr_v_y;

    
  }

  window.addEventListener("deviceorientation", handleOrientation);
  window.addEventListener("devicemotion", handleMotion);

  onDestroy(() => {
    window.removeEventListener("deviceorientation", handleOrientation);
    window.addEventListener("devicemotion", handleMotion);
  });

</script>

<!-- Device Sensor Data -->
<h2 class="font-bold text-center text-lg underline">Device Sensor Data</h2>
<div style="text-align: center">
  <ul class="list-group">
    <li class="list-group-item">
      <h4>Orientation</h4>
      <button class="btn bg-cyan-900 text-white w-12 h-12 disabled"
        >{orientation[0]?.toFixed(0) || 0}</button
      >
      <button class="btn bg-cyan-900 text-white w-12 h-12 disabled"
        >{orientation[1]?.toFixed(0) || 0}</button
      >
      <button class="btn bg-cyan-900 text-white w-12 h-12 disabled"
        >{orientation[2]?.toFixed(0) || 0}</button
      >
    </li>
    <li class="list-group-item">
      <h4 style="text-align: center; margin: 5px">Accelerometer</h4>
      <button class="btn bg-cyan-900 text-white w-12 h-12 disabled"
        >{accelerometer[0]?.toFixed(0) || '?'}</button
      >
      <button class="btn bg-cyan-900 text-white w-12 h-12 disabled"
        >{accelerometer[1]?.toFixed(0) || '?'}</button
      >
      <button class="btn bg-cyan-900 text-white w-12 h-12 disabled"
        >{accelerometer[2]?.toFixed(0) || '?'}</button
      >
    </li>
    <li class="list-group-item">
      <h4 style="text-align: center; margin: 5px">Gyroscope</h4>
      <button class="btn bg-cyan-900 text-white w-12 h-12 disabled"
        >{gyroscope[0]?.toFixed(0) || '?'}</button
      >
      <button class="btn bg-cyan-900 text-white w-12 h-12 disabled"
        >{gyroscope[1]?.toFixed(0) || '?'}</button
      >
      <button class="btn bg-cyan-900 text-white w-12 h-12 disabled"
        >{gyroscope[2]?.toFixed(0) || '?'}</button
      >
    </li>
    <li class="list-group-item">
      <h4 style="text-align: center; margin: 5px">PDR Location</h4>
      <button class="btn bg-cyan-900 text-white w-12 h-12 disabled"
        >{(x*100)?.toFixed(0) || '?'}</button
      >
      <button class="btn bg-cyan-900 text-white w-12 h-12 disabled"
        >{(y*100)?.toFixed(0)  || '?'}</button
      >
      <button class="btn bg-cyan-900 text-white w-12 h-12 disabled"
        >{(z*100)?.toFixed(0)  || '?'}</button
      >
    </li>
  </ul>
</div>
<script>
    
  // --------------------------------- Sensor Implementation ---------------------------------
  // Orientation Sensor, Accelerometer Sensor, and Gyroscope Sensor
  const PARAM = {
    ORIENTATION_A: "Orientation_a",
    ORIENTATION_B: "Orientation_b",
    ORIENTATION_G: "Orientation_g",
    ACCELEROMETER_X: "Accelerometer_x",
    ACCELEROMETER_Y: "Accelerometer_y",
    ACCELEROMETER_Z: "Accelerometer_z",
    GYROSCOPE_A: "Gyroscope_a",
    GYROSCOPE_B: "Gyroscope_b",
    GYROSCOPE_G: "Gyroscope_g",
  };

  let orientation;
  let accelerometer;
  let gyroscope;
  $: {
    orientation = [0, 0, 0];
    accelerometer = [0, 0, 0];
    gyroscope = [0, 0, 0];
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
    gyroscope = [
      event.rotationRate.alpha,
      event.rotationRate.beta,
      event.rotationRate.gamma,
    ];
  }

  window.addEventListener("deviceorientation", handleOrientation);
  window.addEventListener("devicemotion", handleMotion);

  onDestroy(() => {
    window.removeEventListener("deviceorientation", handleOrientation);
    window.addEventListener("devicemotion", handleMotion);
  });

</script>

<!-- Device Sensor Data -->
<h2 class="justify-center font-bold">Device Sensor Data</h2>
<div style="text-align: center">
  <ul class="list-group">
    <li class="list-group-item">
      <h4>Orientation</h4>
      <button class="btn bg-cyan-900 text-white w-12 h-12 disabled"
        >{orientation[0].toFixed(0)}</button
      >
      <button class="btn bg-cyan-900 text-white w-12 h-12 disabled"
        >{orientation[1].toFixed(0)}</button
      >
      <button class="btn bg-cyan-900 text-white w-12 h-12 disabled"
        >{orientation[2].toFixed(0)}</button
      >
    </li>
    <li class="list-group-item">
      <h4 style="text-align: center; margin: 5px">Accelerometer</h4>
      <button class="btn bg-cyan-900 text-white w-12 h-12 disabled"
        >{accelerometer[0].toFixed(0)}</button
      >
      <button class="btn bg-cyan-900 text-white w-12 h-12 disabled"
        >{accelerometer[1].toFixed(0)}</button
      >
      <button class="btn bg-cyan-900 text-white w-12 h-12 disabled"
        >{accelerometer[2].toFixed(0)}</button
      >
    </li>
    <li class="list-group-item">
      <h4 style="text-align: center; margin: 5px">Gyroscope</h4>
      <button class="btn bg-cyan-900 text-white w-12 h-12 disabled"
        >{gyroscope[0].toFixed(0)}</button
      >
      <button class="btn bg-cyan-900 text-white w-12 h-12 disabled"
        >{gyroscope[1].toFixed(0)}</button
      >
      <button class="btn bg-cyan-900 text-white w-12 h-12 disabled"
        >{gyroscope[2].toFixed(0)}</button
      >
    </li>
  </ul>
</div>
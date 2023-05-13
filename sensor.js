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

function updateFieldIfNotNull(fieldName, value, precision = 0) {
    if (value != null) {
        document.getElementById(fieldName).innerHTML = value
            .toFixed(precision)
            .toString();
        switch (fieldName) {
            case PARAM.ORIENTATION_A:
            case PARAM.ORIENTATION_B:
            case PARAM.ORIENTATION_G:
                document.getElementById(fieldName).innerHTML =
                    value.toFixed(precision).toString() + "&#0176";
                break;
            default:
                document.getElementById(fieldName).innerHTML = value
                    .toFixed(precision)
                    .toString();
                break;
        }
    }
}

function handleOrientation(event) {
    updateFieldIfNotNull(PARAM.ORIENTATION_A, event.alpha);
    updateFieldIfNotNull(PARAM.ORIENTATION_B, event.beta);
    updateFieldIfNotNull(PARAM.ORIENTATION_G, event.gamma);
}

function handleMotion(event) {
    updateFieldIfNotNull(PARAM.ACCELEROMETER_X, event.acceleration.x);
    updateFieldIfNotNull(PARAM.ACCELEROMETER_Y, event.acceleration.y);
    updateFieldIfNotNull(PARAM.ACCELEROMETER_Z, event.acceleration.z);

    //updateFieldIfNotNull('Accelerometer_i', event.interval, 2);

    updateFieldIfNotNull(PARAM.GYROSCOPE_A, event.rotationRate.alpha);
    updateFieldIfNotNull(PARAM.GYROSCOPE_B, event.rotationRate.beta);
    updateFieldIfNotNull(PARAM.GYROSCOPE_G, event.rotationRate.gamma);
}

window.addEventListener("deviceorientation", handleOrientation);
window.addEventListener("devicemotion", handleMotion);

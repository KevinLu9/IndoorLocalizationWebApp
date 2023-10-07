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
        this.prev_est = undefined;
        this.cur_est = 0;
        this.kalman_gain = 0;
    }
    calculateKalman(meas) {
        // meas: is the new value.
        if (this.prev_est == undefined) {
            this.prev_est = meas;
            this.cur_est = meas;
            return this.cur_est;
        }
        // Kalman steps
        this.kal_gain = this.est_uncertainty / (this.est_uncertainty + this.meas_uncertainty); // compute kalman gain
        // console.log('kalman gain: ', this.kal_gain);
        this.cur_est = this.prev_est + this.kal_gain * (meas - this.prev_est); // compute estimate for current time step
        this.est_uncertainty = (1 - this.kal_gain) * this.est_uncertainty + Math.abs(this.prev_est - this.cur_est) * this.q; // update estimate uncertainty
        this.prev_est = this.cur_est; // update previous estimate for next loop iteration
        return this.cur_est;
    }
}



// data = [-39, -40, -44, -39, -80]
// const meas_uncertainty = 1; // measurement uncertainty
// let est_uncertainty = 1; // estimate uncertainty
// const q = 0.05; // process noise

// let kalman_out = [];
// let meas = 0;
// let prev_est = -70;
// let kalman_gain = 0;
// let cur_est = 0;
// for (let i = 0; i < data.length; i++) {
//     meas = data[i];
//     // Kalman steps
//     kal_gain = est_uncertainty / (est_uncertainty + meas_uncertainty); // compute kalman gain
//     cur_est = prev_est + kal_gain * (meas - prev_est); // compute estimate for current time step
//     est_uncertainty = (1 - kal_gain) * est_uncertainty + abs(prev_est - cur_est) * q; // update estimate uncertainty
//     prev_est = cur_est; // update previous estimate for next loop iteration
//     kalman_out.push(cur_est);
// }
// console.log({ kalman_out })
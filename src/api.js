import axios from "axios";

export const api = {};

api.URL = "https://kevin902.pythonanywhere.com/api/";
// api.URL = "https://16.50.180.11:8000/api/";
api.get_beacon = async function get_beacon() {
  const api_url = `${api.URL}beacon`;
  let error = undefined;
  let data = undefined;
  await axios.get(api_url)
  .then((res) => {
    data = res.data;
  })
  .catch((err) => {
    error = err;
  })
  return {error, data}
}

api.create_beacon = async function create_beacon(id, name, txPower, x, y, z) {
  const api_url = `${api.URL}beacon`;
  const options = {
    'param': {
      id, name, txPower, x, y, z
    }
  };
  let error = undefined;
  let data = undefined;
  await axios.post(api_url, {id, name, txPower, x, y, z})
  .then((res) => {
    data = res.data;
  })
  .catch((err) => {
    error = err;
  })
  return {error, data}
}

api.update_beacon = async function update_beacon(newData) {
  // Details can be: {id, name, txPower, x, y, z, content}
  const api_url = `${api.URL}beacon`;
  let error = undefined;
  let data = undefined;
  await axios.patch(api_url, newData)
  .then((res) => {
    data = res.data;
  })
  .catch((err) => {
    error = err;
  })
  return {error, data}
}

api.get_beacon_content = async function get_beacon_content(id) {
  const api_url = `${api.URL}content/${id}`;
  let error = undefined;
  let data = undefined;
  await axios.get(api_url)
  .then((res) => {
    data = res.data;
  })
  .catch((err) => {
    error = err;
  })
  return {error, data}
}

api.update_beacon_content = async function update_beacon_content(id, content) {
  const api_url = `${api.URL}content`;
  let error = undefined;
  let data = undefined;
  await axios.patch(api_url, {id: id, content: content})
  .then((res) => {
    data = res.data
  })
  .catch((err) => {
    error = err;
  })
  return {error, data}
}

api.get_device = async function get_device() {
  const api_url = `${api.URL}device`;
  let error = undefined;
  let data = undefined;
  await axios.get(api_url)
  .then((res) => {
    data = res.data;
  })
  .catch((err) => {
    error = err;
  })
  return {error, data}
}

api.create_device = async function create_device(id, name, txPower) {
  const api_url = `${api.URL}device`;
  let error = undefined;
  let data = undefined;
  await axios.post(api_url, {id, name, txPower})
  .then((res) => {
    data = res.data;
  })
  .catch((err) => {
    error = err;
  })
  return {error, data}
}

api.get_location = async function get_location(datetime_search, id) {
  const api_url = `${api.URL}location`;
  let error = undefined;
  let data = undefined;
  await axios.get(api_url, {datetime_search, id})
  .then((res) => {
    data = res.data;
  })
  .catch((err) => {
    error = err;
  })
  return {error, data}
}

api.create_location = async function create_location(id, rssi, x, y) {
  const api_url = `${api.URL}location`;
  let error = undefined;
  let data = undefined;
  await axios.post(api_url, {id, rssi, x, y})
  .then((res) => {
    data = res.data;
  })
  .catch((err) => {
    error = err;
  })
  return {error, data}
}
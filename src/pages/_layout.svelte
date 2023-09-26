<!-- routify:options preload="proximity" -->
<script>
  import Bluetooth from "../components/bluetooth.svelte";
  import Navbar from "../components/navbar.svelte";
  import Sensor from "../components/sensor.svelte";
</script>

<Navbar>
  <Bluetooth />
  <Sensor />
</Navbar>

<slot />

<!-- routify:options preload="proximity" -->
<script>
  import Bluetooth from "../components/bluetooth.svelte";
  import Navbar from "../components/navbar.svelte";
</script>

<Navbar>
  <Bluetooth />
</Navbar>

<slot />

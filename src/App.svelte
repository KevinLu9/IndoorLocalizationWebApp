<script>
  import { Router } from "@roxi/routify";
  import { routes } from "../.routify/routes";
  import { isGlobalLoading, globalLoadingMessage } from "./store";
  // console.log('[THEME]',localStorage.getItem("theme"))
  // document.querySelector("html").setAttribute("data-theme", "dark")

  let isLoading = false;
  let loadingMessage = "";

  isGlobalLoading.subscribe((value) => {
    isLoading = value;
  })
  globalLoadingMessage.subscribe((value) => {
    loadingMessage = value;
  })

</script>
  <div>
    {#if isLoading}
      <div class="absolute w-full h-full bg-black opacity-50 flex flex-col items-center justify-center" />
      <div class="absolute w-full h-full bg-transparent flex flex-col items-center justify-center">
        <span class="loading loading-infinity loading-lg scale-150 text-white" />
        <p class="font-bold uppercase text-white">{loadingMessage}</p>
      </div>
    {/if}
    
    <div class="h-full max-h-[100vh] { isLoading ? 'overflow-y-hidden' : ''}">
      <Router {routes} />
    </div>
    
  </div>
  



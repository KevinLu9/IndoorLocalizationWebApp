<script>
  import { route } from "@roxi/routify";
  import Icon from "heroicons-for-svelte";
  import {
    InformationCircle,
    ChevronDown,
    ChevronUp,
    ChevronDoubleLeft,
  } from "heroicons-for-svelte/icons/outline";
  import LoginModal from "./loginModal.svelte";
  import { isLoggedIn } from "../store"; 
  import { get } from "svelte/store";

  let isNavBarVisible = false;
  let isDiagnoseVisible = true;
  let links = [];

  let loggedIn = get(isLoggedIn);
  isLoggedIn.subscribe((val) => {
    loggedIn = val;
  })

  $: {
    if (loggedIn) {
      links = [
        ["/", "Home"],
        ["/about", "About"],
        ["/diagnose", "Diagnose"],
        ["/setup", "Setup"]
      ];
    } else {
      links = [
        ["/", "Home"],
        ["/about", "About"],
        ["/diagnose", "Diagnose"],
      ];
    }
  }
  
  
  let drawerVal = false;
  let isLoginModalVisible = false;

</script>

<div class="drawer">
  <input
    id="my-drawer"
    type="checkbox"
    class="drawer-toggle"
    checked={drawerVal}
  />
  <div class="drawer-content flex flex-col">
    <div
      class="w-full navbar bg-gray-700 flex justify-start"
    >
      <div class="flex-none">
        <!-- svelte-ignore a11y-label-has-associated-control -->
        <label
          on:click={() => {
            drawerVal = !drawerVal;
          }}
          class="btn btn-square btn-ghost text-gray-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            class="inline-block w-6 h-6 stroke-current"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            /></svg
          >
        </label>
      </div>
      <a href="./" class="flex items-center">
        <img
          src="/images/location_logo.png"
          class="h-8 mr-3"
          alt="Flowbite Logo"
        />
        <div class="flex-1 px-2 mx-2 font-bold text-white whitespace-nowrap">Indoor Localisation</div>
      </a>
      <div class="w-full flex items-center justify-end"></div>
      <!-- <button class="btn btn-outline btn-sm" on:click={() => {isLoginModalVisible = !isLoginModalVisible}}>Login</button> -->
      <LoginModal />
    </div>
    <!-- Page content here -->
  </div>
  <div class="drawer-side  z-[99]">
    <label for="my-drawer" class="drawer-overlay" />
    <div class="flex flex-col h-full bg-gray-200 dark:bg-gray-900">
      <div class="bg-gray-200 dark:bg-gray-900">
        <li class="flex flex-row w-full justify-between items-center bg-gray-700 p-3">
          <div class="w-10 h-10">
            <img
              src="/images/location_logo.png"
              class="object-fill w-10 h-10"
              alt="Logo"
            />
          </div>
          <p class="px-2 mx-2 font-bold text-lg text-center text-white">Indoor Localisation</p>
          <div class="pr-0 cursor-pointer" on:click={()=>{drawerVal=!drawerVal}}>
            <Icon icon={ChevronDoubleLeft} class="scale-150 justify-end text-gray-200"/>
          </div>
        </li>
        <ul class="menu w-full divide-solid divide-white ">
          {#each links as link}
            <li>
              {#if $route.path == "/index" && link[0] == "/"}
                <a
                  href={link[0]}
                  class="flex flex-col justify-center btn font-bold pointer-events-none border-black bg-blue-700 rounded-lg"
                  on:click={() => {
                    drawerVal = !drawerVal;
                    console.log("WUT");
                  }}
                >
                  <p class="w-full text-center">
                    {link[1]}
                  </p>
                </a>
              {:else if $route.path == link[0] + "/index"}
                <a
                  href={link[0]}
                  class="flex flex-col justify-center btn font-bold pointer-events-none border-black bg-blue-700 rounded-lg"
                  on:click={() => {
                    drawerVal = !drawerVal;
                  }}
                >
                  <p class="w-full text-center">
                    {link[1]}
                  </p>
                </a>
              {:else}
                <a
                  href={link[0]}
                  class="flex flex-col justify-center btn bg-gray-200 dark:bg-gray-900 border-0 font-bold rounded-lg md:hover:text-blue-500 hover:bg-gray-700"
                  on:click={() => {
                    drawerVal = !drawerVal;
                  }}
                >
                  <p class="w-full text-center">
                    {link[1]}
                  </p>
                </a>
              {/if}
            </li>
          {/each}

        </ul>
        <div class="divider m-0 p-0 bg-gray-200 dark:bg-gray-900"/>
        <div
          class="btn bg-gray-200 dark:bg-gray-900 border-0 flex flex-col justify-center items-center"
          on:click|preventDefault={() => {
            isDiagnoseVisible = !isDiagnoseVisible;
          }}
        >
          <div class="flex flex-row items-center justify-center">
            <div class="w-full h-full flex items-center">
              {#if isDiagnoseVisible}
                <Icon icon={ChevronDown} class="scale-150 mr-2" />
              {:else}
                <Icon icon={ChevronUp} class="scale-150 mr-2" />
              {/if}
            </div>
            <p>Settings</p>
          </div>
        </div>
      </div>
      <div class="divider m-0 p-0 bg-gray-200 dark:bg-gray-900"/>
      <div class="outline-2 outline-blue-900 overflow-x-auto bg-gray-200 dark:bg-gray-900 h-full {isDiagnoseVisible ? '' : 'invisible'}">
        <slot />
      </div>
    </div>
  </div>
</div>


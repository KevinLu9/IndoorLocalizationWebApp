<script>
  import { route } from "@roxi/routify";
  import Icon from "heroicons-for-svelte";
  import {
    InformationCircle,
    ChevronDown,
    ChevronUp,
    ChevronDoubleLeft,
  } from "heroicons-for-svelte/icons/outline";
  let isNavBarVisible = false;
  let isDiagnoseVisible = true;
  const links = [
    ["/", "Home"],
    ["/about", "About"],
    ["/diagnose", "Diagnose"],
  ];
  let drawerVal = false;
  $m: {
    console.log({ drawerVal });
  }
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
      class="w-full navbar bg-base-300 flex justify-start lg:justify-between"
    >
      <div class="flex-none lg:hidden">
        <!-- svelte-ignore a11y-label-has-associated-control -->
        <label
          on:click={() => {
            drawerVal = !drawerVal;
          }}
          class="btn btn-square btn-ghost"
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
        <div class="flex-1 px-2 mx-2 font-bold">Indoor Localisation</div>
      </a>
      <div class="pr-10 flex-none hidden lg:block">
        <ul
          class="font-medium flex flex-col p-4 md:p-0 mt-4 border rounded-lg md:flex-row md:space-x-8 md:mt-0 md:border-0 bg-gray-800 md:bg-gray-900 border-gray-700"
        >
          {#each links as link}
            <li>
              {#if $route.path == "/index" && link[0] == "/"}
                <a
                  href={link[0]}
                  class="block py-2 pl-3 pr-4 bg-blue-700 rounded md:bg-transparent md:p-0 ext-white md:text-blue-500"
                >
                  {link[1]}
                </a>
              {:else if $route.path == link[0] + "/index"}
                <a
                  href={link[0]}
                  class="disabled block py-2 pl-3 pr-4 bg-blue-700 rounded md:bg-transparent md:p-0 text-white md:text-blue-500"
                >
                  {link[1]}
                </a>
              {:else}
                <a
                  href={link[0]}
                  class="block py-2 pl-3 pr-4 rounded md:border-0 md:p-0 text-white md:hover:text-blue-500 hover:bg-gray-700 hover:text-white md:hover:bg-transparent"
                >
                  {link[1]}
                </a>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    </div>
    <!-- Page content here -->
  </div>
  <div class="drawer-side">
    <label for="my-drawer" class="drawer-overlay" />
    <div class="flex flex-col h-full">
      <div class="bg-base-200">
        <ul class="menu p-4 w-full divide-solid divide-white">
          <li class="flex flex-row">
            <div class="flex items-center">
              <img
                src="/images/location_logo.png"
                class="h-8 mr-3"
                alt="Flowbite Logo"
              />
              <div class="flex-1 px-2 mx-2 font-bold text-lg">
                Indoor Localisation
              </div>
            </div>
            <div class="pr-0" on:click={()=>{drawerVal=!drawerVal}}>
              <Icon icon={ChevronDoubleLeft} class="scale-150 justify-end"/>
            </div>
          </li>
          {#each links as link}
            <li>
              {#if $route.path == "/index" && link[0] == "/"}
                <a
                  href={link[0]}
                  class="flex flex-col justify-center btn btn-disabled font-bold disabled bg-blue-700 rounded md:bg-transparent md:p-0 md:text-blue-500"
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
                  class="flex flex-col justify-center btn btn-disabled font-bold disabled bg-blue-700 rounded md:bg-transparent md:p-0 md:text-blue-500"
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
                  class="flex flex-col justify-center btn font-bold rounded md:border-0 md:p-0 md:hover:text-blue-500 hover:bg-gray-700 md:hover:bg-transparent"
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
        <div
          class="btn w-[50%] flex flex-col justify-between"
          on:click|preventDefault={() => {
            isDiagnoseVisible = !isDiagnoseVisible;
          }}
        >
          {#if isDiagnoseVisible}
            <Icon icon={ChevronDown} class="scale-150 mb-4" />
          {:else}
            <Icon icon={ChevronUp} class="scale-150 mb-4" />
          {/if}
          <div class="flex">
            <Icon icon={InformationCircle} class="scale-150 mb-1 mr-2" />
            Settings
          </div>
        </div>
      </div>
      <div class="divider m-0 p-0 bg-base-200"/>
      <div class="outline-2 outline-blue-900 overflow-x-auto bg-base-200 h-full">
        {#if isDiagnoseVisible}
          <slot />
        {/if}
      </div>
    </div>
  </div>
</div>

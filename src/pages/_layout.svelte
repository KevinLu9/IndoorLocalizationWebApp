<!-- routify:options preload="proximity" -->
<script>
    import { route } from "@roxi/routify";

    const links = [
        ["/", "Home"],
        ["/about", "About"],
        ["/diagnose", "Diagnose"],
    ]
    let isNavBarVisible = false
    
</script>

<nav class="border-gray-700 bg-gray-900">
    <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
      <a href="./" class="flex items-center">
          <img src="/images/location_logo.png" class="h-8 mr-3" alt="Flowbite Logo" />
          <span class="self-center text-2xl font-semibold whitespace-nowrap text-white dark:text-white">Indoor Localisation</span>
      </a>
      <button data-collapse-toggle="navbar-default" type="button" class="inline-flex items-center p-2 ml-3 text-sm text-gray-500 rounded-lg md:hidden focus:outline-none focus:ring-2 focus:bg-gray-900 dark:text-gray-400 hover:bg-gray-700 focus:ring-gray-600" aria-controls="navbar-default" aria-expanded="false">
        <span class="sr-only">Open main menu</span>
        <svg class="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" on:click={ () => {isNavBarVisible = !isNavBarVisible}}>
            <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
        </svg>
    </button>
      <div class={isNavBarVisible ? "w-full md:block md:w-auto" : "hidden w-full md:block md:w-auto"} id="navbar-default">
        <ul class="font-medium flex flex-col p-4 md:p-0 mt-4 border rounded-lg md:flex-row md:space-x-8 md:mt-0 md:border-0 bg-gray-800 md:bg-gray-900 border-gray-700">
            {#each links as link}
            <li>
                {#if $route.path == '/index' && link[0] == '/'}
                    <a href={link[0]} class="disabled block py-2 pl-3 pr-4 bg-blue-700 rounded md:bg-transparent md:p-0 ext-white md:text-blue-500" aria-current="page">{link[1]}</a>
                {:else if $route.path == link[0] + '/index'}
                    <a href={link[0]} class="disabled block py-2 pl-3 pr-4 bg-blue-700 rounded md:bg-transparent md:p-0 text-white md:text-blue-500" aria-current="page">{link[1]}</a>
                {:else}
                    <a href={link[0]} class="block py-2 pl-3 pr-4 rounded md:border-0 md:p-0 text-white md:hover:text-blue-500 hover:bg-gray-700 hover:text-white md:hover:bg-transparent">{link[1]}</a>
                {/if}
            </li>
            {/each}
        </ul>
      </div>
      
    </div>
</nav>
  
<slot />

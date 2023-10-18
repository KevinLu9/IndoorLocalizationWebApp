<script>
  import { api } from "../api";
  import { onMount } from "svelte";
  import Icon from "heroicons-for-svelte";
  import {
    Logout
  } from "heroicons-for-svelte/icons/outline";
  import { isLoggedIn } from "../store";
  let isLoginModalVisible = false;
  let username = "";
  let password = "";
  let isUsernameError = false;
  let isPasswordError = false;
  let isError = false;
  let isLoading = false;
  let name = "";

  onMount(() => {
    let token = localStorage.getItem("auth_token")
    console.log("ONMOUNT: ", token)
    if (token) {
      login(token, "a");
    }
  });

  const login = (user, pass) => {
    isUsernameError = user == "";
    isPasswordError = pass == "";
    console.log("LOGGING IN")
    if (isUsernameError || isPasswordError) {
      return
    }

    isLoading = true;
    api.login(user, pass).then((res) => {
      if (res.error) {
        isError = true;
      } else {
        isError = false;
        name = res.data.name
        localStorage.setItem("auth_token", res.data.token);
        isLoginModalVisible = false;
        isLoggedIn.set(true);
      }
      isLoading = false;
      console.log('login: ', {res});
    })
  }

  const logout = () => {
    localStorage.removeItem("auth_token");
    location.reload();
  }

</script>

{#if name}
  <button class="btn btn-outline btn-sm" on:click={logout}>
    {name}
    <Icon icon={Logout} class="scale-150 ml-2 w-16 h-16 text-green-500 flex-shrink-0" />
  </button>
{:else}
  <button class="btn btn-outline btn-sm" on:click={() => {isLoginModalVisible = !isLoginModalVisible}}>Login</button>
{/if}

<input type="checkbox" id="my_modal_7" class="modal-toggle" bind:checked={isLoginModalVisible} />
<div class="modal">
  <div class="modal-box">
    <h3 class="text-lg font-bold">Admin Login</h3>
    <p class="py-4">Login to manage content.</p>
    <div class="w-full flex flex-col gap-2">
      <input 
        class="input input-bordered w-full bg-base-300 {isUsernameError ? 'border-error': ''}"
        on:change={() => {isUsernameError = false}} placeholder="Username" 
        bind:value={username}
      />
      <input 
        class="input input-bordered w-full bg-base-300 {isPasswordError ? 'border-error': ''}"
        type="password"
        on:change={() => {isPasswordError = false}} placeholder="Password" 
        bind:value={password}
      />
    </div>
    
    <div class="flex w-full gap-2 justify-end items-center pt-4">
      {#if isError}
        <p class="text-error">Invalid Username or Password.</p>
      {/if}
      {#if isLoading}
        <button class="btn btn-primary pointer-events-none" >
          <span class="loading loading-dots loading-sm"></span>
        </button>
      {:else}
        <button class="btn btn-primary" on:click={() => {login(username, password)}}>
          Login
        </button>
      {/if}
      <button class="btn btn-neutral" on:click={() => {isLoginModalVisible = !isLoginModalVisible}}>
        Close
      </button>
    </div>
  </div>
  
</div>

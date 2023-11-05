<script lang="ts">
    import { page } from "$app/stores";
    import Redirect from "./Redirect.svelte";
</script>

{#if !$page.data.user}
    <Redirect to="/auth/login?{new URLSearchParams({ redirect: $page.url.pathname })}" />
{:else}
    <slot />
{/if}

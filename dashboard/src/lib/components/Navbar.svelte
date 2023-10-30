<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import invite from "$lib/invite";
    import Icon from "./Icon.svelte";
    import LoggedInAs from "./LoggedInAs.svelte";

    const links: [string, string, string, boolean?, boolean?][] = [
        ["/docs", "book", "Docs"],
        [invite(), "plus", "Invite", false, true],
        ["https://discord.gg/7TRKfSK7EU", "discord", "Support", true, true],
    ];

    let dark = true;
    let sidebarOpen = false;

    function toggleTheme() {
        dark = !dark;
        localStorage.setItem("theme", dark ? "dark" : "light");
        dark ? document.documentElement.classList.add("dark") : document.documentElement.classList.remove("dark");
    }

    if (browser) {
        const stored = localStorage.getItem("theme");

        if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
            dark = true;
            document.documentElement.classList.add("dark");
        } else {
            dark = false;
            document.documentElement.classList.remove("dark");
        }
    }
</script>

<nav class="z-10 fixed w-screen flex items-center justify-between bg-surface-600 dark:bg-surface-900 text-surface-50">
    <div class="flex items-center">
        <a href="/" class="flex items-center gap-4 px-4 py-2">
            <img src="/favicon.png" alt="Daedalus Icon" class="h-12 rounded" />
            <span class="text-2xl font-bold">Daedalus</span>
        </a>
        {#each links as [href, icon, label, brand, external]}
            <span class="divider-vertical h-8 hidden lg:block" />
            <a {href} target={external ? "_blank" : null} class="flex items-center text-lg p-4 hidden lg:block">
                <Icon {icon} {brand} class="pr-2" />
                {label}
            </a>
        {/each}
    </div>
    <div class="flex items-center">
        {#if $page.data.user}
            <div class="hidden lg:block">
                <LoggedInAs />
            </div>
            <span class="divider-vertical h-8 hidden lg:block" />
            <a href="/auth/logout?{new URLSearchParams({ redirect: $page.url.pathname })}" class="flex items-center gap-2 text-lg p-4 hidden lg:block">
                <Icon icon="right-from-bracket" />
                Log Out
            </a>
        {:else}
            <a href="/auth/login?{new URLSearchParams({ redirect: $page.url.pathname })}" class="flex items-center gap-2 text-lg p-4 hidden lg:block">
                <Icon icon="right-to-bracket" />
                Log In
            </a>
        {/if}
        <button class="w-16 py-6 flex flex-col items-center" on:click={toggleTheme}>
            <Icon icon="sun" class="hidden dark:block" />
            <Icon icon="moon" class="block dark:hidden" />
        </button>
        <button class="w-16 py-6 flex flex-col items-center block lg:hidden" on:click={() => (sidebarOpen = true)}>
            <Icon icon="bars" />
        </button>
    </div>
</nav>
<div id="sidebar" class="{sidebarOpen ? 'open' : ''} z-20 block lg:hidden fixed inset-0 dark:bg-surface-900/40 backdrop-blur-sm">
    <button class="h-full w-1/4 cursor-default" on:click={() => (sidebarOpen = false)} />
    <div class="fixed top-0 left-1/4 right-0 bottom-0 flex flex-col dark:bg-surface-900/80 backdrop-blur-sm">
        <div class="h-full flex flex-col justify-between">
            <div class="flex flex-col">
                <div class="flex flex-col items-end">
                    <button class="right-0 w-16 py-6 flex flex-col items-center" on:click={() => (sidebarOpen = false)}>
                        <Icon icon="xmark" />
                    </button>
                </div>
                {#each links as [href, icon, label, brand, external], index}
                    {#if index !== 0}
                        <hr />
                    {/if}
                    <a {href} target={external ? "_blank" : null} class="flex items-center text-lg p-4">
                        <Icon {icon} {brand} class="pr-4" />
                        {label}
                    </a>
                {/each}
            </div>
            <div class="flex flex-col">
                {#if $page.data.user}
                    <div class="p-4">
                        <LoggedInAs />
                    </div>
                    <hr />
                    <a href="/auth/logout?{new URLSearchParams({ redirect: $page.url.pathname })}" class="flex items-center text-lg p-4">
                        <Icon icon="right-from-bracket" class="pr-4" />
                        Log Out
                    </a>
                {:else}
                    <a href="/auth/login?{new URLSearchParams({ redirect: $page.url.pathname })}" class="flex items-center text-lg p-4">
                        <Icon icon="right-to-bracket" class="pr-4" />
                        Log In
                    </a>
                {/if}
            </div>
        </div>
    </div>
</div>

<style lang="postcss">
    #sidebar {
        translate: 100vw;
        transition: translate 200ms;
    }

    #sidebar.open {
        translate: 0;
    }
</style>

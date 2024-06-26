<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import Button from "$lib/components/Button.svelte";
    import Container from "$lib/components/Container.svelte";
    import Header from "$lib/components/Header.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import Loading from "$lib/components/Loading.svelte";
    import P from "$lib/components/P.svelte";
    import invite from "$lib/invite";
    import { fuzzy } from "$lib/utils";
    import type { DDLGuild } from "shared";
    import { onMount } from "svelte";

    let servers: (DDLGuild & { hide: boolean })[] | undefined;
    let loading: boolean = false;
    let query: string;
    let error: string;
    let updated: number = 0;
    let showAll: boolean;

    function key(server: DDLGuild) {
        return [server.hasBot, server.owner, (BigInt(server.permissions) & 8n) > 0n, server.features.includes("COMMUNITY")]
            .map<number>((x) => (x ? 0 : 1))
            .reduce((x, y) => x * 2 + y);
    }

    async function load() {
        loading = true;

        const request = await fetch("/api/fetch-guilds");
        const response = await request.json();

        if (response.error) {
            console.error(response.data);
            return (error = response.error);
        }

        servers = response.guilds;

        updated = Date.now();
        servers!.sort((x, y) => key(x) - key(y) || x.name.localeCompare(y.name));

        localStorage.setItem("server-list", JSON.stringify({ updated, servers }));

        loading = false;
    }

    onMount(() => {
        setTimeout(() => {
            if ($page.url.searchParams.has("reload")) {
                localStorage.removeItem("server-list");
                goto("/manage", { replaceState: true });
            }

            const cache = localStorage.getItem("server-list");

            if (cache)
                try {
                    ({ updated, servers } = JSON.parse(cache));
                } catch {}

            if (!servers) load();
        });
    });

    let count = 0;

    $: query,
        showAll,
        (count = 0),
        servers?.forEach((server) => (server.hide = (!showAll && server.notIn) || !fuzzy(server.name, query)) || count++),
        (servers = servers);
</script>

<Header>
    <p class="text-3xl">Manage Your Servers</p>
</Header>

<Container main>
    {#if $page.data.realUser}
        <P><b>Data on this page will not be accurate as the guild list cannot be fetched for an impersonated user without their access token.</b></P>
    {/if}

    <input type="search" class="input text-xl" placeholder="Filter Servers" bind:value={query} />

    {#if servers?.some((x) => x.notIn)}
        <label class="flex items-center gap-2">
            <input type="checkbox" class="checkbox" bind:checked={showAll} />
            <p>Show All Servers</p>
        </label>
    {/if}

    {#if loading || !servers}
        <div class="flex items-center gap-4">
            <Loading size="12" />
            <span class="text-lg text-primary-600 dark:text-primary-300">Loading Servers...</span>
        </div>
    {:else}
        <Button on:click={load}>
            <Icon icon="rotate-right" />
            Refresh Servers
        </Button>
    {/if}

    <p class="text-surface-600 dark:text-surface-200">
        showing {count} server{count === 1 ? "" : "s"} &mdash; last updated: {updated ? new Date(updated).toLocaleString() : "N/A"}
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1">
        {#each servers ?? [] as server}
            {@const level = server.owner ? 0 : BigInt(server.permissions) & 8n ? 1 : BigInt(server.permissions) & 32n ? 2 : !server.notIn ? 3 : 4}
            <a href={server.hasBot ? `/manage/${server.id}` : invite(server.id)} class={server.hide ? "hidden" : ""} target={server.hasBot ? null : "_blank"}>
                <div
                    class="card p-4 grid items-center gap-4 h-24 {server.hasBot ? 'bg-primary-400 dark:bg-primary-600' : 'bg-surface-100 dark:bg-surface-600'}"
                    style="grid-template-columns: max-content 1fr"
                >
                    {#if server.icon}
                        <img src="https://cdn.discordapp.com/icons/{server.id}/{server.icon}.png" alt="Icon" class="w-16 rounded-full" />
                    {:else}
                        <span class="h-16 w-16 grid items-center justify-center bg-surface-300 dark:bg-surface-500 rounded-full">
                            {server.name
                                .split(/\W+/)
                                .map((x) => x[0])
                                .join("")}
                        </span>
                    {/if}
                    <div class="min-w-0 flex flex-col gap-1">
                        <span class="text-xl truncate">
                            {server.name}
                        </span>
                        <span class="text-surface-500 dark:text-surface-300 flex items-center gap-2">
                            {server.hasBot ? "Click to manage" : "Click to invite"}
                            <Icon
                                icon={["crown", "screwdriver-wrench", "gear", "ban", "xmark"][level]}
                                class="text-{['yellow', 'green', 'blue', 'red', 'purple'][level]}-500"
                                title={[
                                    "You own this server.",
                                    "You are an admin of this server.",
                                    "You have permission to manage this server.",
                                    "You have no permissions in this server.",
                                    "You are not in this server.",
                                ][level]}
                            />
                            {#if server.features.includes("COMMUNITY")}
                                <Icon icon="user-group" title="This is a community server." />
                            {/if}
                        </span>
                    </div>
                </div>
            </a>
        {/each}
    </div>
</Container>

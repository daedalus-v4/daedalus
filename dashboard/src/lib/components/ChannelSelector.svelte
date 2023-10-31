<script lang="ts">
    import { page } from "$app/stores";
    import { icons } from "$lib/data";
    import { channelSelectorModalStore } from "$lib/stores";
    import type { TFChannel } from "shared";
    import Button from "./Button.svelte";
    import Icon from "./Icon.svelte";

    export let selected: string[];

    const map: Record<string, TFChannel> = Object.fromEntries($page.data.channels.map((x: TFChannel) => [x.id, x]));
    const indexes: Record<string, number> = {};
    let index = 0;

    function insert(channel: TFChannel) {
        indexes[channel.id] = index++;
        for (const child of channel.children ?? []) insert(child);
    }

    for (const channel of $page.data.rootChannels) insert(channel);

    function open() {
        $channelSelectorModalStore = {
            select(id: string, set: any) {
                if (selected.includes(id)) set((selected = selected.filter((x) => x !== id)));
                else set((selected = [...selected, id].sort((x, y) => indexes[x] - indexes[y])));
            },
            selected,
        };
    }
</script>

<div class="flex flex-wrap gap-3">
    {#each selected as id}
        <span class="badge px-4 text-sm flex rounded outline outline-surface-500 dark:outline-surface-300">
            <button on:click={() => (selected = selected.filter((x) => x !== id))}>
                <Icon icon="circle-xmark" />
            </button>
            <span class="text-surface-600 dark:text-surface-100">
                <Icon icon={icons[map[id]?.type ?? 0]} />
                {map[id]?.name ?? `Invalid Channel: ${id}`}
            </span>
        </span>
    {/each}
    <Button on:click={open}><Icon icon="edit" /></Button>
    <Button variant="error-text" on:click={() => (selected = [])}><Icon icon="xmark" /></Button>
</div>

<script lang="ts">
    import { page } from "$app/stores";
    import { icons } from "$lib/data";
    import { channelSelectorModalStore } from "$lib/stores";
    import type { TFChannel } from "shared";
    import Button from "./Button.svelte";
    import Icon from "./Icon.svelte";

    export let types: number[] | null = null;
    export let selected: string | null;

    const map: Record<string, TFChannel> = Object.fromEntries($page.data.channels.map((x: TFChannel) => [x.id, x]));

    function open() {
        $channelSelectorModalStore = {
            types,
            select(id: string, set: any) {
                if (selected === id) {
                    selected = null;
                    set([]);
                } else set([(selected = id)]);
            },
            selected: selected ? [selected] : [],
        };
    }
</script>

<div class="flex flex-wrap gap-3">
    {#if selected}
        <span class="badge px-4 text-sm flex rounded outline outline-surface-500 dark:outline-surface-300">
            <button on:click={() => (selected = null)}>
                <Icon icon="circle-xmark" />
            </button>
            <span class="text-surface-600 dark:text-surface-100">
                <Icon icon={icons[map[selected]?.type ?? 0]} />
                {map[selected]?.name ?? `Invalid Channel: ${selected}`}
            </span>
        </span>
    {/if}
    <Button on:click={open}><Icon icon="edit" /></Button>
    <Button variant="error-text" on:click={() => (selected = null)}><Icon icon="xmark" /></Button>
</div>

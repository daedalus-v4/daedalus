<script lang="ts">
    import { icons } from "$lib/data";
    import { fuzzy } from "$lib/utils";
    import type { TFChannel } from "shared";
    import Icon from "./Icon.svelte";

    let open: boolean;
    export let channel: TFChannel;
    export let input: string;
    export let pick: (id: string) => any;
    export let selected: string[] | undefined;
    export let defaultOpen: boolean = true;

    const openChildren: Record<string, boolean> = {};
</script>

<div class={fuzzy(channel.name, input) || (channel.children ?? []).some((ch) => fuzzy(ch.name, input)) ? "" : "hidden"}>
    <div class="flex items-center gap-2">
        <button class="px-2 aspect-square {channel.children?.length ? '' : 'opacity-0 pointer-events-none'}" on:click={() => (open = !(open ?? defaultOpen))}>
            <div class="{open ?? defaultOpen ? 'rotate-90' : ''} transition-rotate duration-100">
                <Icon icon="angle-right" />
            </div>
        </button>
        <button
            class="p-1 rounded {selected?.includes(channel.id) ? 'bg-surface-500 text-surface-200 dark:bg-surface-200 dark:text-surface-500' : ''}"
            on:click={() => pick(channel.id)}
        >
            <div class="truncate text-left flex items-center gap-2"><Icon icon={icons[channel.type]} /> {channel.name}</div>
        </button>
    </div>

    {#if open ?? defaultOpen}
        {#each channel.children ?? [] as child}
            <div
                class="flex flex-col gap-1 pl-4 md:pl-6 xl:pl-8 {fuzzy(child.name, input) || (child.children ?? []).some((ch) => fuzzy(ch.name, input))
                    ? ''
                    : 'hidden'}"
            >
                <svelte:self bind:open={openChildren[child.id]} channel={child} {input} {pick} {selected} {defaultOpen} />
            </div>
        {/each}
    {/if}
</div>

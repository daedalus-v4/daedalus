<script lang="ts">
    import { icons } from "$lib/data";
    import { shouldShowChannel } from "$lib/utils";
    import type { TFChannel } from "shared";
    import Icon from "./Icon.svelte";

    let open: boolean;
    export let types: number[] | undefined | null;
    export let channel: TFChannel;
    export let input: string;
    export let pick: (id: string) => any;
    export let selected: string[] | undefined;
    export let defaultOpen: boolean = true;
</script>

<div class="{shouldShowChannel(channel, types, input) ? '' : 'hidden'} flex flex-col gap-1">
    <div class="flex items-center gap-2">
        <button
            class="px-2 aspect-square {(channel.children ?? []).some(
                (x) => (types?.includes(x.type) ?? true) || (x.children ?? []).some((y) => types?.includes(y.type) ?? true),
            )
                ? ''
                : 'opacity-0 pointer-events-none'}"
            on:click={() => (open = !(open ?? defaultOpen))}
        >
            <div class="{open ?? defaultOpen ? 'rotate-90' : ''} transition-rotate duration-100">
                <Icon icon="angle-right" />
            </div>
        </button>
        <button
            class="px-3 py-1 rounded {selected?.includes(channel.id)
                ? 'bg-surface-500 text-surface-200 dark:bg-surface-200 dark:text-surface-500'
                : ''} disabled:bg-surface-300/50 disabled:text-surface-400 disabled:dark:bg-surface-700 disabled:dark:text-surface-300"
            disabled={!(types?.includes(channel.type) ?? true)}
            on:click={() => pick(channel.id)}
        >
            <div class="truncate text-left flex items-center gap-2"><Icon icon={icons[channel.type]} /> {channel.name}</div>
        </button>
    </div>

    {#if open ?? defaultOpen}
        {#each channel.children ?? [] as child}
            <div class="flex flex-col gap-1 pl-4 md:pl-6 xl:pl-8 {shouldShowChannel(child, types, input) ? '' : 'hidden'}">
                <svelte:self {types} channel={child} {input} {pick} {selected} {defaultOpen} />
            </div>
        {/each}
    {/if}
</div>

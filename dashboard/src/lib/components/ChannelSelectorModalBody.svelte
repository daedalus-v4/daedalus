<script lang="ts">
    import { page } from "$app/stores";
    import { getModalStore } from "@skeletonlabs/skeleton";
    import type { TFChannel } from "shared";
    import type { SvelteComponent } from "svelte";
    import Button from "./Button.svelte";
    import ChannelSelectorModalBodyChannel from "./ChannelSelectorModalBodyChannel.svelte";

    export let parent: SvelteComponent;

    const modalStore = getModalStore();
    let { select, selected } = $modalStore[0]?.meta ?? { selected: [] };

    const channels: TFChannel[] = $page.data.rootChannels;
    const open: Record<string, boolean> = {};

    let input: string;

    function pick(id: string) {
        select(id, (x: any) => (selected = x));
    }
</script>

<div class="w-screen mx-[calc(max(5%,50%-640px))]">
    <div class="h-[75vh] p-8 grid grid-rows-[auto_1fr_auto] gap-8 rounded-lg overflow-y-auto bg-surface-300 dark:bg-surface-600">
        <input type="search" class="input" placeholder="Search Channels" bind:value={input} />
        <div class="flex flex-col gap-1 p-4 overflow-y-auto">
            {#each channels as channel}
                <ChannelSelectorModalBodyChannel bind:open={open[channel.id]} {channel} {input} {pick} {selected} />
            {/each}
        </div>
        <div class="flex justify-end">
            <Button on:click={parent.onClose}>{parent.buttonTextCancel}</Button>
        </div>
    </div>
</div>

<script lang="ts">
    import { page } from "$app/stores";
    import { channelSelectorModalStore } from "$lib/stores";
    import type { TFChannel } from "shared";
    import ChannelSelectorModalBodyChannel from "./ChannelSelectorModalBodyChannel.svelte";
    import Modal from "./Modal.svelte";
    import P from "./P.svelte";

    $: _ = $channelSelectorModalStore;

    $: select = _?.select;
    $: selected = _?.selected;

    let channels: TFChannel[];
    $: channels = $page.data.rootChannels ?? [];

    let input: string;

    function pick(id: string) {
        select?.(id, (x: any) => (selected = x));
    }
</script>

<Modal open={!!$channelSelectorModalStore} on:close={() => ($channelSelectorModalStore = null)}>
    <div class="w-[calc(90vw-4rem)] lg:w-[75vw] min-h-[calc(75vh-7rem)] p-8">
        <input type="search" class="input" placeholder="Search Channels" bind:value={input} />
        <P class="pt-4">Click a channel to select/deselect it.</P>
        <div class="flex flex-col gap-1 p-4 overflow-auto">
            {#each channels as channel}
                <ChannelSelectorModalBodyChannel {channel} {input} {pick} selected={selected ?? []} />
            {/each}
        </div>
    </div>
</Modal>

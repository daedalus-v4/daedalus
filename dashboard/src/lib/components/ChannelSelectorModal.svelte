<script lang="ts">
    import { page } from "$app/stores";
    import { channelSelectorModalStore } from "$lib/stores";
    import { shouldShowChannel } from "$lib/utils";
    import type { TFChannel } from "shared";
    import ChannelSelectorModalBodyChannel from "./ChannelSelectorModalBodyChannel.svelte";
    import Modal from "./Modal.svelte";
    import P from "./P.svelte";

    let _: typeof $channelSelectorModalStore;
    $: _ = $channelSelectorModalStore ?? _;

    $: types = _?.types;
    $: select = _?.select;
    $: selected = _?.selected;

    let channels: TFChannel[];
    $: channels = $page.data.rootChannels ?? [];

    let input: string;

    function pick(id: string) {
        select?.(id, (x: any) => (selected = x));
    }
</script>

<Modal max z={80} open={!!$channelSelectorModalStore} on:close={() => ($channelSelectorModalStore = null)}>
    <input type="search" class="input" placeholder="Search Channels" bind:value={input} />
    <P class="pt-4">Click a channel to select/deselect it.</P>
    <div class="flex flex-col gap-1 p-4 overflow-auto">
        {#each channels as channel}
            {#if shouldShowChannel(channel, types, input)}
                <ChannelSelectorModalBodyChannel {types} {channel} {input} {pick} selected={selected ?? []} />
            {/if}
        {/each}
    </div>
</Modal>

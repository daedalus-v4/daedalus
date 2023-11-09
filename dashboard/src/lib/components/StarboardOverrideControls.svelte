<script lang="ts">
    import type { FEStarboardSettings } from "$lib/types";
    import { textlike } from "$lib/utils";
    import { SlideToggle } from "@skeletonlabs/skeleton";
    import type { TFChannel } from "shared";
    import SingleChannelSelector from "./SingleChannelSelector.svelte";

    export let data: FEStarboardSettings;
    export let channel: TFChannel;
</script>

<SlideToggle
    name=""
    size="sm"
    checked={!data.channels[channel.id].disable}
    on:change={() => (data.channels[channel.id].disable = !data.channels[channel.id].disable)}
/>

<SingleChannelSelector types={textlike} bind:selected={data.channels[channel.id].overrideChannel} />

<input type="number" class="input" bind:value={data.channels[channel.id].overrideThreshold} />

<span />

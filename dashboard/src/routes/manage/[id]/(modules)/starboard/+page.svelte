<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import Icon from "$lib/components/Icon.svelte";
    import ModuleSaver from "$lib/components/ModuleSaver.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import SingleChannelSelector from "$lib/components/SingleChannelSelector.svelte";
    import SingleEmojiSelector from "$lib/components/SingleEmojiSelector.svelte";
    import StarboardOverrideControls from "$lib/components/StarboardOverrideControls.svelte";
    import { icons } from "$lib/data";
    import type { FEStarboardSettings } from "$lib/types";
    import { textlike } from "$lib/utils";
    import { CodeBlock } from "@skeletonlabs/skeleton";
    import type { TFChannel } from "shared";

    let base: FEStarboardSettings = $page.data.data;
    let data = browser ? structuredClone(base) : base;

    let channels: TFChannel[] = $page.data.rootChannels;
</script>

<ModuleSaver bind:base bind:data />

<Panel>
    <h3 class="h3">Reaction to Detect</h3>
    <SingleEmojiSelector bind:selected={data.detectEmoji} />
    <h3 class="h3">Default Starboard Channel</h3>
    <SingleChannelSelector types={textlike} bind:selected={data.defaultChannel} />
    <h3 class="h3">Default Threshold</h3>
    <input type="number" class="input" bind:value={data.defaultThreshold} />
</Panel>

<Panel>
    <h3 class="h3">Channel Overrides</h3>
    <div class="grid grid-cols-[auto_auto_auto_auto_1fr] items-center gap-x-4 gap-y-1">
        <b>Channel</b>
        <b>Enabled</b>
        <b>Override Channel</b>
        <b>Override Threshold</b>
        <span />
        {#each channels.filter((ch) => textlike.includes(ch.type) || ch.children?.some((child) => textlike.includes(child.type))) as channel}
            <div class="truncate text-left flex items-center gap-2 pr-4"><Icon icon={icons[channel.type]} /> {channel.name}</div>
            <StarboardOverrideControls bind:data {channel} />
            {#each (channel.children ?? []).filter((ch) => textlike.includes(ch.type)) as child}
                <div class="truncate text-left flex items-center gap-2 pr-4 pl-4 md:pl-6 xl:pl-8"><Icon icon={icons[child.type]} /> {child.name}</div>
                <StarboardOverrideControls bind:data channel={child} />
                {#each (child.children ?? []).filter((ch) => textlike.includes(ch.type)) as thread}
                    <div class="truncate text-left flex items-center gap-2 pr-4 pl-8 md:pl-12 xl:pl-16"><Icon icon={icons[thread.type]} /> {thread.name}</div>
                    <StarboardOverrideControls bind:data channel={thread} />
                {/each}
            {/each}
        {/each}
    </div>
</Panel>

<Panel>
    <CodeBlock language="json" code={JSON.stringify(data, undefined, 4)} />
</Panel>

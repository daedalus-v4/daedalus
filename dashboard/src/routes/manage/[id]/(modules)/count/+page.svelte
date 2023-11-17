<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import Button from "$lib/components/Button.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import Limit from "$lib/components/Limit.svelte";
    import ModuleSaver from "$lib/components/ModuleSaver.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import SingleChannelSelector from "$lib/components/SingleChannelSelector.svelte";
    import type { FECountSettings } from "$lib/types";
    import { textlike, without } from "$lib/utils";
    import { SlideToggle } from "@skeletonlabs/skeleton";

    let base: FECountSettings = $page.data.data;
    let data = browser ? structuredClone(base) : base;
</script>

<ModuleSaver bind:base bind:data />

{#each data.channels as channel, index}
    <Panel>
        <div class="grid grid-cols-[auto_1fr] items-center gap-4">
            <b>Channel:</b>
            <SingleChannelSelector types={textlike} bind:selected={channel.channel} />
            <b>Interval:</b>
            <input type="number" class="input" bind:value={channel.interval} />
            <b>Next Value:</b>
            <input type="number" class="input" bind:value={channel.next} />
            <b>Allow Double-Counting:</b>
            <SlideToggle name="" size="sm" bind:checked={channel.allowDoubleCounting} />
        </div>
        <Button variant="error-text" on:click={() => (data.channels = without(data.channels, index))}><Icon icon="trash" /></Button>
    </Panel>
{/each}

<Limit amount={data.channels.length} key="countCount">
    <div>
        <Button
            variant="primary-text"
            on:click={() => (data.channels = [...data.channels, { id: Math.random(), channel: null, interval: 1, next: 1, allowDoubleCounting: false }])}
        >
            <Icon icon="plus" /> New Count Channel
        </Button>
    </div>
</Limit>

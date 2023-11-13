<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import A from "$lib/components/A.svelte";
    import Button from "$lib/components/Button.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import Limit from "$lib/components/Limit.svelte";
    import ModuleSaver from "$lib/components/ModuleSaver.svelte";
    import P from "$lib/components/P.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import SingleChannelSelector from "$lib/components/SingleChannelSelector.svelte";
    import type { FEStatsChannelsSettings } from "$lib/types";
    import { without } from "$lib/utils";

    let base: FEStatsChannelsSettings = $page.data.data;
    let data = browser ? structuredClone(base) : base;
</script>

<ModuleSaver bind:base bind:data />

<Panel>
    <P>See <A to="/docs/guides/custom-messages" external>the docs</A> for how to format stats channel names.</P>

    {#if data.channels.length > 0}
        <div class="w-full grid grid-cols-[auto_auto_1fr] items-center gap-4">
            {#each data.channels as entry, index}
                <Button variant="error-text-only" on:click={() => (data.channels = without(data.channels, index))}><Icon icon="trash" /></Button>
                <SingleChannelSelector bind:selected={entry.channel} />
                <input type="text" class="input" bind:value={entry.format} />
            {/each}
        </div>
    {/if}

    <Limit amount={data.channels.length} key="statsChannelsCount">
        <Button variant="primary-text" on:click={() => (data.channels = [...data.channels, { channel: null, format: "" }])}>
            <Icon icon="plus" /> Add Stats Channel
        </Button>
    </Limit>
</Panel>

<P class="text-surface-500 dark:text-surface-300">Stats channels are updated every 5 minutes (at :00, :05, :10, etc. each hour).</P>

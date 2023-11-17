<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import Button from "$lib/components/Button.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import Limit from "$lib/components/Limit.svelte";
    import ModuleSaver from "$lib/components/ModuleSaver.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import SingleChannelSelector from "$lib/components/SingleChannelSelector.svelte";
    import type { FERedditFeedsSettings } from "$lib/types";
    import { textlike, without } from "$lib/utils";

    let base: FERedditFeedsSettings = $page.data.data;
    let data = browser ? structuredClone(base) : base;
</script>

<ModuleSaver bind:base bind:data />

{#each data.feeds as feed, index}
    <Panel>
        <div class="grid grid-cols-[auto_1fr] items-center gap-4">
            <b>Subreddit:</b>
            <span class="flex items-center">r/<input type="text" class="input" bind:value={feed.subreddit} /></span>
            <b>Channel:</b>
            <SingleChannelSelector types={textlike} bind:selected={feed.channel} />
        </div>
        <Button variant="error-text" on:click={() => (data.feeds = without(data.feeds, index))}><Icon icon="trash" /></Button>
    </Panel>
{/each}

<Limit amount={data.feeds.length} key="redditFeedsCount">
    <div>
        <Button variant="primary-text" on:click={() => (data.feeds = [...data.feeds, { subreddit: "", channel: null }])}>
            <Icon icon="plus" /> Add Reddit Feed
        </Button>
    </div>
</Limit>

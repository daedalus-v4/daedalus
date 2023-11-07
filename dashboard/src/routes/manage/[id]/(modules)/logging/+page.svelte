<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import Button from "$lib/components/Button.svelte";
    import ChannelSelector from "$lib/components/ChannelSelector.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import Modal from "$lib/components/Modal.svelte";
    import ModuleSaver from "$lib/components/ModuleSaver.svelte";
    import P from "$lib/components/P.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import SingleChannelSelector from "$lib/components/SingleChannelSelector.svelte";
    import { textlike } from "$lib/utils";
    import { SlideToggle } from "@skeletonlabs/skeleton";
    import { logCategories, logEvents } from "shared";

    let base = $page.data.data;
    let data = browser ? structuredClone(base) : base;

    let open: string | null = null;

    let openkey: string = "";
    $: openkey = open ?? openkey;
</script>

<ModuleSaver bind:base bind:data />

<Panel>
    <h3 class="h3">Default Log Output Location</h3>
    <div class="text-lg flex items-center gap-4">
        <SlideToggle name="" size="sm" bind:checked={data.useWebhook} />
        Use Webhook
    </div>
    <div class={data.useWebhook ? "hidden" : ""}>
        <SingleChannelSelector types={textlike} bind:selected={data.defaultChannel} />
    </div>
    <div class="{data.useWebhook ? '' : 'hidden'} w-full">
        <input type="password" class="py-1 input" placeholder="Webhook URL" bind:value={data.defaultWebhook} />
    </div>
    <h3 class="h3">Ignored Channels</h3>
    <ChannelSelector bind:selected={data.ignoredChannels} />
    <h3 class="h3">File-Only Mode</h3>
    <P>
        When enabled, events in the Message Logs category will be ignored if not related to a message containing a file, and edits/deletions will only log
        files. This is suitable for use as a supplement to another logging bot.
    </P>
    <div class="text-lg flex items-center gap-4">
        <SlideToggle name="" size="sm" bind:checked={data.filesOnly} />
        Enable File-Only Mode
    </div>
</Panel>

<Panel>
    <h3 class="h3">Log Categories</h3>
    <div class="hidden md:grid w-full grid-cols-[auto_auto_1fr] items-center gap-4">
        <span />
        <span>Category Name</span>
        <span>Override Output Location</span>
        {#each Object.entries(logCategories) as [key, name]}
            {@const category = data.categories[key]}
            <SlideToggle name="" size="sm" bind:checked={data.categories[key].enabled} />
            <Button class="py-1" on:click={() => (open = key)}><div class="w-full flex items-center gap-2"><Icon icon="edit" /> <b>{name}</b></div></Button>
            <div class="grid grid-cols-[repeat(2,auto)_1fr] items-center gap-4">
                <SlideToggle name="" size="sm" bind:checked={data.categories[key].useWebhook} />
                Use Webhook
                <div class={category.useWebhook ? "hidden" : ""}>
                    <SingleChannelSelector types={textlike} bind:selected={data.categories[key].outputChannel} />
                </div>
                <div class={category.useWebhook ? "" : "hidden"}>
                    <input type="password" class="input py-1" placeholder="Webhook URL" bind:value={data.categories[key].outputWebhook} />
                </div>
            </div>
        {/each}
    </div>
    {#each Object.entries(logCategories) as [key, name], index}
        {@const category = data.categories[key]}
        <Panel class="w-full md:hidden">
            <h4 class="h4">{name}</h4>
            <div class="flex items-center gap-2">
                <SlideToggle name="" size="sm" bind:checked={data.categories[key].enabled} />
                Enable Category
            </div>
            <div class="{category.enabled ? '' : ''} w-full flex flex-col gap-2">
                <div>
                    <Button class="py-1" on:click={() => (open = key)}><div class="flex items-center gap-2"><Icon icon="edit" /> Edit Events</div></Button>
                </div>
            </div>
            <h4 class="h4">Override Output Location</h4>
            <div class="flex items-center gap-2">
                <SlideToggle name="" size="sm" bind:checked={data.categories[key].useWebhook} />
                Use Webhook
            </div>
            <div class={category.useWebhook ? "hidden" : ""}>
                <SingleChannelSelector types={textlike} bind:selected={data.categories[key].outputChannel} />
            </div>
            <div class={category.useWebhook ? "" : "hidden"}>
                <input type="password" class="input py-1" placeholder="Webhook URL" bind:value={data.categories[key].outputWebhook} />
            </div>
        </Panel>
    {/each}
</Panel>

<Modal max open={open !== null} on:close={() => (open = null)}>
    {#if openkey !== null}
        {@const name = logCategories[openkey]}
        {@const category = data.categories[openkey]}
        <h2 class="h2 pb-4">{name}</h2>
        <div class="min-w-[max-content] w-full grid grid-cols-[auto_auto_1fr] items-center gap-4 pr-8">
            <span />
            <span>Event Name</span>
            <span>Override Output Location</span>
            {#each Object.entries(logEvents).filter(([, { category }]) => category === openkey) as [key, { name: ename, category: ckey }]}
                {@const event = category.events[key]}
                <SlideToggle name="" size="sm" bind:checked={data.categories[openkey].events[key].enabled} />
                <b>{ename}</b>
                <div class="grid grid-cols-[repeat(2,auto)_1fr] items-center gap-4">
                    <SlideToggle name="" size="sm" bind:checked={data.categories[openkey].events[key].useWebhook} />
                    Use Webhook
                    <div class={event.useWebhook ? "hidden" : ""}>
                        <SingleChannelSelector types={textlike} bind:selected={data.categories[openkey].events[key].outputChannel} />
                    </div>
                    <div class={event.useWebhook ? "" : "hidden"}>
                        <input type="password" class="input py-1" placeholder="Webhook URL" bind:value={data.categories[openkey].events[key].outputWebhook} />
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</Modal>

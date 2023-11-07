<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import Button from "$lib/components/Button.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import Limit from "$lib/components/Limit.svelte";
    import MessageEditor from "$lib/components/MessageEditor.svelte";
    import ModuleSaver from "$lib/components/ModuleSaver.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import SingleChannelSelector from "$lib/components/SingleChannelSelector.svelte";
    import SingleRoleSelector from "$lib/components/SingleRoleSelector.svelte";
    import { defaultFEMessage } from "$lib/modules/utils";
    import type { FESupporterAnnouncementsSettings } from "$lib/types";
    import { insert, without } from "$lib/utils";
    import { SlideToggle } from "@skeletonlabs/skeleton";

    let base: FESupporterAnnouncementsSettings = $page.data.data;
    let data = browser ? structuredClone(base) : base;

    let limited: boolean;
</script>

<ModuleSaver bind:base bind:data disabled={limited} />

{#each data.entries as entry, index}
    <Panel>
        <div class="w-full flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div class="flex items-center gap-4">
                <b>Detect Role</b>
                <SlideToggle name="" size="sm" bind:checked={entry.boosts} />
                <b>Detect Boosts</b>
            </div>
            <div class="flex items-center gap-4">
                {#if !limited}
                    <Button variant="dim" on:click={() => (data.entries = insert(data.entries, index, structuredClone(entry)))}><Icon icon="clone" /></Button>
                {/if}
                <Button variant="error-text-only" on:click={() => (data.entries = without(data.entries, index))}><Icon icon="trash" /></Button>
            </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-[auto_1fr] items-center gap-4">
            <b class={entry.boosts ? "hidden" : ""}>Role:</b>
            <div class={entry.boosts ? "hidden" : ""}>
                <SingleRoleSelector bind:selected={entry.role} />
            </div>
            <b>Channel:</b>
            <div>
                <SingleChannelSelector bind:selected={entry.channel} />
            </div>
        </div>
        <MessageEditor bind:message={entry.message} />
    </Panel>
{/each}

<Limit bind:limited key="supporterAnnouncementsCount" amount={data.entries.length}>
    <div>
        <Button
            variant="primary-text"
            on:click={() => (data.entries = [...data.entries, { boosts: true, role: null, channel: null, message: defaultFEMessage() }])}
        >
            <Icon icon="plus" /> Add Supporter Announcement
        </Button>
    </div>
</Limit>

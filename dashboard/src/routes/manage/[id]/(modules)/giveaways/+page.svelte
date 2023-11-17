<script lang="ts">
    import { browser } from "$app/environment";
    import { invalidateAll } from "$app/navigation";
    import { page } from "$app/stores";
    import Button from "$lib/components/Button.svelte";
    import DatePicker from "$lib/components/DatePicker.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import MessageEditor from "$lib/components/MessageEditor.svelte";
    import Modal from "$lib/components/Modal.svelte";
    import ModuleSaver from "$lib/components/ModuleSaver.svelte";
    import P from "$lib/components/P.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import RoleSelector from "$lib/components/RoleSelector.svelte";
    import SingleChannelSelector from "$lib/components/SingleChannelSelector.svelte";
    import SingleRoleSelector from "$lib/components/SingleRoleSelector.svelte";
    import { nometa } from "$lib/modules/utils";
    import type { FEGiveawaysSettings } from "$lib/types";
    import { textlike, without } from "$lib/utils";
    import { SlideToggle } from "@skeletonlabs/skeleton";
    import { DurationStyle, formatDuration } from "shared";

    let base: FEGiveawaysSettings = $page.data.data;
    let data = browser ? structuredClone(base) : base;

    let openIndex = -1;
    let open = false;

    $: entry = openIndex === -1 ? data.template : data.giveaways[openIndex];
    $: full = data.giveaways[openIndex];

    let now = Date.now();
    setTimeout(() => ((now = Date.now()), setInterval(() => (now = Date.now()), 1000)), 1000 - (Date.now() % 1000));

    async function reload() {
        await invalidateAll();

        base = $page.data.data;
        data = structuredClone(base);

        if (data.giveaways.some((x) => x.error))
            alert(
                "Posting/editing one or more of your giveaways failed; please check each giveaway's error message for more information. All of your data was saved.",
            );
    }

    let save: () => Promise<void>;
    let saving: boolean;
</script>

<ModuleSaver bind:base bind:data postsave={reload} bind:save bind:saving />

<Panel>
    <Button on:click={() => ((openIndex = -1), (open = true))}><Icon icon="edit" /> Edit Template</Button>
    <div class="grid grid-cols-[auto_auto_1fr] items-center gap-4">
        {#each data.giveaways as entry, index}
            <Button variant="error-text-only" on:click={() => (data.giveaways = without(data.giveaways, index))}><Icon icon="trash" /></Button>
            <Button
                on:click={() => ((openIndex = index), (open = true))}
                class={entry.error
                    ? "outline outline-error-500 dark:outline-error-400"
                    : entry.id < 0 || JSON.stringify(nometa(base.giveaways.find((x) => x.id === entry.id))) !== JSON.stringify(nometa(entry))
                    ? "outline outline-primary-500 dark:outline-primary-400"
                    : ""}
            >
                <Icon icon="edit" />
            </Button>
            <span>{entry.name}</span>
        {/each}
    </div>
    <Button
        variant="primary-text"
        on:click={() =>
            (data.giveaways = [
                ...data.giveaways,
                {
                    id: -Math.floor(Math.random() * 1000000000),
                    name: "New Giveaway",
                    deadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
                    messageId: null,
                    error: null,
                    closed: false,
                    ...data.template,
                },
            ])}
    >
        <Icon icon="plus" /> New Giveaway
    </Button>
</Panel>

<Panel>
    {#if data.giveaways.some((x) => x.error)}
        <P>
            An error occurred the last time reaction roles for this server were saved in one or more prompts. If these were permission errors and you have fixed
            them, click the button below to try again.
        </P>
    {/if}

    <P>If a giveaway prompt is out of date for any reason, click the button below to save again.</P>

    <Button variant="primary-text" disabled={saving} on:click={save}><Icon icon="save" /> Save</Button>
</Panel>

<Modal max bind:open>
    {#if entry}
        {@const creating = openIndex !== -1 && full.id < 0}

        {#if openIndex !== -1}
            {#if full.error}
                <Panel>
                    <h3 class="h3 text-error-500 dark:text-error-400">Error on last attempt to post/edit</h3>
                    <P>{full.error}</P>
                </Panel>
            {/if}

            <Panel>
                <h3 class="h3">{creating ? "Creating New Giveaway" : `Editing Giveaway #${full.id}`}</h3>
                <b>Name (for display on dashboard)</b>
                <input type="text" class="input" bind:value={full.name} />
            </Panel>
        {/if}
        <Panel>
            <h3 class="h3">Giveaway Display</h3>
            <div class="flex items-center gap-4">
                <b>Channel:</b>
                <SingleChannelSelector types={textlike} bind:selected={entry.channel} />
            </div>
            <MessageEditor static bind:message={entry.message} />
        </Panel>
        <Panel>
            <h3 class="h3">Restrictions</h3>
            <h4 class="h4">Required Roles</h4>
            <RoleSelector showEveryone showHigher showManaged bind:selected={entry.requiredRoles} />
            <div class="flex items-center gap-4">
                <span>User Has Any</span>
                <SlideToggle name="" size="sm" bind:checked={entry.requiredRolesAll} />
                <span>User Has All</span>
            </div>
            <h4 class="h4">Blocked Roles</h4>
            <RoleSelector showEveryone showHigher showManaged bind:selected={entry.blockedRoles} />
            <div class="flex items-center gap-4">
                <span>User Has Any</span>
                <SlideToggle name="" size="sm" bind:checked={entry.blockedRolesAll} />
                <span>User Has All</span>
            </div>
            <h4 class="h4">Bypass Roles</h4>
            <RoleSelector showEveryone showHigher showManaged bind:selected={entry.bypassRoles} />
            <div class="flex items-center gap-4">
                <span>User Has Any</span>
                <SlideToggle name="" size="sm" bind:checked={entry.bypassRolesAll} />
                <span>User Has All</span>
            </div>
        </Panel>
        <Panel>
            <h3 class="h3">Weights (Entries / Role)</h3>
            <div class="flex items-center gap-4">
                <SlideToggle name="" size="sm" bind:checked={entry.stackWeights} />
                <b>Stack Bonus Entries</b>
            </div>
            <div class="grid grid-cols-[auto_auto_1fr] items-center gap-4">
                {#each entry.weights as row, index}
                    <Button variant="error-text-only" on:click={() => (entry.weights.splice(index, 1), (data = data))}>
                        <Icon icon="trash" />
                    </Button>
                    <SingleRoleSelector showEveryone showHigher showManaged bind:selected={row.role} />
                    <input type="number" class="input" bind:value={row.weight} min={1} />
                {/each}
            </div>
            <Button variant="primary-text" on:click={() => (entry.weights.push({ role: null, weight: 1 }), (data = data))}>
                <Icon icon="plus" /> Add Weight
            </Button>
        </Panel>
        <Panel>
            <h3 class="h3">Winning</h3>
            <div class="flex items-center gap-4">
                <b>Winners:</b>
                <input type="number" class="input" bind:value={entry.winners} />
            </div>
            <div class="flex items-center gap-4">
                <SlideToggle name="" size="sm" bind:checked={entry.allowRepeatWinners} />
                <b>Allow Winning Multiple Times</b>
            </div>
        </Panel>
        {#if openIndex !== -1}
            <Panel>
                <h3 class="h3">Deadline</h3>
                <DatePicker bind:timestamp={full.deadline} />
                (in {formatDuration(full.deadline - now, DurationStyle.Blank)})
            </Panel>
        {/if}
    {/if}
</Modal>

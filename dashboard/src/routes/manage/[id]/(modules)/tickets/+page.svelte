<script lang="ts">
    import { browser } from "$app/environment";
    import { invalidateAll } from "$app/navigation";
    import { page } from "$app/stores";
    import Button from "$lib/components/Button.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import Limit from "$lib/components/Limit.svelte";
    import MessageEditor from "$lib/components/MessageEditor.svelte";
    import Modal from "$lib/components/Modal.svelte";
    import ModuleSaver from "$lib/components/ModuleSaver.svelte";
    import P from "$lib/components/P.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import SingleChannelSelector from "$lib/components/SingleChannelSelector.svelte";
    import TicketTargetEditor from "$lib/components/TicketTargetEditor.svelte";
    import { defaultFEMessage, nometa } from "$lib/modules/utils";
    import type { FETicketsSettings } from "$lib/types";
    import { insert, textlike, without } from "$lib/utils";
    import { SlideToggle } from "@skeletonlabs/skeleton";

    let base: FETicketsSettings = $page.data.data;
    let data = browser ? structuredClone(base) : base;

    let allowMulti = $page.data.premium.multiTickets;

    let openIndex = 0;
    let open = false;

    $: entry = data.prompts[openIndex];

    let openTargetIndex = 0;
    let openTarget = false;

    $: target = entry?.targets[openTargetIndex];

    let limited: boolean;

    async function reload() {
        await invalidateAll();

        base = $page.data.data;
        data = structuredClone(base);

        if (data.prompts.some((x) => x.error))
            alert(
                "Posting/editing one or more of your prompts failed; please check each prompt's error message for more information. All of your data was saved.",
            );
    }

    let save: () => Promise<void>;
    let saving: boolean;

    $: entry &&
        !entry.multi &&
        entry.targets.length === 0 &&
        (entry.targets = [
            {
                id: Math.random(),
                name: "Default Target",
                description: "Replace/remove this description.",
                logChannel: null,
                category: null,
                accessRoles: [],
                buttonColor: "gray",
                emoji: null,
                label: "Open Ticket",
                pingRoles: [],
                pingHere: false,
                postCustomOpenMessage: false,
                customOpenMessage: defaultFEMessage(),
            },
        ]);
</script>

<ModuleSaver bind:base bind:data postsave={reload} bind:save bind:saving />

<Panel>
    <h3 class="h3">Tickets</h3>

    <div class="grid grid-cols-[auto_1fr] items-center gap-4">
        {#each data.prompts as entry, index}
            <b>{entry.name}</b>
            <span class="flex items-center gap-1">
                <Button
                    on:click={() => ((openIndex = index), (open = true))}
                    class={entry.error
                        ? "outline outline-error-500 dark:outline-error-400"
                        : entry.id < 0 || JSON.stringify(nometa(base.prompts.find((x) => x.id === entry.id))) !== JSON.stringify(nometa(entry))
                        ? "outline outline-primary-500 dark:outline-primary-400"
                        : ""}
                >
                    <Icon icon="edit" />
                </Button>
                {#if !limited}
                    <Button
                        variant="soft-text-only"
                        on:click={() =>
                            (data.prompts = insert(data.prompts, index + 1, {
                                ...structuredClone(entry),
                                id: -Math.floor(Math.random() * 1000000000),
                                name: "New Ticket Prompt",
                            }))}
                    >
                        <Icon icon="clone" />
                    </Button>
                {/if}
                <Button on:click={() => (data.prompts = without(data.prompts, index))} variant="error-text-only"><Icon icon="trash" /></Button>
                {#if entry.error}
                    <span class="text-error-500 dark:text-error-400 hidden md:block">
                        Posting/editing this prompt resulted in an error. Open the editor to view the error message.
                    </span>
                {/if}
            </span>
        {/each}
    </div>

    <Limit amount={data.prompts.length} key="ticketPromptCount" bind:limited>
        <Button
            variant="primary-text"
            on:click={() =>
                (data.prompts = [
                    ...data.prompts,
                    {
                        id: -Math.floor(Math.random() * 1000000000),
                        name: "New Ticket Prompt",
                        channel: null,
                        message: null,
                        prompt: defaultFEMessage(),
                        multi: false,
                        targets: [
                            {
                                id: Math.random(),
                                name: "Default Target",
                                description: "Replace/remove this description.",
                                logChannel: null,
                                category: null,
                                accessRoles: [],
                                buttonColor: "gray",
                                emoji: null,
                                label: "Open Ticket",
                                pingRoles: [],
                                pingHere: false,
                                postCustomOpenMessage: false,
                                customOpenMessage: defaultFEMessage(),
                            },
                        ],
                        error: null,
                    },
                ])}
        >
            <Icon icon="plus" /> Create Ticket Prompt
        </Button>
    </Limit>
</Panel>

<Panel>
    {#if data.prompts.some((x) => x.error)}
        <P>
            An error occurred the last time reaction roles for this server were saved in one or more prompts. If these were permission errors and you have fixed
            them, click the button below to try again.
        </P>
    {/if}

    <P>
        If a ticket prompt is out of date for any reason or you recently upgraded your premium plan and want to restore ticket prompts, click the button below
        to save again.
    </P>

    <Button variant="primary-text" disabled={saving} on:click={save}><Icon icon="save" /> Save</Button>
</Panel>

<Modal max bind:open>
    {#if entry}
        {@const creating = entry.id < 0}

        {#if entry.error}
            <Panel>
                <h3 class="h3 text-error-500 dark:text-error-400">Error on last attempt to post/edit</h3>
                <P>{entry.error}</P>
            </Panel>
        {/if}

        <Panel>
            <h3 class="h3">{creating ? "Creating New Ticket Prompt" : `Editing Ticket Prompt #${entry.id}`}</h3>
            <b>Name (for display on dashboard)</b>
            <input type="text" class="input" bind:value={entry.name} />
            <span class="flex items-center gap-4">
                <b>Channel:</b>
                <SingleChannelSelector types={textlike} bind:selected={entry.channel} />
            </span>
        </Panel>

        {#if allowMulti}
            <Panel>
                <h3 class="h3">Multi-Target Tickets</h3>
                <P>
                    This server has access to the <b>multi-target tickets</b> feature. While enabled, you will be able to specify multiple ticket targets in one
                    prompt. For example, you can allow users to create tickets with mods or admins within the same prompt.
                </P>
                <P>
                    If you enable this setting but only set up one target, it will act the same as if the setting were off, and if you set up no targets, you
                    will get an error.
                </P>
                <div class="flex items-center gap-4">
                    <SlideToggle name="" size="sm" bind:checked={entry.multi} />
                    <b>Use Multi-Target</b>
                </div>
            </Panel>
        {/if}

        {#if allowMulti && entry.multi}
            <Panel>
                {#each entry.targets as target, index}
                    <div class="flex items-center gap-4">
                        <Button variant="error-text-only" on:click={() => (entry.targets = without(entry.targets, index))}><Icon icon="trash" /></Button>
                        <Button on:click={() => ((openTargetIndex = index), (openTarget = true))}><Icon icon="edit" /></Button>
                        {target.name}
                    </div>
                {/each}

                <Limit amount={entry.targets.length} key="ticketTargetCount">
                    <Button
                        variant="primary-text"
                        on:click={() =>
                            (entry.targets = [
                                ...entry.targets,
                                {
                                    id: Math.random(),
                                    name: "New Ticket Target",
                                    description: "",
                                    logChannel: null,
                                    category: null,
                                    accessRoles: [],
                                    buttonColor: "gray",
                                    emoji: null,
                                    label: "",
                                    pingRoles: [],
                                    pingHere: false,
                                    postCustomOpenMessage: false,
                                    customOpenMessage: defaultFEMessage(),
                                },
                            ])}
                    >
                        <Icon icon="plus" /> Add Target
                    </Button>
                </Limit>
            </Panel>
        {:else}
            <TicketTargetEditor multi={false} bind:data={entry.targets[0]} />
        {/if}

        <Panel>
            <h3 class="h3">Prompt Message</h3>
            <MessageEditor static label="Edit Ticket Prompt Message" bind:message={entry.prompt} />
        </Panel>
    {/if}
</Modal>

<Modal max z={60} bind:open={openTarget}>
    {#if target}
        <TicketTargetEditor multi bind:data={target} />
    {/if}
</Modal>

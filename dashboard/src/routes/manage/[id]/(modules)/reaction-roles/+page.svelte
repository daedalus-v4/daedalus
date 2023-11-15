<script lang="ts">
    import { browser } from "$app/environment";
    import { invalidateAll } from "$app/navigation";
    import { page } from "$app/stores";
    import Button from "$lib/components/Button.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import Limit from "$lib/components/Limit.svelte";
    import ListControlRow from "$lib/components/ListControlRow.svelte";
    import MessageEditor from "$lib/components/MessageEditor.svelte";
    import Modal from "$lib/components/Modal.svelte";
    import ModuleSaver from "$lib/components/ModuleSaver.svelte";
    import P from "$lib/components/P.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import SingleChannelSelector from "$lib/components/SingleChannelSelector.svelte";
    import SingleEmojiSelector from "$lib/components/SingleEmojiSelector.svelte";
    import SingleRoleSelector from "$lib/components/SingleRoleSelector.svelte";
    import { defaultFEMessage, nometa } from "$lib/modules/utils";
    import type { FEReactionRolesSettings } from "$lib/types";
    import { insert, textlike, without } from "$lib/utils";
    import { SlideToggle } from "@skeletonlabs/skeleton";

    let base: FEReactionRolesSettings = $page.data.data;
    let data = browser ? structuredClone(base) : base;

    let openIndex = 0;
    let open = false;

    $: entry = data.entries[openIndex];

    let limited: boolean;

    async function reload() {
        await invalidateAll();

        base = $page.data.data;
        data = structuredClone(base);

        if (data.entries.some((x) => x.error))
            alert(
                "Posting/editing one or more of your prompts failed; please check each prompt's error message for more information. All of your data was saved.",
            );
    }

    let save: () => Promise<void>;
    let saving: boolean;
</script>

<ModuleSaver bind:base bind:data postsave={reload} bind:save bind:saving />

<Panel>
    <h3 class="h3">Reaction Roles</h3>

    <div class="grid grid-cols-[auto_1fr] items-center gap-4">
        {#each data.entries as entry, index}
            <b>{entry.name}</b>
            <span class="flex items-center gap-1">
                <Button
                    on:click={() => ((openIndex = index), (open = true))}
                    class={entry.error
                        ? "outline outline-error-500 dark:outline-error-400"
                        : entry.id < 0 || JSON.stringify(nometa(base.entries.find((x) => x.id === entry.id))) !== JSON.stringify(nometa(entry))
                        ? "outline outline-primary-500 dark:outline-primary-400"
                        : ""}
                >
                    <Icon icon="edit" />
                </Button>
                {#if !limited}
                    <Button
                        variant="soft-text-only"
                        on:click={() =>
                            (data.entries = insert(data.entries, index + 1, {
                                ...structuredClone(entry),
                                id: -Math.floor(Math.random() * 1000000000),
                                name: "New Reaction Role Prompt",
                            }))}
                    >
                        <Icon icon="clone" />
                    </Button>
                {/if}
                <Button on:click={() => (data.entries = without(data.entries, index))} variant="error-text-only"><Icon icon="trash" /></Button>
                {#if entry.error}
                    <span class="text-error-500 dark:text-error-400 hidden md:block">
                        Posting/editing this prompt resulted in an error. Open the editor to view the error message.
                    </span>
                {/if}
            </span>
        {/each}
    </div>

    <Limit amount={data.entries.length} key="reactionRolesCount" bind:limited>
        <Button
            variant="primary-text"
            on:click={() =>
                (data.entries = [
                    ...data.entries,
                    {
                        id: -Math.floor(Math.random() * 1000000000),
                        name: "New Reaction Role Prompt",
                        addReactionsToExistingMessage: false,
                        channel: null,
                        message: null,
                        url: "",
                        style: "dropdown",
                        type: "normal",
                        dropdownData: [],
                        buttonData: [],
                        reactionData: [],
                        promptMessage: defaultFEMessage(),
                        error: null,
                    },
                ])}
        >
            <Icon icon="plus" /> Create Prompt
        </Button>
    </Limit>
</Panel>

<Panel>
    {#if data.entries.some((x) => x.error)}
        <P>
            An error occurred the last time reaction roles for this server were saved in one or more prompts. If these were permission errors and you have fixed
            them, click the button below to try again.
        </P>
    {/if}

    <P>If a reaction role prompt is out of date for any reason, click the button below to save again.</P>

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
            <h3 class="h3">{creating ? "Creating New Prompt" : `Editing Prompt #${entry.id}`}</h3>
            <b>Name (for display on dashboard)</b>
            <input type="text" class="input" bind:value={entry.name} />
        </Panel>

        <Panel>
            <span class="flex items-center gap-4">
                <SlideToggle name="" size="sm" disabled={!creating} bind:checked={entry.addReactionsToExistingMessage} />
                <b>Add reactions to existing message</b>
            </span>
            <div class="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
                {#if entry.addReactionsToExistingMessage}
                    <b>Message URL:</b>
                    <input type="text" class="input py-1" readonly={!creating} bind:value={entry.url} />
                {:else}
                    <b>Channel:</b>
                    <SingleChannelSelector types={textlike} bind:selected={entry.channel} />
                    <b>Style:</b>
                    <div class="flex">
                        <div>
                            <select class="select" bind:value={entry.style}>
                                <option value="dropdown">Dropdown Menu</option>
                                <option value="buttons">Buttons</option>
                                <option value="reactions">Reactions</option>
                            </select>
                        </div>
                    </div>
                {/if}
                <b>Type:</b>
                <div class="flex">
                    <div>
                        <select class="select" bind:value={entry.type}>
                            <option value="normal">Normal</option>
                            <option value="unique">Unique</option>
                            <option value="verify">Verify</option>
                            <option value="lock">Lock</option>
                        </select>
                    </div>
                </div>
            </div>
        </Panel>

        <Panel class="{!entry.addReactionsToExistingMessage && entry.style === 'dropdown' ? '' : 'hidden'} w-full overflow-x-auto">
            <h3 class="h3">Dropdown Options</h3>
            {#each entry.dropdownData as option, index}
                {#if entry.dropdownData.length < 25}
                    <Button
                        variant="primary-text"
                        on:click={() => (entry.dropdownData = insert(entry.dropdownData, index, { emoji: null, role: null, label: "", description: "" }))}
                    >
                        <Icon icon="plus" /> Add Option
                    </Button>
                {/if}
                <Panel class="min-w-[max-content] w-full">
                    <div class="w-full flex items-center justify-between gap-8">
                        <div class="flex items-center gap-4">
                            <b>Emoji:</b>
                            <SingleEmojiSelector bind:selected={option.emoji} />
                            <span class="divider-vertical h-8" />
                            <b>Role:</b>
                            <SingleRoleSelector bind:selected={option.role} />
                        </div>
                        <ListControlRow bind:array={entry.dropdownData} {index} limit={25} />
                    </div>
                    <div class="w-full grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
                        <b>Label:</b>
                        <input type="text" class="input" maxlength={100} bind:value={option.label} />
                        <b>Description:</b>
                        <input type="text" class="input" maxlength={100} bind:value={option.description} />
                    </div>
                </Panel>
            {/each}
            {#if entry.dropdownData.length < 25}
                <Button
                    variant="primary-text"
                    on:click={() => (entry.dropdownData = [...entry.dropdownData, { emoji: null, role: null, label: "", description: "" }])}
                >
                    <Icon icon="plus" /> Add Option
                </Button>
            {/if}
        </Panel>

        <Panel class="{!entry.addReactionsToExistingMessage && entry.style === 'buttons' ? '' : 'hidden'} w-full overflow-x-auto">
            <h3 class="h3">Button Options</h3>
            {#each entry.buttonData as row, rowIndex}
                {#if entry.buttonData.length < 5}
                    <Button variant="primary-text" on:click={() => (entry.buttonData = insert(entry.buttonData, rowIndex, []))}>
                        <Icon icon="plus" /> Add Row
                    </Button>
                {/if}
                <Panel class="min-w-[max-content] w-full">
                    <div class="w-full flex items-center justify-between">
                        <h4 class="h4">Row {rowIndex + 1}</h4>
                        <ListControlRow bind:array={entry.buttonData} index={rowIndex} limit={5} />
                    </div>
                    {#each row as option, index}
                        {#if row.length < 5}
                            <Button variant="primary-text" on:click={() => (row = insert(row, index, { emoji: null, role: null, color: "gray", label: "" }))}>
                                <Icon icon="plus" /> Add Button
                            </Button>
                        {/if}
                        <Panel class="w-full">
                            <div class="w-full grid grid-cols-[1fr_auto] items-center gap-8">
                                <div class="w-[max-content] flex items-center gap-4">
                                    <b>Emoji:</b>
                                    <SingleEmojiSelector bind:selected={option.emoji} />
                                    <span class="divider-vertical h-8" />
                                    <b>Role:</b>
                                    <SingleRoleSelector bind:selected={option.role} />
                                    <span class="divider-vertical h-8" />
                                    <b>Color:</b>
                                    <div>
                                        <select class="select" bind:value={option.color}>
                                            <option value="gray">Gray</option>
                                            <option value="blue">Blue</option>
                                            <option value="green">Green</option>
                                            <option value="red">Red</option>
                                        </select>
                                    </div>
                                </div>
                                <ListControlRow bind:array={row} {index} limit={5} />
                            </div>
                            <div class="w-full flex items-center gap-4">
                                <b>Label:</b>
                                <input type="text" class="input" bind:value={option.label} />
                            </div>
                        </Panel>
                    {/each}
                    {#if row.length < 5}
                        <Button variant="primary-text" on:click={() => (row = [...row, { emoji: null, role: null, color: "gray", label: "" }])}>
                            <Icon icon="plus" /> Add Button
                        </Button>
                    {/if}
                </Panel>
            {/each}
            {#if entry.buttonData.length < 5}
                <Button variant="primary-text" on:click={() => (entry.buttonData = [...entry.buttonData, []])}>
                    <Icon icon="plus" /> Add Row
                </Button>
            {/if}
        </Panel>

        <Panel class="{entry.addReactionsToExistingMessage || entry.style === 'reactions' ? '' : 'hidden'} w-full overflow-x-auto">
            <h3 class="h3">Reaction Options</h3>
            {#each entry.reactionData as option, index}
                {#if entry.reactionData.length < 20}
                    <Button variant="primary-text" on:click={() => (entry.reactionData = insert(entry.reactionData, index, { emoji: null, role: null }))}>
                        <Icon icon="plus" /> Add Reaction
                    </Button>
                {/if}
                <Panel class="min-w-[max-content] w-full">
                    <div class="w-full grid grid-cols-[1fr_auto] items-center gap-8">
                        <div class="w-[max-content] flex items-center gap-4">
                            <b>Emoji:</b>
                            <SingleEmojiSelector bind:selected={option.emoji} />
                            <span class="divider-vertical h-8" />
                            <b>Role:</b>
                            <SingleRoleSelector bind:selected={option.role} />
                        </div>
                        <ListControlRow bind:array={entry.reactionData} {index} limit={20} />
                    </div>
                </Panel>
            {/each}
            {#if entry.reactionData.length < 20}
                <Button variant="primary-text" on:click={() => (entry.reactionData = [...entry.reactionData, { emoji: null, role: null }])}>
                    <Icon icon="plus" /> Add Reaction
                </Button>
            {/if}
        </Panel>

        <Panel class={entry.addReactionsToExistingMessage ? "hidden" : ""}>
            <MessageEditor label="Edit Prompt Message" static bind:message={entry.promptMessage} />
        </Panel>
    {/if}
</Modal>

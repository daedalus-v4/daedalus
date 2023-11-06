<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import Button from "$lib/components/Button.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import Limit from "$lib/components/Limit.svelte";
    import Modal from "$lib/components/Modal.svelte";
    import ModuleSaver from "$lib/components/ModuleSaver.svelte";
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
</script>

<ModuleSaver bind:base bind:data />

<Panel>
    <h3 class="h3">Reaction Roles</h3>

    {#each data.entries as entry, index}
        <div class="grid grid-cols-[auto_1fr] items-center gap-4">
            <b>{entry.name}</b>
            <span class="flex items-center gap-1">
                <Button
                    on:click={() => ((openIndex = index), (open = true))}
                    class={entry.id < 0 || JSON.stringify(nometa(base.entries.find((x) => x.id === entry.id))) !== JSON.stringify(nometa(entry))
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
            </span>
        </div>
    {/each}

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
                        style: "dropdown",
                        type: "normal",
                        dropdownData: [],
                        buttonData: [],
                        reactionData: [],
                        promptMessage: defaultFEMessage(),
                    },
                ])}
        >
            <Icon icon="plus" /> Create Prompt
        </Button>
    </Limit>
</Panel>

<Modal max bind:open>
    {#if entry}
        {@const creating = entry.id < 0}

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
                    <input type="text" class="input py-1" readonly={!creating} bind:value={entry.message} />
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

        <Panel class={!entry.addReactionsToExistingMessage && entry.style === "dropdown" ? "" : "hidden"}>
            <h3 class="h3">Dropdown Options</h3>
            {#each entry.dropdownData as option, index}
                <Button
                    variant="primary-text"
                    on:click={() => (entry.dropdownData = insert(entry.dropdownData, index, { emoji: null, role: null, label: "", description: "" }))}
                >
                    <Icon icon="plus" /> Add Option
                </Button>
                <Panel class="w-full">
                    <div class="w-full flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <b>Emoji:</b>
                            <SingleEmojiSelector bind:selected={option.emoji} />
                            <span class="divider-vertical h-8" />
                            <b>Role:</b>
                            <SingleRoleSelector bind:selected={option.role} />
                        </div>
                        <div class="flex items-center gap-4">
                            {#if entry.dropdownData.length < 25}
                                <button
                                    class="p-2 text-surface-500 dark:text-surface-300"
                                    on:click={() => (entry.dropdownData = insert(entry.dropdownData, index, structuredClone(option)))}
                                >
                                    <Icon icon="clone" />
                                </button>
                            {/if}
                            <button class="p-2 text-error-400" on:click={() => (entry.dropdownData = without(entry.dropdownData, index))}>
                                <Icon icon="trash" />
                            </button>
                        </div>
                    </div>
                    <div class="w-full grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
                        <b>Label:</b>
                        <input type="text" class="input" bind:value={option.label} />
                        <b>Description:</b>
                        <input type="text" class="input" bind:value={option.description} />
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
    {/if}
</Modal>

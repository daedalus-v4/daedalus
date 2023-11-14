<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import A from "$lib/components/A.svelte";
    import Button from "$lib/components/Button.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import Limit from "$lib/components/Limit.svelte";
    import Modal from "$lib/components/Modal.svelte";
    import ModmailTargetEditor from "$lib/components/ModmailTargetEditor.svelte";
    import ModuleSaver from "$lib/components/ModuleSaver.svelte";
    import P from "$lib/components/P.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import type { FEModmailSettings } from "$lib/types";
    import { without } from "$lib/utils";
    import { SlideToggle } from "@skeletonlabs/skeleton";

    let base: FEModmailSettings = $page.data.data;
    let data = browser ? structuredClone(base) : base;

    let allowMulti = $page.data.premium.multiModmail;

    let openIndex = 0;
    let open = false;

    $: target = data.targets[openIndex];
    $: !data.multi &&
        data.targets.length === 0 &&
        (data.targets = [
            {
                id: Math.random(),
                name: "Default Target",
                description: "Replace/remove this description.",
                emoji: null,
                logChannel: null,
                category: null,
                pingRoles: [],
                pingHere: false,
                useThreads: true,
                accessRoles: [],
                openMessage: "",
                closeMessage: "",
            },
        ]);
</script>

<ModuleSaver bind:base bind:data />

{#if allowMulti}
    <Panel>
        <h3 class="h3">Multi-Modmail</h3>
        <P>
            This server has access to the <b>multi-modmail</b> feature. While enabled, you can set up multiple modmail targets and users will be able to choose which
            one they will use when sending a message.
        </P>
        <P>If you enable this setting but only set up one modmail target, it will act the same as if the setting were off.</P>
        <div class="flex items-center gap-4">
            <SlideToggle name="" size="sm" bind:checked={data.multi} />
        </div>
    </Panel>
{/if}

{#if allowMulti && data.multi}
    <Panel>
        {#each data.targets as target, index}
            <div class="flex items-center gap-4">
                <Button variant="error-text-only" on:click={() => (data.targets = without(data.targets, index))}><Icon icon="trash" /></Button>
                <Button on:click={() => ((openIndex = index), (open = true))}><Icon icon="edit" /></Button>
                {target.name}
            </div>
        {/each}
        <Limit amount={data.targets.length} key="modmailTargetCount">
            <Button
                variant="primary-text"
                on:click={() =>
                    (data.targets = [
                        ...data.targets,
                        {
                            id: Math.random(),
                            name: "New Modmail Target",
                            description: "",
                            emoji: null,
                            logChannel: null,
                            category: null,
                            pingRoles: [],
                            pingHere: false,
                            useThreads: true,
                            accessRoles: [],
                            openMessage: "",
                            closeMessage: "",
                        },
                    ])}
            >
                <Icon icon="plus" /> Add Modmail Target
            </Button>
        </Limit>
    </Panel>
{:else}
    <ModmailTargetEditor multi={false} bind:data={data.targets[0]} />
{/if}

<Panel>
    <h3 class="h3">Snippets</h3>
    <P>
        Modmail snippets let you define standard messages / templates that mods can use when responding. Mods will be able to send a snippet directly or use it
        as a starting point and edit the message before sending.
    </P>
    <P>Snippets can use custom message syntax. See <A to="/docs/guides/custom-messages" external>the docs</A> for more info.</P>
    {#each data.snippets as snippet}
        <Panel class="w-full">
            <b>Name</b>
            <input type="text" class="input" bind:value={snippet.name} />
            <b>Content</b>
            <textarea rows={2} class="textarea" bind:value={snippet.content} />
        </Panel>
    {/each}
    {#if data.snippets.length < 25}
        <Button variant="primary-text" on:click={() => (data.snippets = [...data.snippets, { name: "", content: "" }])}>
            <Icon icon="plus" /> Add Snippet
        </Button>
    {/if}
</Panel>

<Modal max bind:open>
    {#if target}
        <ModmailTargetEditor multi bind:data={target} />
    {/if}
</Modal>

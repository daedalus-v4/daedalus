<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import Button from "$lib/components/Button.svelte";
    import ChannelSelector from "$lib/components/ChannelSelector.svelte";
    import Debug from "$lib/components/Debug.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import Limit from "$lib/components/Limit.svelte";
    import MessageEditor from "$lib/components/MessageEditor.svelte";
    import Modal from "$lib/components/Modal.svelte";
    import ModuleSaver from "$lib/components/ModuleSaver.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import RoleSelector from "$lib/components/RoleSelector.svelte";
    import SingleEmojiSelector from "$lib/components/SingleEmojiSelector.svelte";
    import { defaultFEMessage } from "$lib/modules/utils";
    import type { FEAutoresponderSettings } from "$lib/types";
    import { textlikeAndParents, without } from "$lib/utils";
    import { SlideToggle } from "@skeletonlabs/skeleton";

    let base: FEAutoresponderSettings = $page.data.data;
    let data = browser ? structuredClone(base) : base;

    let openIndex = 0;
    let open = false;

    $: trigger = data.triggers[openIndex];
</script>

<ModuleSaver bind:base bind:data />

<Panel>
    <h3 class="h3">Restrictions</h3>
    <div class="flex items-center gap-4">
        <SlideToggle name="" size="sm" bind:checked={data.onlyInAllowedChannels} />
        <span><b>Only respond in allowed channels</b> (can be overridden)</span>
    </div>
    <div class="flex items-center gap-4">
        <SlideToggle name="" size="sm" bind:checked={data.onlyToAllowedRoles} />
        <span><b>Only respond to allowed roles</b> (can be overridden)</span>
    </div>
    <div class="grid grid-cols-[auto_1fr] items-center gap-4">
        <b>Allowed Channels:</b>
        <ChannelSelector types={textlikeAndParents} bind:selected={data.allowedChannels} />
        <b>Allowed Roles:</b>
        <RoleSelector showEveryone showHigher showManaged bind:selected={data.allowedRoles} />
        <b>Blocked Channels:</b>
        <ChannelSelector types={textlikeAndParents} bind:selected={data.blockedChannels} />
        <b>Blocked Roles:</b>
        <RoleSelector showEveryone showHigher showManaged bind:selected={data.blockedRoles} />
    </div>
</Panel>

<Panel>
    <h3 class="h3">Triggers</h3>
    {#if data.triggers.length > 0}
        <div class="grid grid-cols-[repeat(4,auto)] items-center gap-4">
            {#each data.triggers as trigger, index}
                <Button variant="error-text-only" on:click={() => (data.triggers = without(data.triggers, index))}><Icon icon="trash" /></Button>
                <Button on:click={() => ((openIndex = index), (open = true))}><Icon icon="edit" /></Button>
                <SlideToggle name="" size="sm" bind:checked={trigger.enabled} />
                {trigger.match}
            {/each}
        </div>
    {/if}
    <Limit amount={data.triggers.length} key="autoresponderCount">
        <Button
            variant="primary-text"
            on:click={() =>
                (data.triggers = [
                    ...data.triggers,
                    {
                        enabled: true,
                        match: "",
                        wildcard: false,
                        caseInsensitive: true,
                        respondToBotsAndWebhooks: false,
                        replyMode: "normal",
                        reaction: null,
                        message: defaultFEMessage(),
                        bypassDefaultChannelSettings: false,
                        bypassDefaultRoleSettings: false,
                        onlyInAllowedChannels: false,
                        onlyToAllowedRoles: false,
                        allowedChannels: [],
                        allowedRoles: [],
                        blockedChannels: [],
                        blockedRoles: [],
                    },
                ])}
        >
            <Icon icon="plus" /> Add Autoresponder Trigger
        </Button>
    </Limit>
</Panel>

<Modal max bind:open>
    {#if trigger}
        <Panel>
            <h3 class="h3">Match Configuration</h3>
            <div class="w-full flex items-center gap-4">
                <b class="sm:whitespace-nowrap">Match Text:</b>
                <input type="text" class="input" bind:value={trigger.match} />
            </div>
            <div class="flex flex-wrap items-center gap-4">
                <SlideToggle name="" size="sm" bind:checked={trigger.wildcard} />
                <span><b>Wildcard</b> (allow partial matches)</span>
                <SlideToggle name="" size="sm" bind:checked={trigger.caseInsensitive} />
                <b>Case Insensitive</b>
                <SlideToggle name="" size="sm" bind:checked={trigger.respondToBotsAndWebhooks} />
                <b>Respond to bots/webhooks</b>
            </div>
        </Panel>

        <Panel>
            <h3 class="h3">Response</h3>
            <div class="flex items-center gap-4">
                <b class="sm:whitespace-nowrap">Reply Mode:</b>
                <select class="select" bind:value={trigger.replyMode}>
                    <option value="normal">Normal Message</option>
                    <option value="reply">Reply (No Ping)</option>
                    <option value="ping-reply">Reply (With Ping)</option>
                </select>
            </div>
            <div class="flex items-center gap-4">
                <b>Reaction (Emoji):</b>
                <SingleEmojiSelector bind:selected={trigger.reaction} />
            </div>
            <MessageEditor bind:message={trigger.message} />
        </Panel>

        <Panel>
            <h3 class="h3">Restrictions</h3>
            <div class="grid grid-cols-[auto_1fr] items-center gap-4">
                <SlideToggle name="" size="sm" bind:checked={trigger.onlyInAllowedChannels} />
                <b>Only respond in allowed channels</b>
                <SlideToggle name="" size="sm" bind:checked={trigger.onlyToAllowedRoles} />
                <b>Only respond to allowed roles</b>
                <SlideToggle name="" size="sm" bind:checked={trigger.bypassDefaultChannelSettings} />
                <b>Bypass default channel restrictions</b>
                <SlideToggle name="" size="sm" bind:checked={trigger.bypassDefaultRoleSettings} />
                <b>Bypass default role restrictions</b>
            </div>
            <div class="grid grid-cols-[auto_1fr] items-center gap-4">
                <b>Allowed Channels:</b>
                <ChannelSelector types={textlikeAndParents} bind:selected={trigger.allowedChannels} />
                <b>Allowed Roles:</b>
                <RoleSelector showEveryone showHigher showManaged bind:selected={trigger.allowedRoles} />
                <b>Blocked Channels:</b>
                <ChannelSelector types={textlikeAndParents} bind:selected={trigger.blockedChannels} />
                <b>Blocked Roles:</b>
                <RoleSelector showEveryone showHigher showManaged bind:selected={trigger.blockedRoles} />
            </div>
        </Panel>
    {/if}
</Modal>

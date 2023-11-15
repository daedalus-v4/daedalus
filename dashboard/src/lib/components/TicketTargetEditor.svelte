<script lang="ts">
    import { page } from "$app/stores";
    import type { FETicketsSettings } from "$lib/types";
    import { textlike } from "$lib/utils";
    import { SlideToggle } from "@skeletonlabs/skeleton";
    import MessageEditor from "./MessageEditor.svelte";
    import Panel from "./Panel.svelte";
    import RoleSelector from "./RoleSelector.svelte";
    import SingleChannelSelector from "./SingleChannelSelector.svelte";
    import SingleEmojiSelector from "./SingleEmojiSelector.svelte";

    export let data: FETicketsSettings["prompts"][0]["targets"][0];
    export let multi: boolean;

    let { customizeTicketOpenMessage } = $page.data.premium;
</script>

{#if multi}
    <Panel>
        <h3 class="h3">Target Configuration</h3>
        <div class="w-full grid grid-cols-[auto_1fr] items-center gap-4">
            <b>Name:</b>
            <input type="text" class="input" maxlength={100} bind:value={data.name} />
            <b>Description:</b>
            <input type="text" class="input" maxlength={100} bind:value={data.description} />
            <b>Emoji:</b>
            <SingleEmojiSelector bind:selected={data.emoji} />
        </div>
    </Panel>
{/if}

<Panel>
    <h3 class="h3">Ticket Configuration</h3>
    <div class="w-full overflow-x-auto pt-2">
        <div class="min-w-[max-content] w-full grid grid-cols-[auto_1fr] items-center gap-4">
            <b>Log Channel</b>
            <SingleChannelSelector types={textlike} bind:selected={data.logChannel} />
            <b>Ticket Category</b>
            <SingleChannelSelector types={[4]} bind:selected={data.category} />
            <b>Roles to Ping</b>
            <RoleSelector showEveryone showHigher showManaged bind:selected={data.pingRoles} />
            <b>Ping <code class="code text-sm">@here</code></b>
            <div class="flex items-center py-[0.3125rem]">
                <SlideToggle name="" size="sm" bind:checked={data.pingHere} />
            </div>
            <b>Log Access Roles</b>
            <RoleSelector showEveryone showHigher showManaged bind:selected={data.accessRoles} />
            {#if !multi}
                <b>Button Label</b>
                <input type="text" class="input" maxlength={80} bind:value={data.label} />
                <b>Button Color</b>
                <div class="w-[max-content]">
                    <select class="select" bind:value={data.buttonColor}>
                        <option value="gray">Gray</option>
                        <option value="blue">Blue</option>
                        <option value="green">Green</option>
                        <option value="red">Red</option>
                    </select>
                </div>
                <b>Button Emoji</b>
                <SingleEmojiSelector bind:selected={data.emoji} />
            {/if}
            {#if customizeTicketOpenMessage}
                <b>Customize On-Open Message</b>
                <div class="flex items-center py-[0.3125rem]">
                    <SlideToggle name="" size="sm" bind:checked={data.postCustomOpenMessage} />
                </div>
            {/if}
        </div>
        <br />
        {#if customizeTicketOpenMessage && data.postCustomOpenMessage}
            <MessageEditor label="Edit On-Open Message" bind:message={data.customOpenMessage} />
        {/if}
    </div>
</Panel>

<script lang="ts">
    import type { FEModmailSettings } from "$lib/types";
    import { threadableTextlike } from "$lib/utils";
    import { SlideToggle } from "@skeletonlabs/skeleton";
    import A from "./A.svelte";
    import P from "./P.svelte";
    import Panel from "./Panel.svelte";
    import RoleSelector from "./RoleSelector.svelte";
    import SingleChannelSelector from "./SingleChannelSelector.svelte";
    import SingleEmojiSelector from "./SingleEmojiSelector.svelte";

    export let data: FEModmailSettings["targets"][0];
    export let multi: boolean;
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
    <h3 class="h3">Modmail Configuration</h3>
    <div class="flex items-center gap-4">
        <SlideToggle name="" size="sm" bind:checked={data.useThreads} />
        <b>Use Threads</b>
    </div>
    <div class="w-full overflow-x-auto pt-2">
        <div class="min-w-[max-content] w-full grid grid-cols-[auto_1fr] items-center gap-4">
            <b>{data.useThreads ? "Parent" : "Log"} Channel</b>
            <SingleChannelSelector types={threadableTextlike} bind:selected={data.logChannel} />
            {#if !data.useThreads}
                <b>Modmail Category</b>
                <SingleChannelSelector types={[4]} bind:selected={data.category} />
            {/if}
            <b>Roles to Ping</b>
            <RoleSelector showEveryone showHigher showManaged bind:selected={data.pingRoles} />
            <b>Ping <code class="code text-sm">@here</code></b>
            <SlideToggle name="" size="sm" bind:checked={data.pingHere} />
            <b>Log Access Roles</b>
            <RoleSelector showEveryone showHigher showManaged bind:selected={data.accessRoles} />
            <b>On-Open Message</b>
            <input type="text" class="input" bind:value={data.openMessage} />
            <b>Default On-Close Message</b>
            <input type="text" class="input" bind:value={data.closeMessage} />
        </div>
    </div>
    <P class="pt-4">
        The on-open and on-close messages can be configured using custom message syntax. See <A to="/docs/guides/custom-messages" external>the docs</A> for more
        info.
    </P>
</Panel>

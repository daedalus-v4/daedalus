<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import A from "$lib/components/A.svelte";
    import ChannelSelector from "$lib/components/ChannelSelector.svelte";
    import EmojiSelector from "$lib/components/EmojiSelector.svelte";
    import ModuleSaver from "$lib/components/ModuleSaver.svelte";
    import P from "$lib/components/P.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import PermissionLink from "$lib/components/PermissionLink.svelte";
    import RoleSelector from "$lib/components/RoleSelector.svelte";
    import SingleChannelSelector from "$lib/components/SingleChannelSelector.svelte";
    import StickerSelector from "$lib/components/StickerSelector.svelte";
    import type { FENukeguardSettings } from "$lib/types";
    import { textlike } from "$lib/utils";
    import { SlideToggle } from "@skeletonlabs/skeleton";

    let base: FENukeguardSettings = $page.data.data;
    let data = browser ? structuredClone(base) : base;
</script>

<ModuleSaver bind:base bind:data />

<Panel>
    <h3 class="h3">Nukeguard</h3>
    <P>Unless specified otherwise, when nukeguard triggers, the violator will be banned from the server and the admin channel will be alerted.</P>
    <P>
        You can exempt roles to allow them to take any actions. Only users with exempted roles will be able to edit the nukeguard configuration, even if they
        can manage the rest of the dashboard.
    </P>
</Panel>

{#if !$page.data.access}
    <Panel>
        <h3 class="h3 text-error-500 dark:text-error-400">Read-only Mode</h3>
        <P>Due to special restrictions, you can only view this module and cannot edit its configuration.</P>
    </Panel>
{/if}

<Panel>
    <b>Admin Channel</b> (alerts are posted here when nukeguard triggers)
    <SingleChannelSelector types={textlike} bind:selected={data.alertChannel} />
    <b>Ping Roles</b>
    <RoleSelector showEveryone showHigher showManaged bind:selected={data.pingRoles} />
    <b>Ping <code class="code text-sm">@here</code></b>
    <SlideToggle name="" size="sm" bind:checked={data.pingHere} />
    <b>Exempted Roles</b>
    <RoleSelector showEveryone showHigher showManaged bind:selected={data.exemptedRoles} />
</Panel>

<Panel>
    <h3 class="h3">Deletion Detection</h3>
    <P>This rule detects the deletion of supervised entities.</P>
    <Panel class="w-full">
        <h4 class="h4">Channels</h4>
        <P>
            You generally shouldn't give your mods <PermissionLink key="ManageChannels" />. It's risky, and mods usually don't need to create, delete, or edit
            channels. The only exception is the use of slowmode, but you can give them access to the <b>/slowmode</b> command instead.
        </P>
        <P>If a channel is both explicitly watched and ignored, it will be watched.</P>
        <div class="flex items-center gap-4">
            <SlideToggle name="" size="sm" bind:checked={data.watchChannelsByDefault} />
            <b>Watch Channels By Default</b>
        </div>
        <b>Ignored Channels</b>
        <ChannelSelector bind:selected={data.ignoredChannels} />
        <b>Watched Channels</b>
        <ChannelSelector bind:selected={data.watchedChannels} />
    </Panel>
    <Panel class="w-full">
        <h4 class="h4">Roles</h4>
        <P>
            You generally shouldn't give your mods <PermissionLink key="ManageRoles" />. It's risky, and mods usually don't need to create, delete, or edit
            roles. The exception is to add/remove certain roles, but you can give them access to the <b>/roles</b> command, which only allows for assignment/removal
            and allows you to restrict which roles can be managed.
        </P>
        <P>If a role is both explicitly watched and ignored, it will be watched.</P>
        <div class="flex items-center gap-4">
            <SlideToggle name="" size="sm" bind:checked={data.watchRolesByDefault} />
            <b>Watch Roles By Default</b>
        </div>
        {#if data.watchRolesByDefault}
            <b>Ignored Roles</b>
            <RoleSelector showHigher bind:selected={data.ignoredRoles} />
        {:else}
            <b>Watched Roles</b>
            <RoleSelector showHigher bind:selected={data.watchedRoles} />
        {/if}
    </Panel>
    <Panel class="w-full">
        <h4 class="h4">Emoji, Stickers, &amp; Sounds</h4>
        <P>
            You generally shouldn't give your mods <PermissionLink key="ManageGuildExpressions" />. It's not the most risky, but you can just approve and upload
            server assets yourself. You can also give them access to <b>/add-asset</b>.
        </P>
        <Panel class="w-full">
            <div class="flex items-center gap-4">
                <SlideToggle name="" size="sm" bind:checked={data.watchEmojiByDefault} />
                <b>Watch Emoji By Default</b>
            </div>
            {#if data.watchEmojiByDefault}
                <b>Ignored Emoji</b>
                <EmojiSelector hideGlobal bind:selected={data.ignoredEmoji} />
            {:else}
                <b>Watched Emoji</b>
                <EmojiSelector hideGlobal bind:selected={data.watchedEmoji} />
            {/if}
        </Panel>
        <Panel class="w-full">
            <div class="flex items-center gap-4">
                <SlideToggle name="" size="sm" bind:checked={data.watchStickersByDefault} />
                <b>Watch Stickers By Default</b>
            </div>
            {#if data.watchStickersByDefault}
                <b>Ignored Stickers</b>
                <StickerSelector bind:selected={data.ignoredStickers} />
            {:else}
                <b>Watched Stickers</b>
                <StickerSelector bind:selected={data.watchedStickers} />
            {/if}
        </Panel>
        <Panel class="w-full">
            <!-- TODO: Add sound deletion detection -->
            <P><b>Coming Soon!</b> The soundboard is not yet available in the Discord API.</P>
        </Panel>
    </Panel>
</Panel>
<Panel class="w-full">
    <h4 class="h4">Webhooks</h4>
    <P>
        Instead of giving your mods <PermissionLink key="ManageWebhooks" />, consider pinning a list of webhooks URLs somewhere. You can still delete a webhook
        with only its url, even without permissions, so consider using Daedalus'
        <A to="/manage/{$page.params.id}/webhooks" external>webhook proxy system</A>, which allows you to secure webhooks, audit webhook actions, etc.
    </P>
    <P>If a webhook is deleted or edited using its URL through an API call to the webhook itself, it is impossible to detect who did it.</P>
    <div class="flex items-center gap-4">
        <SlideToggle name="" size="sm" bind:checked={data.preventWebhookCreation} />
        <span><b>Prevent Webhook Creation</b> (instantly delete any webhooks that are created, but does not ban the user)</span>
    </div>
    <div class="flex items-center gap-4">
        <SlideToggle name="" size="sm" bind:checked={data.watchWebhookDeletion} />
        <span><b>Watch Webhook Deletion</b></span>
    </div>
</Panel>
<Panel class="w-full">
    <h4 class="h4">Ratelimit</h4>
    <P>
        This rule triggers if a user bans users too quickly. Use of the <b>/ban</b> command is not observed, as this is mostly to avoid a hacked account banning
        users faster than humanly possible.
    </P>
    <P>This rule does not apply to bots to avoid conflicting with deliberate mass-ban features.</P>
    <div class="flex items-center gap-4">
        <SlideToggle name="" size="sm" bind:checked={data.ratelimitEnabled} />
        <b>Enable This Rule</b>
    </div>
    <div class="flex items-center gap-4">
        <SlideToggle name="" size="sm" bind:checked={data.ratelimitKicks} />
        <b>Also Ratelimit Kicks</b>
    </div>
    <P>Trigger if a user bans <b>X</b> users within <b>Y</b> seconds.</P>
    <div class="grid grid-cols-[auto_1fr] items-center gap-4">
        <b>X:</b>
        <input type="number" class="input" min={2} bind:value={data.threshold} />
        <b>Y:</b>
        <input type="number" class="input" min={1} max={3600} bind:value={data.timeInSeconds} />
    </div>
</Panel>
<Panel class="w-full">
    <h4 class="h4">Restrict Role Assignment</h4>
    <P>The <b>/roles add</b> command will <b>not</b> respect these restrictions.</P>
    <div class="flex items-center gap-4">
        <SlideToggle name="" size="sm" bind:checked={data.restrictRolesLenientMode} />
        <span><b>Lenient Mode</b> (on violation, the action is reverted and the user is DM'd, and only banned if they do it twice within an hour)</span>
    </div>
    <div class="flex items-center gap-4">
        <SlideToggle name="" size="sm" bind:checked={data.restrictRolesBlockByDefault} />
        <b>Block All Roles By Default</b>
    </div>
    {#if data.restrictRolesBlockByDefault}
        <b>Allowed Roles</b>
        <RoleSelector showHigher bind:selected={data.restrictRolesAllowedRoles} />
    {:else}
        <b>Blocked Roles</b>
        <RoleSelector showHigher bind:selected={data.restrictRolesBlockedRoles} />
    {/if}
</Panel>

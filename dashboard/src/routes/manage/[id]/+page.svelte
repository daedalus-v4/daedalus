<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import A from "$lib/components/A.svelte";
    import ChannelSelector from "$lib/components/ChannelSelector.svelte";
    import InputHint from "$lib/components/InputHint.svelte";
    import ModuleSaver from "$lib/components/ModuleSaver.svelte";
    import P from "$lib/components/P.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import PermissionLink from "$lib/components/PermissionLink.svelte";
    import RoleSelector from "$lib/components/RoleSelector.svelte";
    import SingleRoleSelector from "$lib/components/SingleRoleSelector.svelte";
    import { diffGuildSettings } from "$lib/modules";
    import type { FESettings } from "$lib/types";
    import { SlideToggle } from "@skeletonlabs/skeleton";

    let base: FESettings = $page.data.data;
    let data = browser ? structuredClone(base) : base;
</script>

<ModuleSaver bind:base bind:data diff={diffGuildSettings} />

<Panel>
    <h3 class="h3">Dashboard Permissions</h3>
    <P>
        By default, the dashboard can be used by people with the <PermissionLink key="ManageGuild" /> permission. You can choose to restrict this further.
    </P>
    <div>
        <select name="dashboardPermissions" class="select" bind:value={data.dashboardPermissions}>
            <option value="owner">Owner Only</option>
            <option value="admin">Administrator</option>
            <option value="manager">Manage Server (Default)</option>
        </select>
    </div>
</Panel>

<Panel>
    <h3 class="h3">Embed Color</h3>
    <P>
        This embed color is used for most command responses within your server as well as things like modmail messages and moderation messages to users sent
        from your server. Other fixed colors will be used for things like logging where it makes sense (e.g. red for deletion).
    </P>
    <div class="flex gap-2 items-center">
        <div class="flex items-center">
            <input type="color" class="input" bind:value={data.embedColor} />
        </div>
        <input type="text" class="input {data.embedColor.match(/^#[0-9a-f]{6}$/i) ? '' : 'error'}" bind:value={data.embedColor} />
    </div>
</Panel>

<Panel>
    <h3 class="h3">Mute Role</h3>
    <P>
        This role is assigned by the <b>/mute</b> command and automod mute rules. We have a guide on setting up mute roles
        <A to="/docs/guides/permissions">here</A>.
    </P>
    <SingleRoleSelector bind:selected={data.muteRole} />
</Panel>

<Panel>
    <h3 class="h3">Ban Footer</h3>
    <P>
        If this is set, this content will be included at the end of every ban message sent to users, including automod actions. For example, you can link your
        ban appeal form here.
    </P>
    <textarea rows="4" class="textarea {data.banFooter.trim().length > 1024 ? 'error' : ''}" placeholder="Ban Footer" bind:value={data.banFooter} />
    <InputHint>{data.banFooter.trim().length} / 1024</InputHint>
</Panel>

<Panel>
    <h3 class="h3">Permissions</h3>
    <P>
        Control permissions for the entire bot. To control permissions by each individual command, return to the server settings, go to a module and click
        "manage" on a command card to edit its permission overrides.
    </P>
    <Panel class="w-full">
        <h4 class="h4">Role Permissions</h4>
        <span class="flex items-center gap-4">
            <SlideToggle name="" size="sm" bind:checked={data.modOnly} />
            <span><b>Entire Bot Mod Only</b> (only allowed roles may use any commands &mdash; cannot be overridden)</span>
        </span>
        <span class="flex items-center gap-2">
            <h5 class="h5">Allowed Roles</h5>
            <span class="text-surface-600 dark:text-surface-300">(This is overridden by blocked roles.)</span>
        </span>
        <RoleSelector bind:selected={data.allowedRoles} />
        <span class="flex items-center gap-2">
            <h5 class="h5">Blocked Roles</h5>
            <span class="text-surface-600 dark:text-surface-300">(This overrides allowed roles.)</span>
        </span>
        <RoleSelector bind:selected={data.blockedRoles} />
    </Panel>
    <Panel class="w-full">
        <h4 class="h4">Channel Permissions</h4>
        <div class="flex items-center gap-4">
            <SlideToggle name="" size="sm" bind:checked={data.allowlistOnly} />
            <span><b>Allowlist Only</b> (commands can only be used in allowed channels &mdash; cannot be overridden)</span>
        </div>
        <div class="flex items-center gap-2">
            <h5 class="h5">Allowed Channels</h5>
        </div>
        <P>
            If a channel and its parent category differ, the channel's settings will take precedence. If a channel is both allowed and blocked at the same
            level, it will be blocked.
        </P>
        <ChannelSelector bind:selected={data.allowedChannels} />
        <div class="flex items-center gap-2">
            <h5 class="h5">Blocked Channels</h5>
        </div>
        <ChannelSelector bind:selected={data.blockedChannels} />
    </Panel>
</Panel>

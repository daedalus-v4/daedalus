<script lang="ts">
    import { commandPermissionsModalStore } from "$lib/stores";
    import type { FEModulesPermissionsSettings } from "$lib/types";
    import { textlikeAndParents } from "$lib/utils";
    import { SlideToggle } from "@skeletonlabs/skeleton";
    import { modules } from "shared";
    import ChannelSelector from "./ChannelSelector.svelte";
    import Icon from "./Icon.svelte";
    import Modal from "./Modal.svelte";
    import P from "./P.svelte";
    import Panel from "./Panel.svelte";
    import PermissionLink from "./PermissionLink.svelte";
    import RoleSelector from "./RoleSelector.svelte";

    let _: {
        mid: string;
        cid: string;
        settings: FEModulesPermissionsSettings["commands"][string];
        set: (x: FEModulesPermissionsSettings["commands"][string]) => unknown;
    } | null;

    $: _ = $commandPermissionsModalStore ?? _;

    $: mid = _?.mid;
    $: cid = _?.cid;
    $: __ = _?.settings;

    $: command = modules[mid ?? ""]?.commands?.[cid ?? ""];

    $: __ && _?.set(__);
</script>

<Modal max open={!!$commandPermissionsModalStore} on:close={() => ($commandPermissionsModalStore = null)}>
    <h2 class="h2 flex flex-wrap gap-2">
        Managing the <b class="flex items-center gap-2">
            {#if command?.icon}<Icon icon={command.icon} />{/if}
            {command?.name}
        </b>
        command <span>(<b>/{cid}</b>)</span>
    </h2>
    <P>
        By default, this command can be used by
        {#if !command?.permissions?.length}
            anyone.
        {:else}
            users with
            {#if command.permissions.length === 1}
                <PermissionLink key={command.permissions[0]} />.
            {:else if command.permissions.length === 2}
                <PermissionLink key={command.permissions[0]} /> and <PermissionLink key={command.permissions[1]} />.
            {:else}
                {#each command.permissions.slice(0, -1) as key}
                    <span><PermissionLink {key} />,&ThickSpace;</span>
                {/each} and <PermissionLink key={command.permissions.at(-1) ?? ""} />.
            {/if}
        {/if}
    </P>
    {#if __}
        <Panel class="w-full">
            <h3 class="h3">Role Permissions</h3>
            <div class="flex items-center gap-4">
                <SlideToggle name="" size="sm" bind:checked={__.ignoreDefaultPermissions} />
                <span class="text-lg">
                    <b>Ignore Default Permissions</b>
                    (only allowed users may use this command)
                </span>
            </div>
            <span class="flex items-center gap-2">
                <h5 class="h5">Allowed Roles</h5>
                <span class="text-surface-600 dark:text-surface-300">(This is overridden by blocked roles.)</span>
            </span>
            <RoleSelector showEveryone showHigher showManaged bind:selected={__.allowedRoles} />
            <span class="flex items-center gap-2">
                <h5 class="h5">Blocked Roles</h5>
                <span class="text-surface-600 dark:text-surface-300">(This overrides allowed roles.)</span>
            </span>
            <RoleSelector showEveryone showHigher showManaged bind:selected={__.blockedRoles} />
        </Panel>
        <Panel class="w-full">
            <h3 class="h3">Channel Permissions</h3>
            <div class="flex items-center gap-4">
                <SlideToggle name="" size="sm" bind:checked={__.restrictChannels} />
                <span class="text-lg">
                    <b>Restrict Channels</b>
                    (this command can only be used in allowed channels)
                </span>
            </div>
            <P>
                If a channel and its parent category differ, the channel's settings will take precedence. If a channel is both allowed and blocked at the same
                level, it will be blocked.
            </P>
            <h5 class="h5">Allowed Channels</h5>
            <ChannelSelector types={textlikeAndParents} bind:selected={__.allowedChannels} />
            <h5 class="h5">Blocked Channels</h5>
            <ChannelSelector types={textlikeAndParents} bind:selected={__.blockedChannels} />
        </Panel>
    {/if}
</Modal>

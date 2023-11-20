<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import ModuleSaver from "$lib/components/ModuleSaver.svelte";
    import P from "$lib/components/P.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import RoleSelector from "$lib/components/RoleSelector.svelte";
    import { SlideToggle } from "@skeletonlabs/skeleton";
    import type { DbUtilitySettings } from "shared";

    let base: DbUtilitySettings = $page.data.data;
    let data = browser ? structuredClone(base) : base;
</script>

<ModuleSaver bind:base bind:data />

<Panel>
    <h3 class="h3">Restrictions for <b>/roles</b></h3>
    <P>Control which roles moderators are allowed to add/remove using <b>/roles</b>.</P>
    <div class="flex items-center gap-4">
        <SlideToggle name="" size="sm" bind:checked={data.blockRolesByDefault} />
        <b>Block Roles By Default</b>
    </div>
    {#if data.blockRolesByDefault}
        <b>Allowed Roles</b>
        <RoleSelector bind:selected={data.allowedRoles} />
    {:else}
        <b>Blocked Roles</b>
        <RoleSelector bind:selected={data.blockedRoles} />
    {/if}
    <span><b>Bypass Roles</b> (users with these roles ignore restrictions but still need direct permission to use the command)</span>
    <RoleSelector showHigher showManaged bind:selected={data.bypassRoles} />
</Panel>

<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import ModuleSaver from "$lib/components/ModuleSaver.svelte";
    import P from "$lib/components/P.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import RoleSelector from "$lib/components/RoleSelector.svelte";
    import SingleRoleSelector from "$lib/components/SingleRoleSelector.svelte";
    import type { FECustomRolesSettings } from "$lib/types";
    import { SlideToggle } from "@skeletonlabs/skeleton";

    let base: FECustomRolesSettings = $page.data.data;
    let data = browser ? structuredClone(base) : base;
</script>

<ModuleSaver bind:base bind:data />

<Panel>
    <h3 class="h3">Custom Role Permissions</h3>
    <div class="flex items-center gap-4">
        <SlideToggle name="" size="sm" bind:checked={data.allowBoosters} />
        Allow Server Boosters
    </div>
    <div class="flex items-center gap-4">
        <b>Roles:</b>
        <RoleSelector showEveryone showHigher showManaged bind:selected={data.allowedRoles} />
    </div>
</Panel>

<Panel>
    <h3 class="h3">Anchor</h3>
    <P>
        Custom roles will be created below this role. If it is not set or is above the bot's highest role, custom roles will instead be created at the bottom of
        the role list.
    </P>
    <SingleRoleSelector showManaged bind:selected={data.anchor} />
</Panel>

<P class="text-surface-500 dark:text-surface-300">
    <b class="text-primary-500 dark:text-primary-400">Important:</b> Each server can only have up to 250 roles (this is a Discord limitation). If your server reaches
    this limit, the bot will be unable to provide more custom roles.
</P>

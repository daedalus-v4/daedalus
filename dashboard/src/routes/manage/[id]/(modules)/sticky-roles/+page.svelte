<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import ModuleSaver from "$lib/components/ModuleSaver.svelte";
    import P from "$lib/components/P.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import RoleSelector from "$lib/components/RoleSelector.svelte";
    import type { FEStickyRolesSettings } from "$lib/types";

    let base: FEStickyRolesSettings = $page.data.data;
    let data = browser ? structuredClone(base) : base;
</script>

<ModuleSaver bind:base bind:data />

<Panel>
    <h3 class="h3">Important Info</h3>
    <P>
        All roles are sticky by default. When a user leaves the server, their roles will be stored, and when they rejoin, their stored roles will be re-applied.
    </P>
    <P>
        You may wish to exclude roles such as your staff roles. It is recommended to use this feature and have verification and mute roles enabled for user
        convenience and server security.
    </P>
    <P>Note that all roles are saved, and excluded roles are excluded when the user rejoins.</P>
    <P>Any roles that the bot cannot manage (roles that are above the bot's highest role, managed roles, etc.) will be ignored.</P>
</Panel>

<Panel>
    <h3 class="h3">Excluded Roles</h3>
    <RoleSelector showEveryone showHigher showManaged bind:selected={data.exclude} />
</Panel>

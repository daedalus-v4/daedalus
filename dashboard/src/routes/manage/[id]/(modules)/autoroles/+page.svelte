<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import ModuleSaver from "$lib/components/ModuleSaver.svelte";
    import P from "$lib/components/P.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import RoleSelector from "$lib/components/RoleSelector.svelte";
    import type { FEAutorolesSettings } from "$lib/types";

    let base: FEAutorolesSettings = $page.data.data;
    let data = browser ? structuredClone(base) : base;
</script>

<ModuleSaver bind:base bind:data />

<Panel>
    <h3 class="h3">Autoroles</h3>
    <P>The selected roles will be automatically assigned to members when they join the server, including if they are rejoining.</P>
    <RoleSelector bind:selected={data.roles} />
</Panel>

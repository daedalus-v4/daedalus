<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import ModuleSaver from "$lib/components/ModuleSaver.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import RoleSelector from "$lib/components/RoleSelector.svelte";
    import SingleChannelSelector from "$lib/components/SingleChannelSelector.svelte";
    import type { FEReportsSettings } from "$lib/types";
    import { textlike } from "$lib/utils";
    import { SlideToggle } from "@skeletonlabs/skeleton";

    let base: FEReportsSettings = $page.data.data;
    let data = browser ? structuredClone(base) : base;
</script>

<ModuleSaver bind:base bind:data />

<Panel>
    <h3 class="h3">Reports</h3>
    <b>Output Channel</b>
    <SingleChannelSelector types={textlike} bind:selected={data.outputChannel} />
    <b>Ping Roles</b>
    <RoleSelector showEveryone showHigher showManaged bind:selected={data.pingRoles} />
    <div class="flex items-center gap-4">
        <SlideToggle name="" size="sm" bind:checked={data.anonymous} />
        <b>Anonymous</b>
    </div>
    {#if data.anonymous}
        <b>Roles that can view anonymous reporters</b>
        <RoleSelector showEveryone showHigher showManaged bind:selected={data.viewRoles} />
    {/if}
</Panel>

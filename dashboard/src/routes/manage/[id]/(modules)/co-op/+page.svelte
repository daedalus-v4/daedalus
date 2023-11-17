<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import ModuleSaver from "$lib/components/ModuleSaver.svelte";
    import P from "$lib/components/P.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import SingleRoleSelector from "$lib/components/SingleRoleSelector.svelte";
    import type { FECoOpSettings } from "$lib/types";

    let base: FECoOpSettings = $page.data.data;
    let data = browser ? structuredClone(base) : base;
</script>

<ModuleSaver bind:base bind:data />

<Panel>
    <P>World level and region roles are used to automatically detect users' world level and region when they use the <b>/co-op</b> command.</P>
    <P>If they have exactly one world level role, they will not be required to specify their world level, and likewise for region.</P>
    <P>The helper role for the region selected by the user will be pinged if set.</P>
    <P>There is a 30-minute per-user cooldown on using the co-op command.</P>
</Panel>

<Panel>
    <h3 class="h3">World Level Roles</h3>
    <div class="w-full grid grid-cols-[auto_1fr] md:grid-cols-[repeat(2,auto_1fr)] xl:grid-cols-[repeat(3,auto_1fr)] items-center gap-4">
        {#each new Array(9) as _, i}
            <b class="whitespace-nowrap">WL {i}:</b>
            <SingleRoleSelector showHigher bind:selected={data.worldLevelRoles[i]} />
        {/each}
    </div>
</Panel>

{#each [0, 1] as key}
    <Panel>
        <h3 class="h3">{key === 0 ? "Region" : "Helper"} Roles</h3>
        <div class="w-full grid grid-cols-[auto_1fr] md:grid-cols-[repeat(2,auto_1fr)] xl:grid-cols-[repeat(3,auto_1fr)] items-center gap-4">
            {#each new Array(4) as _, i}
                <b class="whitespace-nowrap">{["NA", "EU", "AS", "SAR"][i]}</b>
                <SingleRoleSelector showHigher bind:selected={data[key === 0 ? "regionRoles" : "helperRoles"][i]} />
            {/each}
        </div>
    </Panel>
{/each}

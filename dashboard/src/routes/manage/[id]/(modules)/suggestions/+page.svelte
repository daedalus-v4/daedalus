<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import Debug from "$lib/components/Debug.svelte";
    import ModuleSaver from "$lib/components/ModuleSaver.svelte";
    import P from "$lib/components/P.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import SingleChannelSelector from "$lib/components/SingleChannelSelector.svelte";
    import type { FESuggestionsSettings } from "$lib/types";
    import { textlike } from "$lib/utils";
    import { SlideToggle } from "@skeletonlabs/skeleton";

    let base: FESuggestionsSettings = $page.data.data;
    let data = browser ? structuredClone(base) : base;
</script>

<ModuleSaver bind:base bind:data />

<Panel>
    <h3 class="h3">Suggestions</h3>
    <b>Output Channel</b>
    <SingleChannelSelector types={textlike} bind:selected={data.outputChannel} />
    <div class="flex items-center gap-4">
        <SlideToggle name="" size="sm" bind:checked={data.anonymous} />
        <b>Anonymous</b>
    </div>
    <P>
        If suggestions are anonymous, a button will appear below suggestions that allows users with permission to use the <b>/suggestion</b> command to view the
        author.
    </P>
</Panel>

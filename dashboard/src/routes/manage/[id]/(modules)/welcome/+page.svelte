<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import MessageEditor from "$lib/components/MessageEditor.svelte";
    import ModuleSaver from "$lib/components/ModuleSaver.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import SingleChannelSelector from "$lib/components/SingleChannelSelector.svelte";
    import type { FEWelcomeSettings } from "$lib/types";
    import { textlike } from "$lib/utils";

    let base: FEWelcomeSettings = $page.data.data;
    let data = browser ? structuredClone(base) : base;
</script>

<ModuleSaver bind:base bind:data />

<Panel>
    <h3 class="h3">Welcome Channel</h3>
    <SingleChannelSelector types={textlike} bind:selected={data.channel} />
    <h3 class="h3">Message Data</h3>
    <MessageEditor bind:message={data.message} />
</Panel>

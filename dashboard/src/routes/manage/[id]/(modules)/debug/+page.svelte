<script lang="ts">
    import { page } from "$app/stores";
    import Debug from "$lib/components/Debug.svelte";
    import Panel from "$lib/components/Panel.svelte";
</script>

<Panel>
    <Debug data={$page.data} />
</Panel>

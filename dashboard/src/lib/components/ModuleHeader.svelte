<script lang="ts">
    import { modules } from "shared";
    import Icon from "./Icon.svelte";

    export let id: string;

    $: ({ icon, brand, name } = modules[id]);
</script>

<span class="flex items-center gap-4">
    {#if icon}<Icon {icon} {brand} />{/if}
    {name}
</span>

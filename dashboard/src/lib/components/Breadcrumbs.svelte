<script lang="ts">
    import A from "./A.svelte";
    import Icon from "./Icon.svelte";

    export let links: [string, string][];
</script>

<ol class="breadcrumb bg-surface-50 dark:bg-surface-600 p-4 rounded-xl">
    {#each links as [to, label], index}
        {#if index !== 0}
            <li class="crumb-separator"><Icon icon="angle-right" /></li>
        {/if}
        <li class="crumb"><A {to} class={index === links.length - 1 ? "font-bold" : ""}>{@html label}</A></li>
    {/each}
</ol>

<script lang="ts">
    import P from "$lib/components/P.svelte";
</script>

{#each new Array(100) as _}
    <P>Hello, World!</P>
{/each}

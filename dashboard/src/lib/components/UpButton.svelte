<script lang="ts">
    import Icon from "./Icon.svelte";

    let scroll: number;
</script>

<svelte:window bind:scrollY={scroll} />

<button
    class="btn-icon fixed h-12 w-12 right-12 bottom-12 bg-primary-500/50 transition-opacity duration-300 {scroll > 50 ? '' : 'opacity-0 pointer-events-none'}"
    on:click={() => scrollTo({ top: 0 })}
>
    <Icon icon="angle-up" />
</button>

<script lang="ts">
    import Icon from "./Icon.svelte";
    import Modal from "./Modal.svelte";

    let open: boolean = false;
</script>

<button
    class="btn-icon fixed h-12 w-12 right-28 bottom-12 bg-surface-400/50 transition-opacity duration-300"
    style="z-index: 50"
    on:click={() => (open = true)}
>
    <Icon icon="screwdriver-wrench" />
</button>

<Modal bind:open max>
    <h2 class="h2">Admin Tools</h2>
</Modal>

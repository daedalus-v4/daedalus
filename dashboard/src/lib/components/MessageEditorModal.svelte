<script lang="ts">
    import { messageEditorModalStore } from "$lib/stores";
    import MessageEditorCore from "./MessageEditorCore.svelte";
    import Modal from "./Modal.svelte";

    $: $messageEditorModalStore?.message && $messageEditorModalStore.set($messageEditorModalStore.message);
</script>

<Modal max z={100} open={!!$messageEditorModalStore} on:close={() => ($messageEditorModalStore = null)}>
    {#if $messageEditorModalStore}
        <MessageEditorCore isStatic={$messageEditorModalStore.isStatic} bind:message={$messageEditorModalStore.message} />
    {/if}
</Modal>

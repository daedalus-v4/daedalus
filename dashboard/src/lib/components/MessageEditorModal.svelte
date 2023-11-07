<script lang="ts">
    import { messageEditorModalStore } from "$lib/stores";
    import type { FEMessageData } from "shared";
    import MessageEditorCore from "./MessageEditorCore.svelte";
    import Modal from "./Modal.svelte";

    let message: FEMessageData | null = null;
    $: message = $messageEditorModalStore ?? message;
</script>

<Modal max z={100} open={!!$messageEditorModalStore} on:close={() => ($messageEditorModalStore = null)}>
    {#if message}
        <MessageEditorCore bind:message />
    {/if}
</Modal>

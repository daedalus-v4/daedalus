<script lang="ts">
    import type { FEMessageData } from "shared";
    import A from "./A.svelte";
    import Button from "./Button.svelte";
    import Icon from "./Icon.svelte";
    import MessageEditorCore from "./MessageEditorCore.svelte";
    import Modal from "./Modal.svelte";
    import P from "./P.svelte";

    export let message: FEMessageData;
    export let flat: boolean = false;
    let isStatic: boolean = false;

    export { isStatic as static };

    let open = false;
</script>

<div class="flex flex-col gap-2">
    {#if !isStatic}
        <P class="pl-1">See <A to="/docs/guides/custom-messages">the docs</A> for how to format custom messages.</P>
    {/if}
    <div class="flex flex-wrap gap-2">
        {#if !flat}
            <Button on:click={() => (open = true)}><Icon icon="edit" /> Edit Message</Button>
        {/if}
    </div>
</div>

{#if flat}
    <div class="w-full">
        <MessageEditorCore bind:message />
    </div>
{:else}
    <Modal max bind:open>
        <MessageEditorCore bind:message />
    </Modal>
{/if}

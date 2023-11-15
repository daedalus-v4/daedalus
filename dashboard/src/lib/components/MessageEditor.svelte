<script lang="ts">
    import { messageEditorModalStore } from "$lib/stores";
    import type { FEMessageData } from "shared";
    import A from "./A.svelte";
    import Button from "./Button.svelte";
    import Icon from "./Icon.svelte";
    import MessageEditorCore from "./MessageEditorCore.svelte";
    import P from "./P.svelte";

    export let message: FEMessageData;
    export let flat: boolean = false;
    export let label: string = "Edit Message";
    let isStatic: boolean = false;

    export { isStatic as static };
</script>

<div class="flex flex-col gap-2">
    {#if !isStatic}
        <P class="pl-1">See <A to="/docs/guides/custom-messages" external>the docs</A> for how to format custom messages.</P>
    {/if}
    <div class="flex flex-wrap gap-2">
        {#if !flat}
            <Button on:click={() => ($messageEditorModalStore = { isStatic, message, set: (data) => (message = data) })}><Icon icon="edit" /> {label}</Button>
        {/if}
    </div>
</div>

{#if flat}
    <div class="w-full">
        <MessageEditorCore {isStatic} bind:message />
    </div>
{/if}

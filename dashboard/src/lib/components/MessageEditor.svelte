<script lang="ts">
    import { defaultEmbed } from "$lib/modules/utils";
    import { CodeBlock } from "@skeletonlabs/skeleton";
    import type { FEMessageData } from "shared";
    import A from "./A.svelte";
    import Button from "./Button.svelte";
    import Icon from "./Icon.svelte";
    import Modal from "./Modal.svelte";
    import P from "./P.svelte";

    export let message: FEMessageData;
    let isStatic: boolean = false;

    export { isStatic as static };

    let open = false;
</script>

<div class="flex flex-col gap-2">
    {#if !isStatic}
        <P class="pl-1">See <A to="/docs/guides/custom-messages">the docs</A> for how to format custom messages.</P>
    {/if}
    <div class="flex flex-wrap gap-2">
        <Button on:click={() => (open = true)}><Icon icon="edit" /> Edit Message</Button>
        <Button><Icon icon="code" /> Edit JSON</Button>
        <Button><Icon icon="eye" /> Preview</Button>
    </div>
</div>

<Modal bind:open>
    <div class="w-[calc(90vw-4rem)] md:w-[calc(80vw-4rem)] lg-[calc(75vw-4rem)] lg-[calc(60vw-4rem)] flex flex-col gap-4">
        <p class="pl-2 pb-2">Content</p>
        <textarea rows="2" class="textarea" bind:value={message.content} />
        <span class={message.embeds.length < 10 ? "" : "hidden"}>
            <Button variant="primary" on:click={() => (message.embeds = [...message.embeds, defaultEmbed()])}><Icon icon="plus" /> Add Embed</Button>
        </span>
        <CodeBlock language="json" code={JSON.stringify(message, undefined, 4)} />
        <br />
    </div>
</Modal>

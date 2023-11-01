<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import Button from "./Button.svelte";

    export let z: number = 50;
    export let open: boolean = false;

    const dispatch = createEventDispatcher();

    async function close() {
        if (!open) return;

        open = false;
        dispatch("close");
    }
</script>

<svelte:window on:keydown={(e) => open && e.key === "Escape" && [close(), e.stopPropagation()]} />

<div
    class="{open ? '' : 'opacity-0 scale-90 translate-y-12'} pointer-events-none fixed inset-0 flex items-center justify-center transition-all duration-400"
    style="z-index: {z}"
>
    <div
        class="{open
            ? 'pointer-events-auto'
            : ''} max-h-[75vh] max-w-[90vw] p-8 grid grid-cols-1 justify-between bg-surface-200 dark:bg-surface-600 rounded-md drop-shadow-xl overflow-auto"
    >
        <div>
            <slot />
        </div>
        <div class="flex justify-end h-12">
            <Button on:click={close}>Close</Button>
        </div>
    </div>
</div>

<div
    role="none"
    class="{open ? '' : 'opacity-0 pointer-events-none'} fixed inset-0 bg-white/20 dark:bg-black/30 backdrop-blur-[2px] transition-all duration-400"
    style="z-index: {z - 1}"
    on:click={close}
/>

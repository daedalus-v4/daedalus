<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import Button from "./Button.svelte";

    export let open: boolean = false;

    const dispatch = createEventDispatcher();

    async function close() {
        if (!open) return;

        open = false;
        dispatch("close");
    }
</script>

<svelte:window on:keydown={(e) => e.key === "Escape" && close()} />

<div
    class="{open
        ? ''
        : 'opacity-0 scale-90 translate-y-12'} pointer-events-none z-50 fixed inset-0 flex items-center justify-center transition-all duration-400"
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
    class="{open ? '' : 'opacity-0 pointer-events-none'} z-40 fixed inset-0 bg-white/20 dark:bg-black/30 backdrop-blur-[2px] transition-all duration-400"
    on:click={close}
/>

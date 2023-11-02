<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import Button from "./Button.svelte";
    import Icon from "./Icon.svelte";

    export let z: number = 50;
    export let open: boolean = false;
    export let fullscreen: boolean = false;
    export let max: boolean = false;

    const dispatch = createEventDispatcher();

    async function close() {
        if (!open) return;

        open = false;
        fullscreen = false;
        dispatch("close");
    }
</script>

<svelte:window on:keydown={(e) => open && e.key === "Escape" && [close(), e.stopPropagation()]} />

<div
    class="{open ? '' : 'opacity-0 scale-90 translate-y-12'} pointer-events-none fixed inset-0 flex items-center justify-center transition-all duration-400"
    style="z-index: {z}"
>
    <div class="{fullscreen ? 'h-full w-full' : 'max-h-[75vh] max-w-[90vw]'} relative">
        <div
            class="{open ? 'pointer-events-auto' : ''} {fullscreen
                ? 'h-full w-full'
                : 'rounded-md max-h-[75vh] max-w-[90vw]'} p-8 pr-16 grid grid-rows-[1fr_auto] gap-4 bg-surface-200 dark:bg-surface-600 drop-shadow-xl overflow-auto"
        >
            <div
                class="{max
                    ? 'max-w-[calc(100%)] min-w-[calc(90vw-6rem)] md:min-w-[calc(80vw-6rem)] lg:mw-[calc(75vw-6rem)] xl:mw-[calc(60vw-6rem)]'
                    : ''} flex flex-col gap-4"
            >
                <slot />
            </div>
            <div class="flex justify-end h-12">
                <Button on:click={close}>Close</Button>
            </div>
        </div>
        <div class="{open ? 'pointer-events-auto' : ''} absolute top-2 right-0">
            <button class="btn" on:click={() => (fullscreen = !fullscreen)}>
                <div class={fullscreen ? "hidden" : ""}>
                    <Icon icon="expand" />
                </div>
                <div class={fullscreen ? "" : "hidden"}>
                    <Icon icon="compress" />
                </div>
            </button>
        </div>
    </div>
</div>

<div
    role="none"
    class="{open ? '' : 'opacity-0 pointer-events-none'} fixed inset-0 bg-white/20 dark:bg-black/30 backdrop-blur-[2px] transition-all duration-400"
    style="z-index: {z - 1}"
    on:click={close}
/>

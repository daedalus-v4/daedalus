<script lang="ts">
    import { beforeNavigate } from "$app/navigation";
    import { getModalStore } from "@skeletonlabs/skeleton";
    import Button from "./Button.svelte";

    const modalStore = getModalStore();

    export let base: unknown;
    export let data: unknown;
    export let diff: (x: any, y: any) => boolean;

    export let save: () => any = () => {};

    let saving = false;

    function reset() {
        data = structuredClone(base);
    }

    async function onsave() {
        saving = true;

        try {
            await save();
            base = structuredClone(data);
        } catch (error) {
            modalStore.trigger({
                type: "alert",
                body: `${error}`,
                buttonTextCancel: "OK",
                modalClasses: "dark:bg-surface-600",
            });
        }

        saving = false;
    }

    let unsaved = false;
    $: base, data, (unsaved = diff(base, data));

    let shake = 0;

    beforeNavigate(({ cancel }) => unsaved && (cancel(), shake++, setTimeout(() => shake--, 250)));
</script>

<svelte:window on:keydown={(e) => (e.ctrlKey || e.metaKey) && e.key === "s" && [e.preventDefault(), unsaved && onsave()]} />

<div
    id="track-changes"
    class="{shake > 0 ? 'shake bg-red-300 dark:bg-red-800' : 'bg-surface-50 dark:bg-surface-900'} z-10 fixed left-0 right-0 {unsaved
        ? 'bottom-20 show'
        : '-bottom-32'} flex items-center justify-between mx-4 sm:mx-12 md:mx-24 lg:mx-32 xl:mx-48 px-5 py-3 rounded drop-shadow-2xl"
>
    <p class="text-surface-500 dark:text-surface-300">YOU HAVE UNSAVED CHANGES</p>
    <flex class="flex items-center gap-2">
        <Button variant="error-text-only" disabled={saving} on:click={reset}>RESET</Button>
        <Button variant="primary" disabled={saving} on:click={onsave}>SAVE</Button>
    </flex>
</div>

{#if saving}
    <div class="fixed inset-0" style="z-index: 1000" />
{/if}

<style lang="postcss">
    #track-changes:not(.show) {
        transition: bottom 320ms cubic-bezier(0.4, -0.32, 1, 0.6), background-color 200ms;
    }

    #track-changes.show {
        transition: bottom 320ms cubic-bezier(0.4, 1, 0.6, 1.2), background-color 200ms;
    }

    @keyframes shake {
        0% {
            translate: 0;
        }

        16% {
            translate: 2px 1px;
        }

        33% {
            translate: -1px -2px;
        }

        49% {
            translate: 2px 0;
        }

        66% {
            translate: -2px 1px;
        }

        83% {
            translate: 1px 2px;
        }

        100% {
            translate: 0;
        }
    }

    #track-changes.shake {
        animation: shake 200ms infinite;
    }
</style>

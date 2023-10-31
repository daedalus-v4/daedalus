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

    beforeNavigate(({ cancel }) => unsaved && (confirm("Are you sure you want to leave this page? Unsaved changes will be lost.") || cancel()));
</script>

<div
    id="track-changes"
    class="z-10 fixed left-0 right-0 {unsaved
        ? 'bottom-20 show'
        : '-bottom-32'} flex items-center justify-between mx-4 sm:mx-12 md:mx-24 lg:mx-32 xl:mx-48 px-5 py-3 rounded bg-surface-50 dark:bg-surface-900 drop-shadow-2xl"
>
    <p class="text-surface-500 dark:text-surface-300">YOU HAVE UNSAVED CHANGES</p>
    <flex class="flex items-center gap-2">
        <Button variant="error-text-only" disabled={saving} on:click={reset}>RESET</Button>
        <Button variant="primary" disabled={saving} on:click={onsave}>SAVE</Button>
    </flex>
</div>

<style lang="postcss">
    #track-changes:not(.show) {
        transition: bottom 320ms cubic-bezier(0.4, -0.32, 1, 0.6);
    }

    #track-changes.show {
        transition: bottom 320ms cubic-bezier(0.4, 1, 0.6, 1.2);
    }
</style>

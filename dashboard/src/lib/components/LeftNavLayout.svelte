<script lang="ts">
    import { navigating } from "$app/stores";
    import Icon from "$lib/components/Icon.svelte";
    import Loading from "$lib/components/Loading.svelte";
    import Panel from "$lib/components/Panel.svelte";

    let open = false;

    export let links: { link: string; icon: string; label: string; selected: boolean }[];
</script>

<div class="h-full w-screen grid grid-cols-[min-content_1fr]">
    <div
        class="z-10 h-[calc(100vh-8rem)] {open
            ? 'w-[calc(max(80vw,320px))]'
            : 'w-12'} lg:w-[min-content] fixed lg:relative flex flex-col bg-surface-300 dark:bg-surface-800 overflow-x-hidden overflow-y-auto"
        style="transition: width 200ms"
    >
        {#each links as { link, icon, label, selected }}
            <a
                href={link}
                class="px-4 py-2 flex flex-row gap-4 whitespace-nowrap {selected ? 'bg-black/10 dark:bg-white/5' : ''} hover:bg-black/20 dark:hover:bg-white/10"
            >
                <div class="w-4 h-4"><Icon {icon} class="w-4 h-4" /></div>
                <div>{label}</div>
            </a>
        {/each}
    </div>
    <div class="relative h-[calc(100vh-8rem)] col-span-2 lg:col-span-1 ml-16 lg:ml-0 pt-4 lg:pt-8 pb-24 px-4 lg:px-8 flex flex-col gap-4 overflow-y-auto">
        {#if !$navigating}
            <slot />
        {:else}
            <div class="absolute inset-0 grid items-center justify-center">
                <Panel>
                    <div class="flex items-center gap-4">
                        <Loading size="24" />
                        <h2 class="h2">Loading Data...</h2>
                    </div>
                </Panel>
            </div>
        {/if}
    </div>
</div>

<div
    class="z-10 fixed block lg:hidden {open
        ? 'left-[calc(max(80vw,320px)+0.5rem)] rotate-180'
        : 'left-12'} top-0 bottom-0 flex items-center transition-left duration-200"
>
    <button class="rounded-full {open ? 'btn-icon variant-filled' : 'p-2'}" on:click={() => (open = !open)}>
        <Icon icon="angle-right" />
    </button>
</div>

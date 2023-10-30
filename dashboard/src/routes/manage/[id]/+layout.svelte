<script lang="ts">
    import { page } from "$app/stores";
    import Icon from "$lib/components/Icon.svelte";
    import { modules } from "shared";

    const { id } = $page.params;
</script>

<div class="h-full grid grid-cols-[min-content_1fr]">
    <div class="h-full bg-surface-300 dark:bg-surface-800 overflow-y-auto">
        <div class="h-0 flex flex-col">
            <a href="/manage/{id}" class="px-4 py-2 flex flex-row gap-4 items-center whitespace-nowrap hover:bg-black/10 dark:hover:bg-white/5">
                <Icon icon="gear" class="w-4 h-4" />
                Guild Settings
            </a>
            <a href="/manage/{id}/api" class="px-4 py-2 flex flex-row gap-4 items-center whitespace-nowrap hover:bg-black/10 dark:hover:bg-white/5">
                <Icon icon="code" class="w-4 h-4" />
                API Tokens &amp; Settings
            </a>
            {#each Object.entries(modules) as [mid, module]}
                <a href="/manage/{id}/{mid}" class="px-4 py-2 flex flex-row gap-4 items-center whitespace-nowrap hover:bg-black/10 dark:hover:bg-white/5">
                    {#if module.icon}<Icon icon={module.icon} class="w-4 h-4" />{/if}
                    {module.name}
                </a>
            {/each}
        </div>
    </div>
    <div class="h-full overflow-y-auto">
        <div class="h-0 p-4 lg:p-8">
            <slot />
        </div>
    </div>
</div>

<script lang="ts">
    import { insert, swap, without } from "$lib/utils";
    import Icon from "./Icon.svelte";

    export let array: any[];
    export let index: number;
    export let limit: number;
</script>

<div class="flex items-center gap-4">
    {#if index !== 0}
        <button class="p-2 text-surface-500 dark:text-surface-300" on:click={() => (array = swap(array, index, index - 1))}>
            <Icon icon="angle-up" />
        </button>
    {/if}
    {#if index !== array.length - 1}
        <button class="p-2 text-surface-500 dark:text-surface-300" on:click={() => (array = swap(array, index, index + 1))}>
            <Icon icon="angle-down" />
        </button>
    {/if}
    {#if array.length < limit}
        <button class="p-2 text-surface-500 dark:text-surface-300" on:click={() => (array = insert(array, index, structuredClone(array[index])))}>
            <Icon icon="clone" />
        </button>
    {/if}
    <button class="p-2 text-error-400" on:click={() => (array = without(array, index))}>
        <Icon icon="trash" />
    </button>
</div>

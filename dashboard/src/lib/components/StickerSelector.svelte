<script lang="ts">
    import { page } from "$app/stores";
    import { stickerSelectorModalStore } from "$lib/stores";
    import type { TFSticker } from "shared";
    import Button from "./Button.svelte";
    import Icon from "./Icon.svelte";

    export let selected: string[];
    const stickers: TFSticker[] = $page.data.stickers;
    const stickerMap = Object.fromEntries(stickers.map((e) => [e.id, e]));
    const indexMap = Object.fromEntries(stickers.map((e, i) => [e.id, i]));

    function open() {
        $stickerSelectorModalStore = {
            selected,
            select(id, set) {
                if (selected.includes(id)) set((selected = selected.filter((x) => x !== id)));
                else set((selected = [...selected, id].sort((x, y) => indexMap[x] - indexMap[y])));
            },
        };
    }
</script>

<div class="flex flex-wrap gap-3">
    {#each selected as id}
        <span class="badge px-4 text-sm flex items-center rounded outline outline-surface-500 dark:outline-surface-300">
            <button class="w-4" on:click={() => (selected = selected.filter((x) => x !== id))}>
                {#if id.match(/^[1-9][0-9]{16,19}$/)}
                    <img src={stickerMap[id]?.url} alt={stickerMap[id]?.name ?? ""} />
                {:else}
                    {id}
                {/if}
            </button>
            <span class="text-surface-600 dark:text-surface-100">
                {stickerMap[id]?.name ?? `Invalid Sticker: ${id}`}
            </span>
        </span>
    {/each}
    <Button on:click={open}><Icon icon="edit" /></Button>
    <Button variant="error-text" on:click={() => (selected = [])}><Icon icon="xmark" /></Button>
</div>

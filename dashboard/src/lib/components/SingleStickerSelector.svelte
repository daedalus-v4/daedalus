<script lang="ts">
    import { page } from "$app/stores";
    import { stickerSelectorModalStore } from "$lib/stores";
    import type { TFSticker } from "shared";
    import Button from "./Button.svelte";
    import Icon from "./Icon.svelte";

    export let selected: string | null;
    const stickers: TFSticker[] = $page.data.stickers;
    const stickerMap = Object.fromEntries(stickers.map((e) => [e.id, e]));

    function open() {
        $stickerSelectorModalStore = {
            selected: selected ? [selected] : [],
            select(id, set) {
                if (selected === id) {
                    selected = null;
                    set([]);
                } else set([(selected = id)]);
            },
        };
    }
</script>

<div class="flex flex-wrap gap-3">
    {#if selected}
        <span class="badge px-4 text-sm flex items-center rounded outline outline-surface-500 dark:outline-surface-300">
            <button class="w-4" on:click={() => (selected = null)}>
                {#if selected.match(/^[1-9][0-9]{16,19}$/)}
                    <img src={stickerMap[selected]?.url} alt={stickerMap[selected]?.name ?? ""} />
                {:else}
                    {selected}
                {/if}
            </button>
            <span class="text-surface-600 dark:text-surface-100">
                {stickerMap[selected]?.name ?? `Invalid Sticker: ${selected}`}
            </span>
        </span>
    {/if}
    <Button on:click={open}><Icon icon="edit" /></Button>
    <Button variant="error-text" on:click={() => (selected = null)}><Icon icon="xmark" /></Button>
</div>

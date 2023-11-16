<script lang="ts">
    import { page } from "$app/stores";
    import { stickerSelectorModalStore } from "$lib/stores";
    import { fuzzy } from "$lib/utils";
    import type { TFSticker } from "shared";
    import Modal from "./Modal.svelte";

    $: _ = $stickerSelectorModalStore;

    $: select = _?.select;
    $: selected = _?.selected;

    const stickers: TFSticker[] = $page.data.stickers ?? [];

    function pick(id: string) {
        select?.(id, (x: any) => (selected = x));
    }

    let input: string;
</script>

<Modal max z={80} open={!!$stickerSelectorModalStore} on:close={() => ($stickerSelectorModalStore = null)}>
    <input type="search" class="input" placeholder="Search Stickers" bind:value={input} />
    <div>
        <div class="grid grid-cols-[repeat(auto-fill,120px)] gap-1 p-4 overflow-y-auto">
            {#each stickers as sticker}
                <div class={fuzzy(sticker.name, input) ? "" : "hidden"}>
                    <button class="btn p-1 {selected?.includes(sticker.id) ? 'outline' : ''}" on:click={() => pick(sticker.id)}>
                        <img src={sticker.url} alt={sticker.name} />
                    </button>
                </div>
            {/each}
        </div>
    </div>
</Modal>

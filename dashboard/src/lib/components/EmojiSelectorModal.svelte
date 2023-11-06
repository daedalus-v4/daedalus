<script lang="ts">
    import { page } from "$app/stores";
    import getGlobalEmojis from "$lib/get-global-emojis";
    import { emojiSelectorModalStore, globalEmojiHasBeenLoadedStore, globalEmojiStore } from "$lib/stores";
    import { fuzzy } from "$lib/utils";
    import type { TFEmoji } from "shared";
    import Modal from "./Modal.svelte";

    $: _ = $emojiSelectorModalStore;

    $: select = _?.select;
    $: selected = _?.selected;

    const emojis: TFEmoji[] = $page.data.emojis;

    $: ({ global, reverseMap } = $globalEmojiStore);

    function pick(id: string) {
        select?.(id, (x: any) => (selected = x));
    }

    let input: string;

    $: _ && globalEmojiHasBeenLoadedStore.update((x) => (!x && getGlobalEmojis().then((k) => globalEmojiStore.set(k)), (x = true)));
</script>

<Modal max z={80} open={!!$emojiSelectorModalStore} on:close={() => ($emojiSelectorModalStore = null)}>
    <input type="search" class="input" placeholder="Search Emoji" bind:value={input} />
    <div>
        <div class="grid grid-cols-[repeat(auto-fill,40px)] gap-1 p-4 overflow-y-auto">
            {#each emojis as emoji}
                <div class={fuzzy(emoji.name, input) ? "" : "hidden"}>
                    <button class="btn p-1 {selected?.includes(emoji.id) ? 'outline' : ''}" on:click={() => pick(emoji.id)}>
                        <img src={emoji.url} alt={emoji.name} />
                    </button>
                </div>
            {/each}
        </div>
    </div>
    {#each global.categories as category}
        {@const filtered = new Set(category.emojis.filter((emoji) => emoji in global.emojis && fuzzy(global[emoji]?.name, input)))}

        <div class={filtered.size > 0 ? "" : "hidden"}>
            <h4 class="h4">{category.id}</h4>
            <div class="grid grid-cols-[repeat(auto-fill,40px)] gap-1 p-4 overflow-y-auto">
                {#each category.emojis as name}
                    <div class={filtered.has(name) ? "" : "hidden"}>
                        <button class="btn p-1 text-3xl">{global.emojis[name]?.skins[0].native}</button>
                    </div>
                {/each}
            </div>
        </div>
    {/each}
</Modal>

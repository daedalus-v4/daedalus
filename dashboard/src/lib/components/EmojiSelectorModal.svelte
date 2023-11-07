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

    const emojis: TFEmoji[] = $page.data.emojis ?? [];

    $: ({ global } = $globalEmojiStore);

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
            {#each global.categories as category}
                {@const filtered = new Set(category.emojis.filter((name) => fuzzy(name, input?.replace(" ", "_"))))}
                {#each category.emojis as name}
                    {@const char = global.emojis[name]?.skins[0].native}
                    {#if char}
                        <div class={filtered.has(name) ? "" : "hidden"}>
                            <button class="btn p-1 text-3xl {selected?.includes(char) ? 'outline' : ''}" on:click={() => pick(char)}>{char}</button>
                        </div>
                    {/if}
                {/each}
            {/each}
        </div>
    </div>
</Modal>

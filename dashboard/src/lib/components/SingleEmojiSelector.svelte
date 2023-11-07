<script lang="ts">
    import { page } from "$app/stores";
    import getGlobalEmojis from "$lib/get-global-emojis";
    import { emojiSelectorModalStore, globalEmojiHasBeenLoadedStore, globalEmojiStore } from "$lib/stores";
    import type { TFEmoji } from "shared";
    import { onMount } from "svelte";
    import Button from "./Button.svelte";
    import Icon from "./Icon.svelte";

    export let selected: string | null;
    const emojis: TFEmoji[] = $page.data.emojis;
    const emojiMap = Object.fromEntries(emojis.map((e) => [e.id, e]));

    function open() {
        $emojiSelectorModalStore = {
            selected: selected ? [selected] : [],
            select(id, set) {
                if (selected === id) {
                    selected = null;
                    set([]);
                } else set([(selected = id)]);
            },
        };
    }

    onMount(() => globalEmojiHasBeenLoadedStore.update((x) => (!x && getGlobalEmojis().then((k) => globalEmojiStore.set(k)), (x = true))));
</script>

<div class="flex flex-wrap gap-3">
    {#if selected}
        <span class="badge px-4 text-sm flex items-center rounded outline outline-surface-500 dark:outline-surface-300">
            <button class="w-4" on:click={() => (selected = null)}>
                {#if selected.match(/^[1-9][0-9]{16,19}$/)}
                    <img src={emojiMap[selected]?.url} alt={emojiMap[selected]?.name ?? ""} />
                {:else}
                    {selected}
                {/if}
            </button>
            <span class="text-surface-600 dark:text-surface-100">
                {selected.match(/^[1-9][0-9]{16,19}$/)
                    ? emojiMap[selected]?.name ?? `Invalid Emoji: ${selected}`
                    : $globalEmojiStore.reverseMap[selected] ?? "Unknown Emoji"}
            </span>
        </span>
    {/if}
    <Button on:click={open}><Icon icon="edit" /></Button>
    <Button variant="error-text" on:click={() => (selected = null)}><Icon icon="xmark" /></Button>
</div>

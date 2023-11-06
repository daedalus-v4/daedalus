<script lang="ts">
    import { page } from "$app/stores";
    import { emojiSelectorModalStore } from "$lib/stores";
    import type { TFEmoji } from "shared";
    import Button from "./Button.svelte";
    import Icon from "./Icon.svelte";

    export let selected: string[];
    const emojis: TFEmoji[] = $page.data.emojis;
    const emojiMap = Object.fromEntries(emojis.map((e) => [e.id, e]));
    const indexMap = Object.fromEntries(emojis.map((e, i) => [e.id, i]));

    function open() {
        $emojiSelectorModalStore = {
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
                <img src={emojiMap[id]?.url} alt={emojiMap[id]?.name ?? "x"} />
            </button>
            <span class="text-surface-600 dark:text-surface-100">
                {emojiMap[id]?.name ?? `Invalid Emoji: ${id}`}
            </span>
        </span>
    {/each}
    <Button on:click={open}><Icon icon="edit" /></Button>
    <Button variant="error-text" on:click={() => (selected = [])}><Icon icon="xmark" /></Button>
</div>

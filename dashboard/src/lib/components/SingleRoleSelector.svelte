<script lang="ts">
    import { page } from "$app/stores";
    import { roleSelectorModalStore } from "$lib/stores";
    import type { TFRole } from "shared";
    import Button from "./Button.svelte";
    import Icon from "./Icon.svelte";

    export let showManaged: boolean = false;
    export let showHigher: boolean = false;
    export let showEveryone: boolean = false;

    export let selected: string | null;

    const map: Record<string, TFRole> = Object.fromEntries($page.data.roles.map((x: TFRole) => [x.id, x]));

    function open() {
        $roleSelectorModalStore = {
            showManaged,
            showHigher,
            showEveryone,
            select(id, set) {
                if (selected === id) {
                    selected = null;
                    set([]);
                } else set([(selected = id)]);
            },
            selected: selected ? [selected] : [],
        };
    }
</script>

<div class="flex flex-wrap gap-3">
    {#if selected}
        <span
            class="badge px-4 text-sm flex rounded-full"
            style="color: #{map[selected].color.toString(16).padStart(6, '0')}; outline: 1px solid #{map[selected].color.toString(16).padStart(6, '0')}"
        >
            <button on:click={() => (selected = null)}>
                <Icon icon="circle-xmark" />
            </button>
            <span class="text-surface-900 dark:text-surface-50">
                {map[selected].name}
            </span>
        </span>
    {/if}
    <Button on:click={open}><Icon icon="edit" /></Button>
    <Button variant="error-text" on:click={() => (selected = null)}><Icon icon="xmark" /></Button>
</div>

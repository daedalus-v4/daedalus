<script lang="ts">
    import { page } from "$app/stores";
    import { getModalStore } from "@skeletonlabs/skeleton";
    import type { TFRole } from "shared";
    import Button from "./Button.svelte";
    import Icon from "./Icon.svelte";

    const modalStore = getModalStore();

    export let showManaged: boolean = false;
    export let showHigher: boolean = false;
    export let showEveryone: boolean = false;

    export let selected: string[];

    const indexes: Record<string, number> = Object.fromEntries($page.data.roles.map((x: TFRole, i: number) => [x.id, i]));
    const map: Record<string, TFRole> = Object.fromEntries($page.data.roles.map((x: TFRole) => [x.id, x]));

    function open() {
        modalStore.trigger({
            type: "component",
            component: "RoleSelectorModalBody",
            buttonTextCancel: "close",
            meta: {
                showManaged,
                showHigher,
                showEveryone,
                select(id: string, set: any) {
                    if (selected.includes(id)) set((selected = selected.filter((x) => x !== id)));
                    else set((selected = [...selected, id].sort((x, y) => indexes[x] - indexes[y])));
                },
                selected,
            },
        });
    }
</script>

<div class="flex flex-wrap gap-3">
    {#each selected as id}
        <span
            class="badge px-4 text-sm flex rounded-full"
            style="color: #{map[id].color.toString(16).padStart(6, '0')}; outline: 1px solid #{map[id].color.toString(16).padStart(6, '0')}"
        >
            <button on:click={() => (selected = selected.filter((x) => x !== id))}>
                <Icon icon="circle-xmark" />
            </button>
            <span class="text-surface-900 dark:text-surface-50">
                {map[id].name}
            </span>
        </span>
    {/each}
    <Button on:click={open}><Icon icon="edit" /></Button>
    <Button variant="error-text" on:click={() => (selected = [])}><Icon icon="xmark" /></Button>
</div>

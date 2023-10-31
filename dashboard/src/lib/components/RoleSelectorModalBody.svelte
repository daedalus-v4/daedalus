<script lang="ts">
    import { page } from "$app/stores";
    import { fuzzy } from "$lib/utils";
    import { getModalStore } from "@skeletonlabs/skeleton";
    import type { TFRole } from "shared";
    import type { SvelteComponent } from "svelte";
    import Button from "./Button.svelte";

    export let parent: SvelteComponent;

    const modalStore = getModalStore();
    let { showManaged, showHigher, showEveryone, select, selected } = $modalStore[0]?.meta ?? { selected: [] };

    const roles: TFRole[] = $page.data.roles;

    let input: string;

    function pick(id: string) {
        select(id, (x: any) => (selected = x));
    }
</script>

<div class="w-screen mx-[calc(max(5%,50%-640px))]">
    <div class="max-h-[75vh] p-8 flex flex-col items-end gap-8 rounded-lg overflow-y-auto bg-surface-300 dark:bg-surface-600">
        <input type="search" class="input" placeholder="Search Roles" bind:value={input} />
        <div class="w-full grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-1 p-2 overflow-y-auto">
            {#each roles as role}
                {#if (showManaged || !role.managed) && (showHigher || !role.higher) && (showEveryone || !role.everyone) && fuzzy(role.name, input)}
                    <button
                        class="btn flex flex-col items-start"
                        style={selected.includes(role.id)
                            ? `background-color: #${role.color.toString(16).padStart(6, "0")}; color: ${
                                  (role.color >> 16) * 0.299 + ((role.color >> 8) & 0xff) * 0.587 + (role.color & 0xff) * 0.114 > 186 ? "#000000" : "#ffffff"
                              }`
                            : role.color
                            ? `outline: 1px solid #${role.color.toString(16).padStart(6, "0")}`
                            : ""}
                        on:click={() => pick(role.id)}>{role.name}</button
                    >
                {/if}
            {/each}
        </div>
        <Button on:click={parent.onClose}>{parent.buttonTextCancel}</Button>
    </div>
</div>

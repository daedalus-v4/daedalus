<script lang="ts">
    import { page } from "$app/stores";
    import { roleSelectorModalStore } from "$lib/stores";
    import { fuzzy } from "$lib/utils";
    import type { TFRole } from "shared";
    import Modal from "./Modal.svelte";

    $: _ = $roleSelectorModalStore;

    $: showManaged = _?.showManaged;
    $: showHigher = _?.showHigher;
    $: showEveryone = _?.showEveryone;
    $: select = _?.select;
    $: selected = _?.selected;

    let input: string;

    let roles: TFRole[];
    $: roles = $page.data.roles ?? [];

    function pick(id: string) {
        select?.(id, (x: any) => (selected = x));
    }
</script>

<Modal open={!!$roleSelectorModalStore} on:close={() => ($roleSelectorModalStore = null)}>
    <div class="w-[calc(90vw-4rem)] lg:w-[75vw] min-h-[calc(75vh-7rem)] p-8">
        <input type="search" class="input" placeholder="Search Roles" bind:value={input} />
        <div>
            <div class="grid grid-cols-[repeat(auto-fill,minmax(min(180px,100%),1fr))] gap-1 p-4 overflow-y-auto">
                {#each roles as role}
                    {#if (showManaged || !role.managed) && (showHigher || !role.higher) && (showEveryone || !role.everyone) && fuzzy(role.name, input)}
                        <button
                            class="btn block"
                            style={selected?.includes(role.id)
                                ? `background-color: #${role.color.toString(16).padStart(6, "0")}; color: ${
                                      (role.color >> 16) * 0.299 + ((role.color >> 8) & 0xff) * 0.587 + (role.color & 0xff) * 0.114 > 186
                                          ? "#000000"
                                          : "#ffffff"
                                  }`
                                : role.color
                                ? `outline: 1px solid #${role.color.toString(16).padStart(6, "0")}`
                                : ""}
                            on:click={() => pick(role.id)}
                        >
                            <div class="text-left truncate">
                                {role.name}
                            </div>
                        </button>
                    {/if}
                {/each}
            </div>
        </div>
    </div>
</Modal>

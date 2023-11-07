<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import CommandPermissionModal from "$lib/components/CommandPermissionModal.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import ModuleSaver from "$lib/components/ModuleSaver.svelte";
    import P from "$lib/components/P.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import { commandPermissionsModalStore } from "$lib/stores";
    import type { FEModulesPermissionsSettings } from "$lib/types";
    import { fuzzy } from "$lib/utils";
    import { SlideToggle } from "@skeletonlabs/skeleton";
    import { modules } from "shared";

    let base: FEModulesPermissionsSettings = $page.data.data;
    let data = browser ? structuredClone(base) : base;

    let input: string;

    const closed: Record<string, boolean> = {};

    function open(mid: string, cid: string) {
        $commandPermissionsModalStore = { mid, cid, settings: data.commands[cid], set: (x) => (data.commands[cid] = x) };
    }
</script>

<ModuleSaver bind:base bind:data />

<input type="search" class="input" placeholder="Find Modules / Commands" bind:value={input} />

{#each Object.entries(modules) as [mid, module]}
    {@const showModule = fuzzy(module.name, input)}
    {@const commands = showModule
        ? Object.entries(module.commands ?? {})
        : Object.entries(module.commands ?? {}).filter(([, command]) => fuzzy(command.name, input))}

    <Panel class={showModule || commands.length > 0 ? "" : "hidden"}>
        <h3 class="h3 flex flex-wrap items-center gap-4 pl-2">
            <button class="text-sm" on:click={() => (closed[mid] = !closed[mid])}>
                <div class="{closed[mid] ? '-rotate-90' : ''} transition-rotate duration-100"><Icon icon="angle-down" /></div>
            </button>
            <SlideToggle name="" size="sm" bind:checked={data.modules[mid].enabled} />
            {#if module.icon}<Icon icon={module.icon} />{/if}
            {module.name}
        </h3>
        <div class="w-full {closed[mid] ? 'hidden' : ''}">
            <P>{module.description}</P>
            {#if commands.length > 0}<br />{/if}
            <div class="grid grid-cols-[repeat(auto-fill,minmax(min(360px,100%),1fr))] gap-2">
                {#each commands as [cid, command]}
                    <Panel
                        class={JSON.stringify(base.commands[cid]) === JSON.stringify(data.commands[cid])
                            ? ""
                            : "outline outline-2 outline-primary-600/50 dark:outline-primary-500"}
                    >
                        <h4 class="h4 flex flex-wrap items-center gap-4">
                            <button on:click={() => open(mid, cid)}><Icon icon="gear" /></button>
                            <SlideToggle name="" size="sm" bind:checked={data.commands[cid].enabled} />
                            {#if command.icon}<Icon icon={command.icon} />{/if}
                            {command.name}
                        </h4>
                        <P>{command.description}</P>
                    </Panel>
                {/each}
            </div>
        </div>
    </Panel>
{/each}

<CommandPermissionModal />

<script lang="ts">
    import { page } from "$app/stores";
    import Breadcrumbs from "$lib/components/Breadcrumbs.svelte";
    import Container from "$lib/components/Container.svelte";
    import Header from "$lib/components/Header.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import P from "$lib/components/P.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import type { ModuleData } from "shared";

    const module: ModuleData[keyof ModuleData] = $page.data.module;
</script>

<Header>
    <p class="text-3xl"><b>Daedalus</b> Documentation</p>
    <p class="text-xl text-primary-700 dark:text-primary-300"><b>{module.name}</b> Module</p>
</Header>

<Container main>
    <Breadcrumbs
        links={[
            ["/docs", "Docs"],
            ["/docs/modules-commands", "Modules & Commands"],
            [`/docs/modules/${$page.params.module}`, module.name],
        ]}
    />

    <h2 class="h2 flex items-center gap-4">
        {#if module.icon}<Icon icon={module.icon} />{/if}
        {module.name} Module
    </h2>
    <P>{module.description}</P>

    {#each Object.entries(module.commands ?? {}) as [id, command]}
        <Panel class="w-full">
            <div>
                <span {id} class="relative -top-24" />
                <h3 class="h3 flex items-center gap-4">
                    {#if command.icon}<Icon icon={command.icon} />{/if} /{id}
                </h3>
            </div>
            <P>{command.description}</P>
            <div class="table-container">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Syntax</th>
                            <th>Information</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each command.syntaxes as [syntax, information]}
                            <tr>
                                <td><div class="text-[24px]"><code class="code text-sm">{syntax}</code></div></td>
                                <td><div class="text-lg">{@html information}</div></td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </Panel>
    {/each}
</Container>

<script lang="ts">
    import Breadcrumbs from "$lib/components/Breadcrumbs.svelte";
    import Button from "$lib/components/Button.svelte";
    import Container from "$lib/components/Container.svelte";
    import Header from "$lib/components/Header.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import P from "$lib/components/P.svelte";
    import { fuzzy } from "$lib/utils";
    import { modules } from "../../../../../shared";

    let query: string;

    $: moduleList = Object.entries(modules)
        .map<[string, (typeof modules)[0], [string, Exclude<(typeof modules)[0]["commands"], undefined>[0]][]]>(([mid, module]) => [
            mid,
            module,
            Object.entries(module.commands ?? {}).filter(([, command]) => fuzzy(command.name, query)),
        ])
        .filter(([, module]) => fuzzy(module.name, query));

    $: commandCount = moduleList.map(([, , commandList]) => commandList.length).reduce((x, y) => x + y);
</script>

<Header>
    <p class="text-3xl"><b>Daedalus</b> Documentation</p>
    <p class="text-xl text-primary-700 dark:text-primary-300">Introduction</p>
</Header>

<Container main>
    <Breadcrumbs
        links={[
            ["/docs", "Docs"],
            ["/docs/modules-commands", "Modules & Commands"],
        ]}
    />
    <P>
        Like many bots, Daedalus' features are mostly divided into modules, with the exception of some things like logging. Each module contains functionalities
        that are of a similar purpose or integrate with each other. For example, all manual moderation commands (ban, kick, slowmode, purge) are grouped in the
        Moderation module.
    </P>
    <P>
        Disabling a module disables all commands within it as well as most automatic or user-triggered features within it (for example, disabling automod
        disables message scanning entirely).
    </P>
    <P>
        You can disable the core module and settings commands if you want, though it will prevent you from modifying some settings that will still be used by
        the bot (that is, disabling settings commands does not make the bot act as though those settings are not set).
    </P>
    <h2 class="h2">Module List</h2>
    <P>Each module is followed by its commands.</P>
    <input type="search" class="input text-xl" placeholder="Find Modules / Commands" bind:value={query} />

    <p class="text-surface-600 dark:text-surface-200">
        showing {moduleList.length} module{moduleList.length === 1 ? "" : "s"} &amp; {commandCount} command{commandCount === 1 ? "" : "s"}
    </p>

    <div class="w-full flex flex-col gap-1">
        {#each moduleList as [mid, module, commandList]}
            <div class="w-full card p-3 m-0 flex gap-3 flex-wrap">
                <a href="/docs/modules/{mid}">
                    <Button variant="primary">
                        {#if module.icon} <Icon icon={module.icon} /> {/if}
                        {module.name}
                    </Button>
                </a>
                {#each commandList as [cid, command]}
                    <a href="/docs/modules/{mid}#{cid}">
                        <Button variant="medium">
                            {#if command.icon} <Icon icon={command.icon} /> {/if}
                            {command.name}
                        </Button></a
                    >
                {/each}
            </div>
        {/each}
    </div>
</Container>

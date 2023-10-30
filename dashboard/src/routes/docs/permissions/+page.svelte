<script lang="ts">
    import A from "$lib/components/A.svelte";
    import Breadcrumbs from "$lib/components/Breadcrumbs.svelte";
    import Container from "$lib/components/Container.svelte";
    import Header from "$lib/components/Header.svelte";
    import P from "$lib/components/P.svelte";
    import PermissionLink from "$lib/components/PermissionLink.svelte";
    import { modules, permissions } from "../../../../../shared";

    const moduleList = Object.entries(modules);

    const commandList = moduleList.flatMap(([mid, module]) =>
        Object.entries(module.commands ?? {}).map<[string, string, Exclude<(typeof modules)[0]["commands"], undefined>[0]]>(([cid, command]) => [
            mid,
            cid,
            command,
        ]),
    );
</script>

<Header>
    <p class="text-3xl"><b>Daedalus</b> Documentation</p>
    <p class="text-xl text-primary-700 dark:text-primary-300">Introduction</p>
</Header>

<Container main>
    <Breadcrumbs
        links={[
            ["/docs", "Docs"],
            ["/docs/permissions", "Permissions"],
        ]}
    />
    <h2 class="h2">Default Permissions</h2>
    <P>
        Some permissions are requested by default, particularly ones that do not open the possibility for abuse or exploits and are usually granted to all or
        most members anyway.
    </P>
    <ul class="list-disc pl-4">
        <li class="pl-2">
            <P size="md">
                <PermissionLink key="ViewChannel" class="font-bold" /> is required for things like automod and autoresponder to work correctly and is required in
                log channels if you use those. If you do not grant this permission, you can still use slash commands as that bypasses this permission, but features
                where the bot sends a message not in response to a command directly will require this permission.
            </P>
        </li>
        <li class="pl-2">
            <P size="md">
                <PermissionLink key="SendMessages" class="font-bold" /> is required for the same features as <PermissionLink key="ViewChannel" />.
            </P>
        </li>
        <li class="pl-2">
            <P size="md">
                <PermissionLink key="SendMessagesInThreads" class="font-bold" /> is required for the exact same reason as <PermissionLink key="SendMessages" />.
            </P>
        </li>
        <li class="pl-2">
            <P size="md">
                <PermissionLink key="EmbedLinks" class="font-bold" /> is required because the bot posts all of its messages as embeds. If you deny this permission,
                you will see a lot of empty messages.
            </P>
        </li>
        <li class="pl-2">
            <P size="md">
                <PermissionLink key="AttachFiles" class="font-bold" /> is required because the bot regularly uploads files or posts images, e.g. in log channels
                or when there is too much data to include in a normal message. If you deny this permission, many messages won't make sense.
            </P>
        </li>
        <li class="pl-2">
            <P size="md">
                <PermissionLink key="ReadMessageHistory" class="font-bold" /> is primarily needed for operations like the purge command, since things like autoresponder
                and automod work fine as the bot can see incoming messages. However, things like reaction roles that use actual reactions (and not buttons or dropdowns)
                also require this, so it's recommended to just grant this permission.
            </P>
        </li>
        <li class="pl-2">
            <P size="md">
                <PermissionLink key="UseExternalEmojis" class="font-bold" /> is highly recommended because the bot may use emoji that come from its home/support
                server and things may not display correctly otherwise.
            </P>
        </li>
        <li class="pl-2">
            <P size="md">
                <PermissionLink key="AddReactions" class="font-bold" /> is mostly needed for adding reaction roles to other messages and for reaction-based autoresponder
                triggers. Most features should work correctly without this, but it is recommended to grant it.
            </P>
        </li>
    </ul>
    <h2 class="h2">Module-Specific</h2>
    <P>
        Some permissions are more privileged and require trust, and so they are presented here with a list of which modules or commands need them so you can
        remove any that you will not be using.
    </P>
    <div class="flex items-center gap-2">
        <span class="text-blue-700 dark:text-blue-400">modules</span>
        <span class="divider-vertical h-8" />
        <span class="text-green-700 dark:text-green-500">commands</span>
    </div>
    <ul class="list-disc pl-4">
        {#each Object.keys(permissions) as key}
            {@const relevantModules = moduleList.filter(([, module]) => module.selfPermissions?.includes(key))}
            {@const relevantCommands = commandList.filter(([, , command]) => command.selfPermissions?.includes(key))}
            {#if relevantModules.length + relevantCommands.length > 0}
                <li class="pl-2">
                    <PermissionLink {key} class="font-bold" />
                    <ul class="list-disc pl-4">
                        {#each relevantModules as [id, module]}
                            <li class="pl-2">
                                <a href="/docs/module/{id}" class="text-blue-700 dark:text-blue-400">
                                    {module.name}
                                </a>
                            </li>
                        {/each}
                        {#each relevantCommands as [mid, cid, command]}
                            <li class="pl-2">
                                <a href="/docs/module/{mid}#{cid}" class="text-green-700 dark:text-green-500">
                                    {command.name}
                                </a>
                            </li>
                        {/each}
                    </ul>
                </li>
            {/if}
        {/each}
    </ul>
    <h2 class="h2">Permission Info</h2>
    <P>
        Permissions can be difficult to manage and understand. If you are uncertain on what certain permissions exactly entail, you can find information on each
        of them <A to="/docs/guides/permissions">here</A>.
    </P>
</Container>

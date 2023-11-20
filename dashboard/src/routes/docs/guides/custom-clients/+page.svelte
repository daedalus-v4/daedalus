<script lang="ts">
    import A from "$lib/components/A.svelte";
    import Breadcrumbs from "$lib/components/Breadcrumbs.svelte";
    import Container from "$lib/components/Container.svelte";
    import Header from "$lib/components/Header.svelte";
    import P from "$lib/components/P.svelte";
</script>

<Header>
    <p class="text-3xl"><b>Daedalus</b> Documentation</p>
    <p class="text-xl text-primary-700 dark:text-primary-300">Custom Clients</p>
</Header>

<Container main>
    <Breadcrumbs
        links={[
            ["/docs", "Docs"],
            ["/docs/guides", "Guides"],
            ["/docs/guides/custom-clients", "Custom Clients"],
        ]}
    />

    <P>
        Custom clients are a feature available with <A to="/premium">Daedalus Ultimate Premium</A>. It allows you to set up a custom bot account and run
        Daedalus through it, giving full control over the bot's avatar, username, and bio.
    </P>

    <P>Here is a list of what you need to keep in mind before using this feature:</P>

    <ul class="list-disc pl-4">
        <li class="text-lg pl-2 py-1">
            Modmail behavior is improved when using custom clients. When the user DMs your bot, they will be asked for confirmation that they want to message
            your server instead of receiving a server selection. This makes the process simpler and faster.
        </li>
        <li class="text-lg pl-2 py-1">
            Reaction role prompts and ticket prompts must be set up again when switching clients, as the old prompt will not respond. You can do this by just
            going into the module settings and clicking "Save". The new client will post all of the prompts (if possible). The old ones will also be deleted if
            possible, as the client does not check that it was the one who posted them.
        </li>
        <li class="text-lg pl-2 py-1">
            You should kick any clients not in use as they pollute the command list. When you switch to a custom client, you should remove the Daedalus bot
            account itself from your server.
        </li>
        <li class="text-lg pl-2 py-1">
            You should not run any other bots in the same account as a Daedalus client. Daedalus periodically overwrites the command list which will cause
            interference. Additionally, message components may cause problems as Discord bots cannot detect which process is supposed to handle a given
            component. If you decide to operate a separate bot alongside Daedalus in the same client, you are responsible for any issues that occur.
        </li>
    </ul>

    <P>
        Before using this feature, make sure you read the disclaimer in the info pop-up in the Premium settings page. This feature can only be managed by the
        server owner.
    </P>
</Container>

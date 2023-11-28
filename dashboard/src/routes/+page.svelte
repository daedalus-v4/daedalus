<script lang="ts">
    import { page } from "$app/stores";
    import { PUBLIC_SUPPORT_SERVER } from "$env/static/public";
    import A from "$lib/components/A.svelte";
    import Button from "$lib/components/Button.svelte";
    import Container from "$lib/components/Container.svelte";
    import Header from "$lib/components/Header.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import P from "$lib/components/P.svelte";
    import invite from "$lib/invite";
</script>

<Header>
    <p class="text-3xl"><b>Daedalus</b> Dashboard</p>
    <p class="text-xl text-primary-700 dark:text-primary-300">Proudly serving {$page.data.guildCount} guild{$page.data.guildCount === 1 ? "" : "s"}</p>
    {#if $page.data.user}
        <a href="/manage">
            <Button><Icon icon="gear" /> Manage</Button>
        </a>
    {:else}
        <a href="/auth/login?{new URLSearchParams({ redirect: $page.url.pathname })}">
            <Button><Icon icon="discord" brand /> Log In</Button>
        </a>
    {/if}
</Header>

<div class="bg-surface-50 dark:bg-surface-900 py-4">
    <Container class="flex gap-2" style="margin-top: 0; margin-bottom: 0">
        <span>Check out the <A to="/docs/guides/v3-v4-migration">v3 &rightarrow; v4 Migration Guide</A>!</span>
        &mdash;
        <span><A to="/premium/why">Why we're introducing Premium</A></span>
    </Container>
</div>

<Container main>
    <h2 class="h2 pt-8">Welcome to the <span class="text-primary-500 dark:text-primary-400">future of server management</span></h2>
    <P>
        Daedalus offers a high-quality, highly-customizable, and modern out-of-the-box experience. Offer only the best for your server members and server staff
        with advanced functionality, intuitive design, and features designed with convenience and accessibility in mind.
    </P>
    <P>
        See something you need but we don't have? We're constantly implementing new features and enhancing existing ones to continuously build a better
        experience for you, so stop by our <A to={PUBLIC_SUPPORT_SERVER} external>support server</A> and let us know what you need!
    </P>
    <h2 class="h2 pt-8">Why Daedalus?</h2>
    <P>
        We're glad you ask! Our philosophy is that you should never settle for what a bot provides you, and while not every server can have its own custom-made
        bot tailored for its needs, we provide you the next best thing &mdash; a bot with enough customization and features that you can fit it to whatever you
        need.
    </P>
    <P>
        Daedalus is also transparent about its permissions. You shouldn't trust a bot or user with more permissions than they need, and we don't expect you to
        compromise on that. We provide documentation about the permissions each module/command needs, and if you're not planning on using a feature, you are
        welcome and encouraged to remove those permissions.
    </P>
    <h2 class="h2 pt-8">I'm in &mdash; how do I get started?</h2>
    <P>
        To get started, <A to={invite()} external>add the bot</A>. If you'd like to restrict any permissions, check out the
        <A to="/docs/permissions">permissions documentation page</A> to see what features require which permissions and which ones you can safely remove.
    </P>
</Container>

<script lang="ts">
    import { page } from "$app/stores";
    import { PUBLIC_SUPPORT_SERVER } from "$env/static/public";
    import A from "$lib/components/A.svelte";
    import Button from "$lib/components/Button.svelte";
    import Container from "$lib/components/Container.svelte";
    import Header from "$lib/components/Header.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import Paragraph from "$lib/components/Paragraph.svelte";
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
<Container main>
    <h2 class="h2 pt-8">Welcome to the <span class="text-primary-500 dark:text-primary-400">future of server management</span></h2>
    <Paragraph>
        Daedalus offers a high-quality, highly-customizable, and modern out-of-the-box experience. Offer only the best for your server members and server staff
        with advanced functionality, intuitive design, and features designed with convenience and accessibility in mind.
    </Paragraph>
    <Paragraph>
        See something you need but we don't have? We're constantly implementing new features and enhancing existing ones to continuously build a better
        experience for you, so stop by our <A to={PUBLIC_SUPPORT_SERVER} external>support server</A> and let us know what you need!
    </Paragraph>
    <h2 class="h2 pt-8">Why Daedalus?</h2>
    <Paragraph>
        We're glad you ask! Our philosophy is that you should never settle for what a bot provides you, and while not every server can have its own custom-made
        bot tailored for its needs, we provide you the next best thing &mdash; a bot with enough customization and features that you can fit it to whatever you
        need.
    </Paragraph>
    <Paragraph>
        Daedalus is also transparent about its permissions. You shouldn't trust a bot or user with more permissions than they need, and we don't expect you to
        compromise on that. We provide documentation about the permissions each module/command needs and why we need them, and if you're not planning on using a
        feature, you are welcome and encouraged to remove those permissions.
    </Paragraph>
    <h2 class="h2 pt-8">I'm in &mdash; how do I get started?</h2>
    <Paragraph>
        To get started, go to our <A to="/invite">invite page</A>. You can choose some modules and commands to exclude now and you'll get an invite link with
        only the permissions the bot absolutely needs for the functionalities you'd like. If you don't want to commit now, no worries! Just leave them all
        enabled and remove permissions later, or you can remove any permissions now and add them back later.
    </Paragraph>
    <Paragraph>
        After you add the bot, you'll also find our onboarding guide on that page. If you already have the bot, feel free to check it out anyway so you're
        always up-to-date on our latest features, tips, and tricks!
    </Paragraph>
</Container>

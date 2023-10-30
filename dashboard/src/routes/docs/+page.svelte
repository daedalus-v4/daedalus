<script lang="ts">
    import Breadcrumbs from "$lib/components/Breadcrumbs.svelte";
    import Button from "$lib/components/Button.svelte";
    import Container from "$lib/components/Container.svelte";
    import Header from "$lib/components/Header.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import P from "$lib/components/P.svelte";
</script>

<Header>
    <p class="text-3xl"><b>Daedalus</b> Documentation</p>
    <p class="text-xl text-primary-700 dark:text-primary-300">Landing Page</p>
</Header>

<Container main>
    <Breadcrumbs
        links={[
            ["/docs", "Docs"],
            ["/docs", "Index"],
        ]}
    />
    <a href="/docs/introduction"><Button variant="primary-text"><Icon icon="circle-info" /> Introduction</Button></a>
    <P>View basic details about Daedalus and learn how to use this documentation.</P>
    <a href="/docs/onboarding"><Button variant="primary-text"><Icon icon="door-open" /> Onboarding</Button></a>
    <P>Get started with Daedalus with a step-by-step guide of everything we offer!</P>
    <a href="/docs/permissions"><Button variant="primary-text"><Icon icon="screwdriver-wrench" /> Permissions</Button></a>
    <P>View information on permissions Daedalus requests and which ones can be disabled depending on the modules you use.</P>
    <a href="/docs/modules-commands"><Button variant="primary-text"><Icon icon="list" /> Modules &amp; Commands</Button></a>
    <P>View a list of modules and commands and information on the bot's modular design and general information.</P>
    <a href="/docs/guides/index"><Button variant="primary-text"><Icon icon="circle-question" /> Guides</Button></a>
    <P>
        View a list of miscellaneous guides that we have written, including some related to operating a Discord server in general that are not specific to
        Daedalus.
    </P>
</Container>

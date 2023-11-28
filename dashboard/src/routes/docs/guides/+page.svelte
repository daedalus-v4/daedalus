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
    <p class="text-xl text-primary-700 dark:text-primary-300">Guides</p>
</Header>

<Container main>
    <Breadcrumbs
        links={[
            ["/docs", "Docs"],
            ["/docs/guides", "Guides"],
        ]}
    />
    <a href="/docs/guides/v3-v4-migration"><Button variant="primary-text"><Icon icon="circle-up" /> v3 &rightarrow; v4 Migration Guide</Button></a>
    <P>
        This is a comprehensive guide on how to ensure all of your features are working correctly as we upgrade Daedalus to version 4, as well as some tips for
        how you can improve your user experience with our new features.
    </P>
    <a href="/docs/guides/permissions"><Button variant="primary-text"><Icon icon="screwdriver-wrench" /> Permissions</Button></a>
    <P>
        Learn the technical details about how Discord permissions work, how to ensure your server is safe, and how to set up common structures and features in
        the easiest and most reliable way.
    </P>
    <a href="/docs/guides/custom-messages"><Button variant="primary-text"><Icon icon="message" /> Custom Messages</Button></a>
    <P>Learn how to write fully custom messages with Daedalus to give your members an immersive environment.</P>
    <a href="/docs/guides/custom-clients"><Button variant="primary-text"><Icon icon="crown" /> Custom Clients</Button></a>
    <P>Learn how to set up and operate custom clients using Daedalus Ultimate Premium, as long as the caveats of the feature and some necessary adjustments.</P>
</Container>

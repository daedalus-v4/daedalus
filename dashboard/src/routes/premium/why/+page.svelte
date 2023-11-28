<script lang="ts">
    import Container from "$lib/components/Container.svelte";
    import Header from "$lib/components/Header.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import P from "$lib/components/P.svelte";
</script>

<Header>
    <p class="text-3xl"><b>Daedalus</b> Premium</p>
    <p class="text-xl text-primary-700 dark:text-primary-300">Info Page</p>
</Header>

<Container main>
    <h3 class="h3">Why are we introducing a premium subscription?</h3>
    <P>
        Daedalus was an ambitious project that has outscaled its origins. When the true first version of Daedalus was created, it was just a bot for a single
        gaming server, Shenhe Mains.
    </P>
    <P>
        Although I am happy to pay for the hosting costs of Daedalus out of my pocket as I love the community for which Daedalus was originally created and am
        honored to have the opportunity to support so many servers, it would be nice to be able to cover the costs through the bot, and additional funding can
        go towards improving the bot by upgrading the database hosting, allowing me to purchase premium subscriptions for other servers for better metrics, etc.
    </P>
    <P>
        All of this can potentially contribute towards more stability, better monitoring and therefore response times to service degradation or interruption,
        and faster and better targeted development efforts towards implementing new features that would improve the experience for the most people.
    </P>
    <P>
        Please don't feel like you need to subscribe to support us &mdash; just using the bot supports us, and your satisfaction is all that we strive for.
        However, if you would like to gain access to some more customization features and along the way also help cover costs and allow us to scale up further,
        we would be extremely grateful for your immense support.
    </P>
    <P>
        Thank you to everyone who has supported and continues to support the bot, and we hope that we can continue providing a great experience to you and your
        server staff and members. <Icon icon="heart" class="text-red-500" />
    </P>
    <P>&mdash; HyperNeutrino</P>
</Container>

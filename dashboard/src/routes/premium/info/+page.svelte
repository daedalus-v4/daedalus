<script lang="ts">
    import A from "$lib/components/A.svelte";
    import Container from "$lib/components/Container.svelte";
    import Header from "$lib/components/Header.svelte";
    import P from "$lib/components/P.svelte";
</script>

<Header>
    <p class="text-3xl"><b>Daedalus</b> Premium</p>
    <p class="text-xl text-primary-700 dark:text-primary-300">Info Page</p>
</Header>

<Container main>
    <h2 class="h2">How Premium Works</h2>
    <P>
        Premium subscriptions are purchased through <A to="https://stripe.com" external>Stripe</A>. Billing and payment information is not sent through Daedalus
        and all of your purchases are done through Stripe's website.
    </P>
    <P>
        When you purchase a premium subscription, you will have the option to choose monthly or annual. Once you pay, it should appear in your account settings.
        Premium will not be immediately granted to a server; instead, you will find premium keys at the bottom of your account premium settings.
    </P>
    <P>
        To activate premium, go to server settings and redeem the key in the <b>Premium</b> section. If you get a premium key from a support agent or other promotion,
        you can activate it here as well.
    </P>
    <P>
        When a premium subscription ends, your premium key will stop working permanently. If you purchase another subscription, you will need to activate it
        again. Premium keys expire starting from the bottom of the list in your account settings, so if you want to control which servers' premium will expire,
        you can reorder your keys.
    </P>
</Container>

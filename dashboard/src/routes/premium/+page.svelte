<script lang="ts">
    import { page } from "$app/stores";
    import A from "$lib/components/A.svelte";
    import Button from "$lib/components/Button.svelte";
    import Container from "$lib/components/Container.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import Panel from "$lib/components/Panel.svelte";
</script>

<Container class="flex flex-col items-start gap-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Panel class="hidden lg:block">
            <div class="flex flex-col items-center py-4">
                <h2 class="h2">Free Plan</h2>
                <h5 class="h5">Free for everyone!</h5>
                <div class="grid grid-cols-[auto_1fr] items-center gap-2 mt-8">
                    <Icon icon="check" /> <span>All core functionality modules</span>
                    <Icon icon="check" /> <span>Modmail</span>
                    <Icon icon="check" /> <span>Automoderation</span>
                    <Icon icon="check" /> <span>Advanced customization</span>
                    <Icon icon="check" /> <span>5 custom commands</span>
                </div>
                <Button class="mt-8" disabled>This tier is available by default!</Button>
            </div>
        </Panel>
        <Panel>
            <div class="w-full flex flex-col items-center py-4">
                <h2 class="h2 text-primary-600 dark:text-primary-400">Basic Premium</h2>
                <h5 class="h5 flex items-center gap-4 text-primary-600 dark:text-primary-400">$5/mo <b>&middot;</b> $50/yr</h5>
                <div class="grid grid-cols-[auto_1fr] items-center gap-2 mt-8">
                    <Icon icon="check" /> <span>Everything from the free tier</span>
                    <Icon icon="check" /> <span>Cosmetic modules</span>
                    <Icon icon="check" /> <span>Raised module limits</span>
                    <Icon icon="check" /> <span>Full customization</span>
                    <Icon icon="check" /> <span>25 custom commands</span>
                </div>
                <a href={$page.data.user ? "/account/premium" : "/auth/login?redirect=/account/premium"}
                    ><Button variant="primary" class="mt-8">Subscribe Now!</Button></a
                >
            </div>
        </Panel>
        <Panel class="border-2 border-secondary-500 dark:border-secondary-400 bg-secondary-600/10 dark:bg-secondary-300/10">
            <div class="w-full flex flex-col items-center py-4">
                <h2 class="h2 text-secondary-500 dark:text-secondary-400">Ultimate Tier</h2>
                <h5 class="h5 flex items-center gap-4 text-secondary-500 dark:text-secondary-400">$10/mo <b>&middot;</b> $100/yr</h5>
                <div class="grid grid-cols-[auto_1fr] items-center gap-2 mt-8">
                    <Icon icon="check" /> <span>Everything from the basic tier</span>
                    <Icon icon="check" /> <span>Exclusive modules</span>
                    <Icon icon="check" /> <span>Custom username &amp; avatar &amp; status</span>
                    <Icon icon="check" /> <span>Fully hide unused commands</span>
                    <Icon icon="check" /> <span>100 custom commands</span>
                </div>
                <a href={$page.data.user ? "/account/premium" : "/auth/login?redirect=/account/premium"}
                    ><Button variant="secondary" class="mt-8">Subscribe Now!</Button></a
                >
            </div>
        </Panel>
    </div>
    <span class="flex gap-2">
        <A to="/premium/info">Premium Info Page</A>
        {#if $page.data.user}
            &mdash;
            <A to="/account/premium">View your subscription status <Icon icon="angle-right" /></A>
        {/if}
    </span>
</Container>

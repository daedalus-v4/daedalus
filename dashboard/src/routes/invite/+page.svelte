<script lang="ts">
    import { PUBLIC_DISCORD_ID } from "$env/static/public";
    import A from "$lib/components/A.svelte";
    import Button from "$lib/components/Button.svelte";
    import Container from "$lib/components/Container.svelte";
    import Header from "$lib/components/Header.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import P from "$lib/components/P.svelte";
</script>

<Header>
    <p class="text-3xl"><b>Daedalus</b> Dashboard</p>
    <p class="text-xl text-primary-700 dark:text-primary-300">Invite to Server</p>
</Header>

<Container main>
    <div class="flex gap-4">
        <a
            href="https://discord.com/api/oauth2/authorize?{new URLSearchParams({
                client_id: PUBLIC_DISCORD_ID,
                permissions: '1428010036470',
                scope: 'applications.commands bot',
            })}"
            target="_blank"
        >
            <Button variant="primary">
                <Icon icon="plus" />
                Invite with Regular Permissions
            </Button>
        </a>
        <span class="divider-vertical" />
        <a
            href="https://discord.com/api/oauth2/authorize?{new URLSearchParams({
                client_id: PUBLIC_DISCORD_ID,
                permissions: '8',
                scope: 'applications.commands bot',
            })}"
            target="_blank"
        >
            <Button>
                <Icon icon="plus" />
                Invite as Admin
            </Button>
        </a>
    </div>
    <P>
        It is recommended to invite the bot with regular permissions and use channel overrides to give it access to staff channels and other restricted
        channels. This is generally recommended because you should avoid granting unnecessary permissions as a best practice, but Daedalus does not store any
        information except what is needed for it to function or use any permissions it is granted that it did not need.
    </P>
    <P>
        However, you can use the admin invite link if you want, if you don't understand permissions well enough to set it up properly or if you don't want to go
        through the effort.
    </P>
    <P>
        If you want to restrict permissions even more, check the <A to="/docs/permissions">permissions info page</A> for a list of requested permissions and which
        features use them. You can remove any that are only needed for features you do not plan to use.
    </P>
</Container>

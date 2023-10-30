<script lang="ts">
    import A from "$lib/components/A.svelte";
    import Breadcrumbs from "$lib/components/Breadcrumbs.svelte";
    import Container from "$lib/components/Container.svelte";
    import Header from "$lib/components/Header.svelte";
    import Hr from "$lib/components/Hr.svelte";
    import P from "$lib/components/P.svelte";
</script>

<Header>
    <p class="text-3xl"><b>Daedalus</b> Documentation</p>
    <p class="text-xl text-primary-700 dark:text-primary-300">Introduction</p>
</Header>

<Container main>
    <Breadcrumbs
        links={[
            ["/docs", "Docs"],
            ["/docs/introduction", "Introduction"],
        ]}
    />
    <h2 class="h2">Welcome!</h2>
    <P>Welcome to the Daedalus documentation!</P>
    <P>
        The motivation behind this project was to provide a bot that is transparent about the permissions it wants and what it does, supports modern Discord
        features so you can take advantage of all of the new Discord features with Daedalus by your side instead of fighting against it, gives you the
        flexibility to set up your server how you would like, but is also straightforward enough to approach for a beginner to use.
    </P>
    <Hr />
    <h2 class="h2">Guidance</h2>
    <P>
        Most commands are fairly intuitive, but you can find a full list <A to="/docs/modules-commands">here</A> which has a list of all of the commands and full
        information on them.
    </P>
    <P>
        Additionally, the module list provides you with a list of permissions the bot needs to work. If you are not comfortable giving the bot all of the
        requested permissions, you can look through the modules you want to use to determine which permissions you can remove without causing issues with
        functionality.
    </P>
    <P>
        The <A to="/docs/permissions">permissions</A> page gives a list of requested permissions and why the bot wants them, so you can also check there to see if
        you can safely disable a permission.
    </P>
    <Hr />
    <h2 class="h2">Tech Stack</h2>
    <P>
        The bot is written in the <A to="https://bun.sh" external>Bun JavaScript Runtime</A> using <A to="https://discord.js.org" external>discord.js</A> with
        <A to="https://www.npmjs.com/package/argentium" external>Argentium</A>, my own utility library for discord.js. This dashboard is made with
        <A to="https://kit.svelte.dev" external>SvelteKit</A>, <A to="https://tailwindcss.com" external>Tailwind CSS</A>, and the
        <A to="https://www.skeleton.dev" external>Skeleton UI Toolkit</A>. The API is written using <A to="https://elysiajs.com" external>ElysiaJS</A>. The
        entire project uses <A to="https://www.mongodb.com" external>MongoDB</A>.
    </P>
</Container>

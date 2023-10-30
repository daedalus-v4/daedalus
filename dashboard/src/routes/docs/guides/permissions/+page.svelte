<script lang="ts" context="module">
    const cardStyles: Record<string, string> = { info: "bg-tertiary-400/40 dark:bg-tertiary-500/30", error: "bg-error-400/60 dark:bg-error-500/60" };
</script>

<script lang="ts">
    import A from "$lib/components/A.svelte";
    import Breadcrumbs from "$lib/components/Breadcrumbs.svelte";
    import Code from "$lib/components/Code.svelte";
    import Container from "$lib/components/Container.svelte";
    import Header from "$lib/components/Header.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import P from "$lib/components/P.svelte";
    import PermissionLink from "$lib/components/PermissionLink.svelte";
    import { permissions } from "../../../../../../shared";
</script>

<Header>
    <p class="text-3xl"><b>Daedalus</b> Documentation</p>
    <p class="text-xl text-primary-700 dark:text-primary-300">Introduction</p>
</Header>

<Container main>
    <Breadcrumbs
        links={[
            ["/docs", "Docs"],
            ["/docs/guides", "Guides"],
            ["/docs/guides/permissions", "Permissions"],
        ]}
    />
    <h2 class="h2">Introduction</h2>
    <P>
        Permissions are the way you control what users are and are not able to do on your server. Managing permissions correctly is imperative to prevent abuse
        and give your members an optimal experience.
    </P>
    <P>
        However, it can be very difficult to manage them correctly, and even small exploits that don't cause severe problems or damage can still make the server
        appear disorganized and poorly run.
    </P>
    <P>
        In this guide, we explain the details behind how permissions interact and are calculated. You can find a list of permissions at the bottom of this page.
    </P>
    <h2 class="h2">Mechanics</h2>
    <P>
        Certain actions correspond to a specific channel, and the permissions relating to those can be overridden per-channel. For example, you can control
        whether or not users can send messages at a per-channel level.
    </P>
    <P>The priority order of permissions and overrides may not be intuitive. Here's how it's calculated:</P>
    <ul class="list-disc pl-4">
        <li class="pl-2"><P size="md">If the user has a user-level override, it applies.</P></li>
        <li class="pl-2"><P size="md">If the user has any role that is allowed by a role-level override, they are allowed.</P></li>
        <li class="pl-2"><P size="md">If the user has any role that is denied by a role-level override, they are denied.</P></li>
        <li class="pl-2"><P size="md">If there is an @everyone-level override, it applies.</P></li>
        <li class="pl-2"><P size="md">If the user has any role that has that permission globally, they are allowed.</P></li>
        <li class="pl-2"><P size="md">If none of the above apply, they are denied by default.</P></li>
    </ul>
    <P>
        Crucially, role-level overrides do not follow role hierarchy; rather, if any role allows it, you are allowed, even if a higher role denies it. As such,
        you should avoid role-level allow overrides when possible as it prevents you from using role-level deny overrides properly in the future.
    </P>
    <P>
        A common mistake arising from this is with mute roles - if you give a verification role a channel override to be able to speak in a channel, then mute
        roles no longer work for verified users.
    </P>
    <P>
        Permissions that are not channel-specific like <PermissionLink key="BanMembers" /> will just check whether or not the user has any role with that permission.
    </P>
    <P>
        Some permissions will consider other permissions &mdash; for example, <PermissionLink key="SendMessages" title="sending messages" /> first requires the user
        to be able to <PermissionLink key="ViewChannel" title="view the channel" />.
    </P>
    <h2 class="h2">How To</h2>
    <h3 class="h3">Introduction</h3>
    <P>
        As positive role overrides always overrule negative ones, you generally want to minimize how often you use positive role overrides. Positive
        <b>@everyone</b> overrides are fine, since role overrides take precedence over them, but many permission setups are possible without positive role overrides,
        and when possible, you should always avoid them as they are inflexible.
    </P>
    <h3 class="h3">How do I set up a <b>verification role</b>?</h3>
    <P>
        Most servers have a role that is granted by clicking on the verification prompt to confirm that they have read the rules (and as a trivial filter
        against bots). Generally, channels will only be visible to verified users.
    </P>
    <P>
        Make sure you remember that positive overrides you grant the verified role are effectively no longer able to be denied by role-level overrides.
        Therefore, do not give verified users explicit channel overrides allowing them to send messages if you want mute roles to be able to work.
    </P>
    <P>
        The best way to make verification roles is to deny <b>@everyone</b> the base permission to view channels and grant it to the verification role globally.
        Then, all channels will, by default, be visible only to verified users. This way, you don't have to set overrides on every channel blocking
        <b>@everyone</b>.
    </P>
    <P>
        If you want a public channel that <b>@everyone</b> can see but only verified users can send messages in, you can do the same and disable sending
        messages at a global level for <b>@everyone</b> and enable it for the verification role. To then have a public channel that <b>@everyone</b> can send
        messages in, just use a positive override. Remember that <b>@everyone</b> overrides are always lower priority than role overrides, so this isn't a problem.
    </P>
    <div class="card bg-tertiary-400/40 dark:bg-tertiary-600/40">
        <P class="p-8">
            Consider using Discord's built-in verification system and just allowing <b>@everyone</b> to see and send messages in all channels! Verification roles
            offer little to no security anyway. Additionally, most bots/raids consist of user bots spamming server members' DMs, which you would not need to get
            a verification role to do. However, if you have not passed Discord's built-in verification, it will not let you DM people whose only mutual server with
            you is that server.
        </P>
    </div>
    <h3 class="h3">How do I set up <b>access roles</b>?</h3>
    <P>
        You may want to lock some channels behind access roles such as reaction roles (e.g. a discussion category that only some users want to see). You will
        have to use a positive role override in this case. Firstly, deny <b>@everyone</b> permission via an override. Then, grant the access role permission.
    </P>
    <P>
        The key point is just to avoid enabling any positive overrides except basic access (<PermissionLink key="ViewChannel" />).
    </P>
    <div class="card bg-tertiary-400/40 dark:bg-tertiary-600/40">
        <P class="p-8">
            Consider using Discord's built-in onboarding and community customization features if you have access to it. If members can self-assign the access
            roles, this makes the process much more streamlined and instead of using overrides, members can just hide channels directly from their community
            customization.
        </P>
    </div>
    <P>Note that the above doesn't apply to channels where the role isn't self-assigned, e.g. staff channels. In that case, just use the override method.</P>
    <h3 class="h3">What about <b>gallery/public read-only staff channels</b>?</h3>
    <P>
        If you are granting positive overrides to staff members, that is fine. The reason you want to avoid role-level allow overrides is that it prevents you
        from locking them out via a negative role, but you shouldn't need to mute your staff members, and if so, there is probably more that needs to be done.
        If really needed, you can just temporarily demote them or time them out.
    </P>
    <h3 class="h3">How do I set up a <b>mute role</b>?</h3>
    <P>
        Set an override in every channel that denies permissions you want muted users to be unable to use. We recommend <PermissionLink key="SendMessages" />,
        <PermissionLink key="SendMessagesInThreads" />, <PermissionLink key="AddReactions" />, and <PermissionLink key="Connect" />. If you allow your members
        to create threads, you should also deny that to the mute role.
    </P>
    <div class="card bg-tertiary-400/40 dark:bg-tertiary-600/40 py-8 flex flex-col gap-6">
        <P class="px-8">
            Consider using Discord's built-in timeouts. There are a few advantages, namely that it makes it obvious to the user that they are timed out and how
            long they have left before they can interact again and it lets moderators easily see that a user is timed out without revealing it to other users.
        </P>
        <P class="px-8">
            It comes with disadvantages as well, most notably that timeouts can only go up to 28 days and block all permissions except
            <PermissionLink key="ViewChannel" title="viewing channels" /> and <PermissionLink key="ReadMessageHistory" title="reading message history" />, and
            additionally preventing them from adding to existing reactons or clicking on message components, making reaction roles inaccessible to them.
        </P>
    </div>
    <h2 class="h2">Permission List</h2>
    <P>The following is a list of all Discord permissions and what they do.</P>
    {#each Object.entries(permissions) as [key, permission]}
        <h4 class="relative h4 flex gap-4 items-center">
            <span id={key} class="relative -top-24" />
            {permission.name}
            <Code>{key}</Code>
            <A to="#{key}"><Icon icon="link" /></A>
        </h4>
        <blockquote class="border-secondary-500 border-l-2 pl-6">
            <P>{@html permission.description}</P>
        </blockquote>
        {#each permission.callouts ?? [] as { style, content }}
            <div class="card {cardStyles[style] ?? ''} py-8 flex flex-col gap-6">
                <P class="px-8">
                    {#each content.split(/\[\[|\]\]/) as block, index}
                        {#if index % 2 === 0}
                            {@html block}
                        {:else}
                            <PermissionLink key={block} />
                        {/if}
                    {/each}
                </P>
            </div>
        {/each}
    {/each}
</Container>

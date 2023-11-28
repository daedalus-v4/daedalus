<script lang="ts" context="module">
    const notChanged = [
        "welcome",
        "supporter-announcements",
        "moderation",
        "starboard",
        "automod",
        "sticky-roles",
        "custom-roles",
        "stats-channels",
        "autoresponder",
        "nukeguard",
        "suggestions",
        "co-op",
        "count",
        "reminders",
        "reports",
        "highlights",
        "utility",
        "sticky-messages",
        "fun",
    ];
</script>

<script lang="ts">
    import A from "$lib/components/A.svelte";
    import Breadcrumbs from "$lib/components/Breadcrumbs.svelte";
    import Container from "$lib/components/Container.svelte";
    import Header from "$lib/components/Header.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import ModuleHeader from "$lib/components/ModuleHeader.svelte";
    import P from "$lib/components/P.svelte";
    import { modules } from "shared";
</script>

<Header>
    <p class="text-3xl"><b>Daedalus</b> Documentation</p>
    <p class="text-xl text-primary-700 dark:text-primary-300">Custom Messages</p>
</Header>

<Container main>
    <Breadcrumbs
        links={[
            ["/docs", "Docs"],
            ["/docs/guides", "Guides"],
            ["/docs/guides/v3-v4-migration", "v3 &rightarrow; v4 Migration Guide"],
        ]}
    />
    <h2 class="h2">v3 &rightarrow; v4 Migration Guide</h2>
    <P>
        Daedalus is upgrading to version 4, and with it come massive changes to many modules and the entire management system. Here is a comprehensive guide to
        ensure everything in your setup remains functional and some tips for how to use our new features.
    </P>
    <P>Your settings have been imported so that very few changes will be needed on your end.</P>
    <P>
        Module limits have been adjusted due to the introduction of Daedalus Premium, and any servers who currently exceed the free limits have had their limits
        overridden to avoid service interruption.
    </P>
    <P><A to="/premium/why">Why are we introducing a premium subscription?</A></P>
    <h3 class="h3"><span class="flex items-center gap-4"><Icon icon="gear" /> Server Settings</span></h3>
    <P>This section remains mostly the same, but logging has been moved to its own module.</P>
    <h3 class="h3"><span class="flex items-center gap-4"><Icon icon="crown" /> Premium</span></h3>
    <P>
        This is a new module as Daedalus Premium is being introduced in this version. Premium features will be indicated in this guide, but of the features from
        version 3, all but two cosmetic features remain free.
    </P>
    <h3 class="h3"><span class="flex items-center gap-4"><Icon icon="screwdriver-wrench" /> Modules &amp; Permissions</span></h3>
    <P>
        Managing which modules and commands are enabled and command permissions has been moved to a single page to allow you to more easily update all of them
        together. Besides the reformatting, the functionality remains the same from the version 3 layout.
    </P>
    <h3 class="h3"><ModuleHeader id="logging" /></h3>
    <P>
        Rather than using <b>/settings logging set-webhook</b>, you instead now supply a webhook to the logging module settings directly.
    </P>
    <h3 class="h3"><ModuleHeader id="xp" /></h3>
    <P>Customizing the rank card and level-up announcement background images has become a premium feature.</P>
    <P>
        Although we understand that paywalling existing features is frustrating and degrades trust, we promise that this will be done exceptionally rarely and
        never to core functionality, and as this is a cosmetic feature, it is more consistent for this to be a premium feature.
    </P>
    <P>Servers with an existing rank card and/or level-up background image will retain access to these features even without premium.</P>
    <h3 class="h3"><ModuleHeader id="reaction-roles" /></h3>
    <P>
        Reaction role prompts have not changed meaningfully, but we recommend that you click the <b><Icon icon="save" /> Save</b> button to ensure the prompts are
        up-to-date and report any errors that occur so you can fix them.
    </P>
    <P>Please reach out to support if you need any assistance with resolving any issues here.</P>
    <h3 class="h3"><ModuleHeader id="autoroles" /></h3>
    <P>
        This is a new feature which allows you to select roles to assign to members when they join the server, regardless of if they are joining or rejoining.
        This does not conflict with the sticky roles module.
    </P>
    <h3 class="h3"><ModuleHeader id="modmail" /></h3>
    <P>The basic version of this feature remains the same, but with Daedalus Premium, you can get access to multiple modmail targets.</P>
    <P>
        With this feature, users will be able to select a channel to which to send messages, so you can set up different modmail categories for different
        purposes.
    </P>
    <h3 class="h3"><ModuleHeader id="tickets" /></h3>
    <P>Customizing the on-open message has become a premium feature.</P>
    <P>
        Although we understand that paywalling existing features is frustrating and degrades trust, we promise that this will be done exceptionally rarely. In
        this case, this feature was not really in use so we found this to be an acceptable sacrifice (this feature is only in use in 3 ticket prompts of the 29
        total, and one of them is just for testing).
    </P>
    <P>Servers with an existing on-open message enabled will retain access to this feature even without premium.</P>
    <P>
        The basic version of this feature remains the same besides this point, but with Daedalus Premium, in addition to setting up multiple ticket prompts, you
        can also set up multiple targets in one ticket prompt.
    </P>
    <P>
        With this feature, users will be able to select a channel from a dropdown that displays instead of a button, so you can set up multiple ticket channels
        in one prompt.
    </P>
    <h3 class="h3"><ModuleHeader id="reddit-feeds" /></h3>
    <P>
        We've renamed the <b><Icon icon="rss" /> Feeds</b> module to the <b><Icon icon="reddit" brand /> Reddit Feeds</b> module to better reflect that it only operates
        for one source. If we add different sources later, we will add them under separate modules.
    </P>
    <P>Reddit feeds are now set up on the dashboard instead of via commands, and you no longer need to log in to authorize the app.</P>
    <h3 class="h3"><ModuleHeader id="giveaways" /></h3>
    <P>
        We've dropped the cap for giveaways so you no longer have to clean out and delete old ones. If you have any ongoing giveaways, we recommend that you
        click the <b><Icon icon="save" /> Save</b> button to ensure all prompts are up-to-date. Giveaways that have already ended are edited if possible but never
        posted if missing to avoid issues when saving.
    </P>
    <h3 class="h3"><ModuleHeader id="polls" /></h3>
    <P>We've removed the QOTD and poll scheduling features due to nearly no usage.</P>
    <h3 class="h3">API</h3>
    <P>
        Unfortunately, we've made the decision to remove the API feature for now. We will revisit it in the future, but with all of the changes we've
        implemented, the API would likely require breaking changes, and since it is already not really used, we decided to remove support for it for the
        foreseeable future.
    </P>
    <h3 class="h3">No Changes</h3>
    <P>
        The following modules have not changed meaningfully or in any way that may require any action from you:
        <ul class="list-disc pl-4">
            {#each notChanged as mid}
                {@const { icon, brand, name } = modules[mid]}
                <li class="pl-2">
                    <span class="flex items-center gap-4">
                        {#if icon}<Icon {icon} {brand} />{/if}
                        {name}
                    </span>
                </li>
            {/each}
        </ul>
    </P>
</Container>

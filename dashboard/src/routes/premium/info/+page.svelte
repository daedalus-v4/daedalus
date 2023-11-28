<script lang="ts">
    import A from "$lib/components/A.svelte";
    import Container from "$lib/components/Container.svelte";
    import Header from "$lib/components/Header.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import P from "$lib/components/P.svelte";
    import { PremiumTier, premiumBenefits } from "shared";

    const { [PremiumTier.FREE]: T0, [PremiumTier.BASIC]: T1, [PremiumTier.ULTIMATE]: T2 } = premiumBenefits;
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
    <h3 class="h3">Premium Specifics</h3>
    <div class="table-container">
        <table class="table table-hover">
            <thead>
                <tr>
                    <th />
                    <th class="text-center">Free</th>
                    <th class="text-center">Basic</th>
                    <th class="text-center">Ultimate</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <th class="text-center">Custom Client</th>
                    <td class="text-center"><Icon icon={T0.vanityClient ? "check" : "xmark"} /></td>
                    <td class="text-center"><Icon icon={T1.vanityClient ? "check" : "xmark"} /></td>
                    <td class="text-center"><Icon icon={T2.vanityClient ? "check" : "xmark"} /></td>
                </tr>
                <tr>
                    <th class="text-center">Customize XP Card Backgrounds</th>
                    <td class="text-center"><Icon icon={T0.customizeXpBackgrounds ? "check" : "xmark"} /></td>
                    <td class="text-center"><Icon icon={T1.customizeXpBackgrounds ? "check" : "xmark"} /></td>
                    <td class="text-center"><Icon icon={T2.customizeXpBackgrounds ? "check" : "xmark"} /></td>
                </tr>
                <tr>
                    <th class="text-center">Multi-Target Modmail</th>
                    <td class="text-center"><Icon icon={T0.multiModmail ? "check" : "xmark"} /></td>
                    <td class="text-center"><Icon icon={T1.multiModmail ? "check" : "xmark"} /></td>
                    <td class="text-center"><Icon icon={T2.multiModmail ? "check" : "xmark"} /></td>
                </tr>
                <tr>
                    <th class="text-center">Multi-Target Tickets</th>
                    <td class="text-center"><Icon icon={T0.multiTickets ? "check" : "xmark"} /></td>
                    <td class="text-center"><Icon icon={T1.multiTickets ? "check" : "xmark"} /></td>
                    <td class="text-center"><Icon icon={T2.multiTickets ? "check" : "xmark"} /></td>
                </tr>
                <tr>
                    <th class="text-center">Multi-Target Tickets</th>
                    <td class="text-center"><Icon icon={T0.multiTickets ? "check" : "xmark"} /></td>
                    <td class="text-center"><Icon icon={T1.multiTickets ? "check" : "xmark"} /></td>
                    <td class="text-center"><Icon icon={T2.multiTickets ? "check" : "xmark"} /></td>
                </tr>
                <tr>
                    <th class="text-center">Custom Ticket On-Open Message</th>
                    <td class="text-center"><Icon icon={T0.multiTickets ? "check" : "xmark"} /></td>
                    <td class="text-center"><Icon icon={T1.multiTickets ? "check" : "xmark"} /></td>
                    <td class="text-center"><Icon icon={T2.multiTickets ? "check" : "xmark"} /></td>
                </tr>
                <tr>
                    <th class="text-center">Supporter Announcements</th>
                    <td class="text-center">{T0.supporterAnnouncementsCountLimit}</td>
                    <td class="text-center">{T1.supporterAnnouncementsCountLimit}</td>
                    <td class="text-center">{T2.supporterAnnouncementsCountLimit}</td>
                </tr>
                <tr>
                    <th class="text-center">XP Bonus Channels</th>
                    <td class="text-center">{T0.xpBonusChannelCountLimit}</td>
                    <td class="text-center">{T1.xpBonusChannelCountLimit}</td>
                    <td class="text-center">{T2.xpBonusChannelCountLimit}</td>
                </tr>
                <tr>
                    <th class="text-center">XP Bonus Roles</th>
                    <td class="text-center">{T0.xpBonusRoleCountLimit}</td>
                    <td class="text-center">{T1.xpBonusRoleCountLimit}</td>
                    <td class="text-center">{T2.xpBonusRoleCountLimit}</td>
                </tr>
                <tr>
                    <th class="text-center">XP Rewards</th>
                    <td class="text-center">{T0.xpRewardCountLimit}</td>
                    <td class="text-center">{T1.xpRewardCountLimit}</td>
                    <td class="text-center">{T2.xpRewardCountLimit}</td>
                </tr>
                <tr>
                    <th class="text-center">Reaction Role Prompts</th>
                    <td class="text-center">{T0.reactionRolesCountLimit}</td>
                    <td class="text-center">{T1.reactionRolesCountLimit}</td>
                    <td class="text-center">{T2.reactionRolesCountLimit}</td>
                </tr>
                <tr>
                    <th class="text-center"><b>/purge</b> Message Count Limit</th>
                    <td class="text-center">{T0.purgeAtOnceLimit}</td>
                    <td class="text-center">{T1.purgeAtOnceLimit}</td>
                    <td class="text-center">{T2.purgeAtOnceLimit}</td>
                </tr>
                <tr>
                    <th class="text-center">Automod Rules</th>
                    <td class="text-center">{T0.automodCountLimit}</td>
                    <td class="text-center">{T1.automodCountLimit}</td>
                    <td class="text-center">{T2.automodCountLimit}</td>
                </tr>
                <tr>
                    <th class="text-center">Stats Channels</th>
                    <td class="text-center">{T0.statsChannelsCountLimit}</td>
                    <td class="text-center">{T1.statsChannelsCountLimit}</td>
                    <td class="text-center">{T2.statsChannelsCountLimit}</td>
                </tr>
                <tr>
                    <th class="text-center">Autoresponder Triggers</th>
                    <td class="text-center">{T0.autoresponderCountLimit}</td>
                    <td class="text-center">{T1.autoresponderCountLimit}</td>
                    <td class="text-center">{T2.autoresponderCountLimit}</td>
                </tr>
                <tr>
                    <th class="text-center">Modmail Targets</th>
                    <td class="text-center">{@html T0.multiModmail ? T0.modmailTargetCountLimit : "&mdash;"}</td>
                    <td class="text-center">{@html T1.multiModmail ? T1.modmailTargetCountLimit : "&mdash;"}</td>
                    <td class="text-center">{@html T2.multiModmail ? T2.modmailTargetCountLimit : "&mdash;"}</td>
                </tr>
                <tr>
                    <th class="text-center">Ticket Prompts</th>
                    <td class="text-center">{T0.ticketPromptCountLimit}</td>
                    <td class="text-center">{T1.ticketPromptCountLimit}</td>
                    <td class="text-center">{T2.ticketPromptCountLimit}</td>
                </tr>
                <tr>
                    <th class="text-center">Ticket Targets (Per Prompt)</th>
                    <td class="text-center">{@html T0.multiTickets ? T0.ticketTargetCountLimit : "&mdash;"}</td>
                    <td class="text-center">{@html T1.multiTickets ? T1.ticketTargetCountLimit : "&mdash;"}</td>
                    <td class="text-center">{@html T2.multiTickets ? T2.ticketTargetCountLimit : "&mdash;"}</td>
                </tr>
                <tr>
                    <th class="text-center">Reddit Feeds</th>
                    <td class="text-center">{T0.redditFeedsCountLimit}</td>
                    <td class="text-center">{T1.redditFeedsCountLimit}</td>
                    <td class="text-center">{T2.redditFeedsCountLimit}</td>
                </tr>
                <tr>
                    <th class="text-center">Count-Up Channels</th>
                    <td class="text-center">{T0.countCountLimit}</td>
                    <td class="text-center">{T1.countCountLimit}</td>
                    <td class="text-center">{T2.countCountLimit}</td>
                </tr>
            </tbody>
        </table>
    </div>
</Container>

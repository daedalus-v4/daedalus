<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import Button from "$lib/components/Button.svelte";
    import ChannelSelector from "$lib/components/ChannelSelector.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import Limit from "$lib/components/Limit.svelte";
    import ListInput from "$lib/components/ListInput.svelte";
    import Modal from "$lib/components/Modal.svelte";
    import ModuleSaver from "$lib/components/ModuleSaver.svelte";
    import P from "$lib/components/P.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import RoleSelector from "$lib/components/RoleSelector.svelte";
    import SingleChannelSelector from "$lib/components/SingleChannelSelector.svelte";
    import type { FEAutomodSettings } from "$lib/types";
    import { textlike, textlikeAndParents, without } from "$lib/utils";
    import { SlideToggle } from "@skeletonlabs/skeleton";
    import { formatDuration, parseDuration } from "shared";

    let base: FEAutomodSettings = $page.data.data;
    let data = browser ? structuredClone(base) : base;

    let openIndex = 0;
    let open = false;

    $: rule = data.rules[openIndex];

    function checkSnowflake(x: string) {
        return x.match(/^[1-9][0-9]{16,19}$/) ? false : "IDs must be Discord IDs (17-20 digit numbers).";
    }
</script>

<ModuleSaver bind:base bind:data />

<Panel>
    <h3 class="h3">Ignored Channels (can be overridden)</h3>
    <ChannelSelector types={textlikeAndParents} bind:selected={data.ignoredChannels} />
    <h3 class="h3">Ignored Roles (can be overridden)</h3>
    <RoleSelector showEveryone showHigher showManaged bind:selected={data.ignoredRoles} />
    <h3 class="h3">Default Report Channel</h3>
    <SingleChannelSelector types={textlike} bind:selected={data.defaultChannel} />
    <P>
        If you're using a service like NQN or PluralKit that converts user messages into webhooks, you may want to enable this setting. With this setting
        enabled, webhook messages will be scanned as well and deleted if the rule has deletion enabled. The user will be warned either way, but with this
        setting disabled, the follow-up webhook message will not be deleted.
    </P>
    <div class="flex gap-4">
        <SlideToggle name="" size="sm" bind:checked={data.interactWithWebhooks} />
        Interact with Webhooks
    </div>
</Panel>

<Panel>
    <h3 class="h3">Automod Rules</h3>

    {#each data.rules as rule, index}
        <div class="grid grid-cols-[auto_auto_1fr] items-center gap-4">
            <SlideToggle name="" size="sm" bind:checked={rule.enable} />
            <b>{rule.name}</b>
            <span class="flex items-center gap-1">
                <Button on:click={() => ((openIndex = index), (open = true))}><Icon icon="edit" /></Button>
                <Button on:click={() => (data.rules = without(data.rules, index))} variant="error-text-only"><Icon icon="trash" /></Button>
            </span>
        </div>
    {/each}

    <Limit amount={data.rules.length} key="automodCount">
        <Button
            variant="primary-text"
            on:click={() =>
                (data.rules = [
                    ...data.rules,
                    {
                        id: Math.random(),
                        enable: false,
                        name: "New Automod Rule",
                        type: "blocked-terms",
                        blockedTermsData: { terms: [] },
                        blockedStickersData: { ids: [] },
                        capsSpamData: { ratioLimit: 80, limit: 10 },
                        newlineSpamData: { consecutiveLimit: 5, totalLimit: 15 },
                        repeatedCharactersData: { consecutiveLimit: 20 },
                        lengthLimitData: { limit: 1200 },
                        emojiSpamData: { limit: 20, blockAnimatedEmoji: false },
                        ratelimitData: { threshold: 5, timeInSeconds: 5 },
                        attachmentSpamData: { threshold: 5, timeInSeconds: 5 },
                        stickerSpamData: { threshold: 5, timeInSeconds: 5 },
                        linkSpamData: { threshold: 5, timeInSeconds: 5 },
                        inviteLinksData: { blockUnknown: false, allowed: [], blocked: [] },
                        linkBlocklistData: { websites: [] },
                        mentionSpamData: { perMessageLimit: 10, totalLimit: 10, timeInSeconds: 10, blockFailedEveryoneOrHere: false },
                        reportToChannel: false,
                        deleteMessage: false,
                        notifyAuthor: false,
                        reportChannel: null,
                        additionalAction: "nothing",
                        actionDuration: 0,
                        disregardDefaultIgnoredChannels: false,
                        disregardDefaultIgnoredRoles: false,
                        onlyWatchEnabledChannels: false,
                        onlyWatchEnabledRoles: false,
                        ignoredChannels: [],
                        ignoredRoles: [],
                        watchedChannels: [],
                        watchedRoles: [],
                    },
                ])}
        >
            <Icon icon="plus" /> Create Rule
        </Button>
    </Limit>
</Panel>

<Modal max bind:open>
    {#if rule}
        <Panel>
            <h3 class="h3">Editing Automod Rule</h3>
            <b>Name (for display on dashboard)</b>
            <input type="text" class="input" bind:value={rule.name} />
        </Panel>
        <Panel>
            <h3 class="h3">Rule Configuration</h3>
            <div class="flex items-center gap-4">
                <b>Type</b>
                <select class="select" bind:value={rule.type}>
                    <option value="blocked-terms">Blocked Terms</option>
                    <option value="blocked-stickers">Blocked Stickers</option>
                    <option value="caps-spam">Caps Spam</option>
                    <option value="newline-spam">Newline Spam</option>
                    <option value="repeated-characters">Repeated Characters</option>
                    <option value="length-limit">Length Limit</option>
                    <option value="emoji-spam">Emoji Spam</option>
                    <option value="ratelimit">Ratelimit</option>
                    <option value="attachment-spam">Attachment Spam</option>
                    <option value="sticker-spam">Sticker Spam</option>
                    <option value="link-spam">Link Spam</option>
                    <option value="invite-links">Invite Links</option>
                    <option value="link-blocklist">Link Blocklist</option>
                    <option value="mention-spam">Mention Spam</option>
                </select>
            </div>
            {#if rule.type === "blocked-terms"}
                <P>
                    Enter words or phrases here. Put a <code class="code">*</code> at the start and/or end of a term to detect partial matches. Each term must be
                    at least 3 characters long. All matches are case-insensitive.
                </P>
                <ListInput
                    bind:values={rule.blockedTermsData.terms}
                    max={1000}
                    check={(x) =>
                        x.match(/^\*\s|\s\*$/)
                            ? "Wildcard must not be next to whitespace"
                            : x.replace(/^\*?\s*|\s*\*?$/g, "").length < 3
                            ? "Terms must be at least 3 characters long (not counting wildcard)."
                            : false}
                />
            {:else if rule.type === "blocked-stickers"}
                <P>
                    Enter the IDs of stickers to block here. To get a sticker's ID, you can enable Daedalus' message logging and post the sticker and then
                    delete it, and the log output will contain the sticker's ID.
                </P>
                <ListInput bind:values={rule.blockedStickersData.ids} max={1000} check={checkSnowflake} />
            {:else if rule.type === "caps-spam"}
                <P>
                    A message will be matched if <b>X</b>% or more of its letters are uppercase <b>and</b> it contains more than <b>Y</b> uppercase letter{rule
                        .capsSpamData.limit === 1
                        ? ""
                        : "s"} in total.
                </P>
                <div class="grid grid-cols-[auto_1fr] items-center gap-4">
                    <b>X</b>
                    <span><input type="number" class="input" min={40} max={100} bind:value={rule.capsSpamData.ratioLimit} /></span>
                    <b>Y</b>
                    <span><input type="number" class="input" min={1} bind:value={rule.capsSpamData.limit} /></span>
                </div>
            {:else if rule.type === "newline-spam"}
                <P>
                    A message will be matched if it contains more than <b>X</b> newline{rule.newlineSpamData.consecutiveLimit === 1 ? "" : "s"} in a row
                    <b>or</b> it contains more than <b>Y</b> newline{rule.newlineSpamData.totalLimit === 1 ? "" : "s"} in total.
                </P>
                <div class="grid grid-cols-[auto_1fr] items-center gap-4">
                    <b>X</b>
                    <span><input type="number" class="input" min={1} bind:value={rule.newlineSpamData.consecutiveLimit} /></span>
                    <b>Y</b>
                    <span><input type="number" class="input" min={1} bind:value={rule.newlineSpamData.totalLimit} /></span>
                </div>
            {:else if rule.type === "repeated-characters"}
                <P>
                    A message will be matched if it contains more than <b>X</b> of the <b>same</b> character in a row.
                </P>
                <div class="grid grid-cols-[auto_1fr] items-center gap-4">
                    <b>X</b>
                    <span><input type="number" class="input" min={2} bind:value={rule.repeatedCharactersData.consecutiveLimit} /></span>
                </div>
            {:else if rule.type === "length-limit"}
                <P>A message will be matched if it is longer than <b>X</b> characters long.</P>
                <div class="grid grid-cols-[auto_1fr] items-center gap-4">
                    <b>X</b>
                    <span><input type="number" class="input" min={2} bind:value={rule.lengthLimitData.limit} /></span>
                </div>
            {:else if rule.type === "emoji-spam"}
                <P>A message will be matched if it contains more than <b>X</b> emoji.</P>
                <div class="grid grid-cols-[auto_1fr] items-center gap-4">
                    <b>X</b>
                    <span><input type="number" class="input" min={2} bind:value={rule.emojiSpamData.limit} /></span>
                </div>
                <div class="flex items-center gap-4">
                    <SlideToggle name="" size="sm" bind:checked={rule.emojiSpamData.blockAnimatedEmoji} />
                    Also block all animated emoji
                </div>
            {:else if rule.type === "ratelimit"}
                <P>If a user sends <b>X</b> messages within <b>Y</b> second{rule.ratelimitData.timeInSeconds === 1 ? "" : "s"}, all of them will be matched.</P>
                <div class="grid grid-cols-[auto_1fr] items-center gap-4">
                    <b>X</b>
                    <span><input type="number" class="input" min={2} bind:value={rule.ratelimitData.threshold} /></span>
                    <b>Y</b>
                    <span><input type="number" class="input" min={1} bind:value={rule.ratelimitData.timeInSeconds} /></span>
                </div>
            {:else if rule.type === "attachment-spam"}
                <P>
                    If a user sends <b>X</b> files within <b>Y</b> second{rule.attachmentSpamData.timeInSeconds === 1 ? "" : "s"}, all of them will be matched.
                </P>
                <div class="grid grid-cols-[auto_1fr] items-center gap-4">
                    <b>X</b>
                    <span><input type="number" class="input" min={2} bind:value={rule.attachmentSpamData.threshold} /></span>
                    <b>Y</b>
                    <span><input type="number" class="input" min={1} bind:value={rule.attachmentSpamData.timeInSeconds} /></span>
                </div>
            {:else if rule.type === "sticker-spam"}
                <P>
                    If a user sends <b>X</b> stickers within <b>Y</b> second{rule.stickerSpamData.timeInSeconds === 1 ? "" : "s"}, all of them will be matched.
                </P>
                <div class="grid grid-cols-[auto_1fr] items-center gap-4">
                    <b>X</b>
                    <span><input type="number" class="input" min={2} bind:value={rule.stickerSpamData.threshold} /></span>
                    <b>Y</b>
                    <span><input type="number" class="input" min={1} bind:value={rule.stickerSpamData.timeInSeconds} /></span>
                </div>
            {:else if rule.type === "link-spam"}
                <P>
                    If a user sends <b>X</b> links within <b>Y</b> second{rule.linkSpamData.timeInSeconds === 1 ? "" : "s"}, all of them will be matched.
                </P>
                <div class="grid grid-cols-[auto_1fr] items-center gap-4">
                    <b>X</b>
                    <span><input type="number" class="input" min={2} bind:value={rule.linkSpamData.threshold} /></span>
                    <b>Y</b>
                    <span><input type="number" class="input" min={1} bind:value={rule.linkSpamData.timeInSeconds} /></span>
                </div>
            {:else if rule.type === "invite-links"}
                <div class="flex items-center gap-4">
                    <SlideToggle name="" size="sm" bind:checked={rule.inviteLinksData.blockUnknown} />
                    Block servers not listed below
                </div>
                <Panel class="w-full">
                    <P>Enter the IDs of servers from which to <b>allow</b> invites.</P>
                    <ListInput bind:values={rule.inviteLinksData.allowed} max={1000} check={checkSnowflake} />
                </Panel>
                <Panel class="w-full">
                    <P>Enter the IDs of servers from which to <b>block</b> invites.</P>
                    <ListInput bind:values={rule.inviteLinksData.blocked} max={1000} check={checkSnowflake} />
                </Panel>
            {:else if rule.type === "link-blocklist"}
                <P>
                    Enter websites to block (e.g. <b>scam-link.com</b>, <b>website.com/path/to/scam</b>). All links matching it, including subdomains, will be
                    matched; e.g.
                    <b>scam.com</b> will block <b>also.scam.com</b>. Do not enter the schema (<b>https://</b>, etc.).
                </P>
                <ListInput
                    bind:values={rule.linkBlocklistData.websites}
                    max={1000}
                    check={(x) =>
                        x.match(/^\w+:\/\//) ? "Do not include the schema." : x.match(/.\../) ? false : "That does not look like a valid URL component."}
                />
            {:else if rule.type === "mention-spam"}
                <P>
                    If a user sends more than <b>X</b> distinct mentions in one message <b>or</b> sends messages containing <b>Y</b> total mentions within
                    <b>Z</b> seconds, all of the messages will be matched. Pinging one user multiple times in one message counts once, but repeatedly pinging the
                    same user across messages counts multiple times.
                </P>
                <div class="grid grid-cols-[auto_1fr] items-center gap-4">
                    <b>X</b>
                    <span><input type="number" class="input" min={2} bind:value={rule.mentionSpamData.perMessageLimit} /></span>
                    <b>Y</b>
                    <span><input type="number" class="input" min={1} bind:value={rule.mentionSpamData.totalLimit} /></span>
                    <b>Z</b>
                    <span><input type="number" class="input" min={1} bind:value={rule.mentionSpamData.timeInSeconds} /></span>
                </div>
                <div class="flex items-center gap-4">
                    <SlideToggle name="" size="sm" bind:checked={rule.mentionSpamData.blockFailedEveryoneOrHere} />
                    <span>Also match if a user tries pinging <b>@everyone</b> / <b>@here</b> without adequate permissions</span>
                </div>
            {/if}
        </Panel>

        <Panel>
            <h3 class="h3">Actions</h3>
            <div class="flex flex-wrap gap-8">
                <div class="flex items-center gap-4">
                    <SlideToggle name="" size="sm" bind:checked={rule.reportToChannel} />
                    Report to channel
                </div>
                <div class="flex items-center gap-4">
                    <SlideToggle name="" size="sm" bind:checked={rule.deleteMessage} />
                    Delete Message{["ratelimit", "attachment-spam", "sticker-spam", "link-spam", "mention-spam"].includes(rule.type) ? "s" : ""}
                </div>
                <div class="flex items-center gap-4">
                    <SlideToggle name="" size="sm" bind:checked={rule.notifyAuthor} />
                    Notify Author
                </div>
            </div>
            <div class="grid grid-cols-[auto_1fr] items-center gap-4 pt-4">
                <b>Override Report Channel:</b>
                <SingleChannelSelector types={textlike} bind:selected={rule.reportChannel} />
                <b>Additional Action:</b>
                <div class="w-[max-content]">
                    <select class="select" bind:value={rule.additionalAction}>
                        <option value="nothing">Do Nothing Else</option>
                        <option value="warn">Log Formal Warning</option>
                        <option value="mute">Mute</option>
                        <option value="timeout">Timeout</option>
                        <option value="kick">Kick</option>
                        <option value="ban">Ban</option>
                    </select>
                </div>
                {#if ["mute", "timeout", "ban"].includes(rule.additionalAction)}
                    <b>Duration of Punishment:</b>
                    <span class="flex items-center gap-4">
                        {formatDuration(rule.actionDuration || Infinity)}
                        <Button
                            on:click={() => {
                                const input = prompt("Enter a new duration (e.g. 20h, 3 days 12 hours, forever).");
                                if (!input) return;

                                try {
                                    const duration = parseDuration(input) || Infinity;

                                    if (rule.additionalAction === "timeout" && duration > 28 * 24 * 60 * 60 * 1000)
                                        throw "Members can only be timed out for up to 28 days.";

                                    rule.actionDuration = duration;
                                } catch (error) {
                                    alert(error);
                                }
                            }}
                        >
                            <Icon icon="edit" />
                        </Button>
                    </span>
                {/if}
            </div>
        </Panel>

        <Panel>
            <h3 class="h3">Restrictions</h3>
            <div class="flex flex-wrap gap-8">
                <div class="flex items-center gap-4">
                    <SlideToggle name="" size="sm" bind:checked={rule.disregardDefaultIgnoredChannels} />
                    Disregard Default Ignored Channels
                </div>
                <div class="flex items-center gap-4">
                    <SlideToggle name="" size="sm" bind:checked={rule.disregardDefaultIgnoredRoles} />
                    Disregard Default Ignored Roles
                </div>
                <div class="flex items-center gap-4">
                    <SlideToggle name="" size="sm" bind:checked={rule.onlyWatchEnabledChannels} />
                    Only Watch Enabled Channels
                </div>
                <div class="flex items-center gap-4">
                    <SlideToggle name="" size="sm" bind:checked={rule.onlyWatchEnabledRoles} />
                    Only Watch Enabled Roles
                </div>
            </div>
            <b>Ignored Channels</b>
            <ChannelSelector types={textlikeAndParents} bind:selected={rule.ignoredChannels} />
            <b>Ignored Roles</b>
            <RoleSelector showEveryone showHigher showManaged bind:selected={rule.ignoredRoles} />
            <b>Watched Channels</b>
            <ChannelSelector types={textlikeAndParents} bind:selected={rule.watchedChannels} />
            <b>Watched Roles</b>
            <RoleSelector showEveryone showHigher showManaged bind:selected={rule.watchedRoles} />
        </Panel>
    {/if}
</Modal>

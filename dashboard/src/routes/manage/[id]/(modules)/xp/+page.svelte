<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import A from "$lib/components/A.svelte";
    import Button from "$lib/components/Button.svelte";
    import ChannelSelector from "$lib/components/ChannelSelector.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import Limit from "$lib/components/Limit.svelte";
    import ModuleSaver from "$lib/components/ModuleSaver.svelte";
    import P from "$lib/components/P.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import RoleSelector from "$lib/components/RoleSelector.svelte";
    import SingleChannelSelector from "$lib/components/SingleChannelSelector.svelte";
    import SingleRoleSelector from "$lib/components/SingleRoleSelector.svelte";
    import type { FEXpSettings } from "$lib/types";
    import { textlike, without } from "$lib/utils";
    import { SlideToggle } from "@skeletonlabs/skeleton";

    let base: FEXpSettings = $page.data.data;
    let data = browser ? structuredClone(base) : base;
</script>

<ModuleSaver bind:base bind:data />

<Panel>
    <h3 class="h3">Blocked Roles</h3>
    <RoleSelector showEveryone showHigher showManaged bind:selected={data.blockedRoles} />
    <h3 class="h3">Blocked Channels</h3>
    <ChannelSelector types={textlike} bind:selected={data.blockedChannels} />
</Panel>

<Panel>
    <h3 class="h3">Bonus XP</h3>
    <h4 class="h4">Channels</h4>
    <P>If a category and channel both have overrides, the channel's own will override the category's. They do not stack.</P>
    <div class="w-full overflow-x-auto">
        <div class="grid grid-cols-1 sm:grid-cols-[auto_auto_auto_1fr] sm:items-center gap-x-8 gap-y-2">
            <span class="hidden sm:block" />
            <b class="hidden sm:block">Channel</b>
            <b class="hidden sm:block">Multiplier</b>
            <span />
            {#each data.bonusChannels as bonus, index}
                <div>
                    <Button variant="error-text-only" on:click={() => (data.bonusChannels = without(data.bonusChannels, index))}><Icon icon="trash" /></Button>
                </div>
                <b class="block sm:hidden">Channel</b>
                <span>
                    <SingleChannelSelector types={textlike} bind:selected={bonus.channel} />
                </span>
                <b class="block sm:hidden">Multiplier</b>
                <input type="number" class="input" bind:value={bonus.multiplier} />
                <span />
            {/each}
        </div>
    </div>
    <Limit amount={data.bonusChannels.length} key="xpBonusChannelCount">
        <Button variant="primary-text" on:click={() => (data.bonusChannels = [...data.bonusChannels, { channel: null, multiplier: 2 }])}>
            <Icon icon="plus" /> Add Bonus Channel
        </Button>
    </Limit>
    <h4 class="h4">Roles</h4>
    <P>If a user has multiple of these roles, the highest multiplier will apply. They do not stack.</P>
    <div class="w-full overflow-x-auto">
        <div class="grid grid-cols-1 sm:grid-cols-[auto_auto_auto_1fr] sm:items-center gap-x-8 gap-y-2">
            <span class="hidden sm:block" />
            <b class="hidden sm:block">Role</b>
            <b class="hidden sm:block">Multiplier</b>
            <span />
            {#each data.bonusRoles as bonus}
                <div>
                    <Button variant="error-text-only"><Icon icon="trash" /></Button>
                </div>
                <b class="block sm:hidden">Role</b>
                <span>
                    <SingleRoleSelector showEveryone showHigher showManaged bind:selected={bonus.role} />
                </span>
                <b class="block sm:hidden">Multiplier</b>
                <input type="number" class="input" bind:value={bonus.multiplier} />
                <span />
            {/each}
        </div>
    </div>
    <Limit amount={data.bonusRoles.length} key="xpBonusRoleCount">
        <Button variant="primary-text" on:click={() => (data.bonusRoles = [...data.bonusRoles, { role: null, multiplier: 2 }])}>
            <Icon icon="plus" /> Add Bonus Role
        </Button>
    </Limit>
</Panel>

<Panel>
    <h3 class="h3">Level-Up Announcements</h3>
    <div class="flex items-center gap-4">
        <SlideToggle name="" size="sm" bind:checked={data.announceLevelUp} />
        <b>Announce Level-Ups</b>
    </div>
    <div class="flex items-center gap-4">
        <SlideToggle name="" size="sm" bind:checked={data.announceInChannel} />
        <b>Announce in the channel where the user leveled up</b>
    </div>
    <div class="{data.announceInChannel ? 'hidden' : ''} flex items-center gap-4">
        <b>Announce in:</b>
        <SingleChannelSelector types={textlike} bind:selected={data.announceChannel} />
    </div>
    {#if $page.data.premium.customizeXpBackgrounds}
        <h4 class="h4">Rank Card Background</h4>
        <input type="text" class="input" placeholder="(URL &mdash; 1000 &times; 400)" bind:value={data.rankCardBackground} />
        <h4 class="h4">Level-Up Announcement Background</h4>
        <input type="text" class="input" placeholder="(URL &mdash; 1000 &times; 200)" bind:value={data.announcementBackground} />
    {:else}
        <P><A to="/premium">Upgrade to premium</A> to unlock customizable rank card and level-up announcement background images!</P>
    {/if}
</Panel>

<Panel>
    <h3 class="h3">Role Rewards</h3>
    <div class="max-w-full overflow-x-auto">
        <div
            class="w-full grid grid-cols-[minmax(100px,auto)_minmax(100px,auto)_1fr_minmax(100px,auto)_minmax(100px,auto)_minmax(100px,auto)] items-center gap-x-8 gap-y-2"
        >
            <b>Text Level</b>
            <b>Voice Level</b>
            <b>Role</b>
            <b>Remove on Higher Reward</b>
            <b>DM on Reward</b>
            <span />
            {#each data.rewards as reward, index}
                <input type="number" class="input" bind:value={reward.text} />
                <input type="number" class="input" bind:value={reward.voice} />
                <SingleRoleSelector bind:selected={reward.role} />
                <SlideToggle name="" size="sm" bind:checked={reward.removeOnHigher} />
                <SlideToggle name="" size="sm" bind:checked={reward.dmOnReward} />
                <Button variant="error-text-only" on:click={() => (data.rewards = without(data.rewards, index))}><Icon icon="trash" /></Button>
            {/each}
        </div>
    </div>
    <Limit amount={data.rewards.length} key="xpRewardCount">
        <Button
            variant="primary-text"
            on:click={() => (data.rewards = [...data.rewards, { text: 1, voice: 1, role: null, removeOnHigher: false, dmOnReward: false }])}
        >
            <Icon icon="plus" /> Add Reward
        </Button>
    </Limit>
</Panel>

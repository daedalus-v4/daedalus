<script lang="ts">
    import { invalidateAll } from "$app/navigation";
    import { page } from "$app/stores";
    import A from "$lib/components/A.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import Modal from "$lib/components/Modal.svelte";
    import P from "$lib/components/P.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import { PremiumTier, premiumBenefits } from "shared";

    let premiumInfoOpen = false;
    let customClientInfoOpen = false;
    let key: string = "";
    let token: string = "";

    let loading = false;

    async function addKey() {
        loading = true;

        const request = await fetch(`/api/premium/activate?${new URLSearchParams({ key: key.trim(), guild: $page.params.id })}`, { method: "POST" });
        const response = await request.text();

        if (!request.ok) {
            loading = false;
            return alert(response);
        }

        await invalidateAll();
        key = "";
        loading = false;
    }

    async function freeKey(key: string) {
        if (!confirm("Are you sure you want to free this key? The key will become available to be added elsewhere.")) return;

        loading = true;

        const request = await fetch(`/api/premium/free?${new URLSearchParams({ key })}`, { method: "POST" });
        const response = await request.text();

        if (!request.ok) {
            loading = false;
            return alert(response);
        }

        await invalidateAll();
        loading = false;
    }

    async function saveToken() {
        if (
            !confirm(
                "Make sure you've double-checked that this is the correct token and you've followed the info pop-up. Ensure you've added the bot to the server already. Check the info pop-up for some information about what changes you may need to make.",
            )
        )
            return;

        loading = true;

        const request = await fetch(`/api/premium/set-token?${new URLSearchParams({ guild: $page.params.id })}`, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: token.trim(),
        });

        const response = await request.text();

        if (!request.ok) {
            loading = false;
            return alert(response);
        }

        alert(`Your custom client has been successfully set to ${response}!`);
        token = "";

        await invalidateAll();
        loading = false;
    }

    async function resetToken() {
        if (
            !confirm(
                "Are you sure you want to go back to using the regular Daedalus client? Check the info pop-up for some information about what changes you may need to make.",
            )
        )
            return;

        loading = true;

        const request = await fetch(`/api/premium/reset-token?${new URLSearchParams({ guild: $page.params.id })}`, { method: "POST" });
        const response = await request.text();

        if (!request.ok) {
            loading = false;
            return alert(response);
        }

        alert("Your client has been returned to the default Daedalus client.");

        await invalidateAll();
        loading = false;
    }

    let tier: PremiumTier;
    $: tier = $page.data.settings?.tier ?? PremiumTier.FREE;

    $: benefits = premiumBenefits[tier];
</script>

<Panel>
    <h2 class="h2">
        This guild has <b
            class={[
                "text-primary-500 dark:text-primary-400",
                "font-bold bg-clip-text text-transparent box-decoration-clone bg-gradient-to-br from-tertiary-600 to-tertiary-400 dark:from-tertiary-400 dark:to-tertiary-600",
                "font-bold bg-clip-text text-transparent box-decoration-clone bg-gradient-to-br from-secondary-400 via-primary-500 to-tertiary-400 dark:from-secondary-400 dark:via-primary-400 dark:to-tertiary-500",
            ][tier]}>{benefits.name}</b
        >
    </h2>
</Panel>

<Panel>
    <h2 class="h2 flex items-center gap-4">
        Premium Keys
        <button class="btn-icon variant-soft-secondary" on:click={() => (premiumInfoOpen = true)}><Icon icon="info-circle" /></button>
    </h2>
    <div class="grid grid-cols-2 items-center gap-4">
        {#if !$page.data.keys?.length}
            <P class="col-span-2">You have no premium keys active right now.</P>
        {:else}
            {#each $page.data.keys as key}
                <span class="flex items-center"><code class="code text-lg">{key}</code></span>
                <button class="btn-icon btn-icon-sm variant-filled-error" disabled={loading} on:click={() => freeKey(key)}><Icon icon="xmark" /></button>
            {/each}
        {/if}
        <input
            type="text"
            class="input"
            placeholder="Insert Key Here"
            bind:value={key}
            on:keydown={(e) => e.key === "Enter" && key.match(/\s*[bu]pk_[0-9a-f]{16}\s*$/) && addKey()}
        />
        <span class="flex items-center gap-4">
            <button class="btn-icon btn-icon-sm variant-filled-primary" disabled={loading || !key.match(/\s*[bu]pk_[0-9a-f]{16}\s*$/)} on:click={addKey}>
                <Icon icon="plus" />
            </button>
            <A to="/account/premium" external>View your premium keys</A>
        </span>
    </div>
</Panel>

<Panel class="relative">
    <h2 class="h2 flex items-center gap-4">
        Custom Client {#if !benefits.vanityClient}<Icon icon="lock" class="text-xl" />{/if}
        <button class="btn-icon variant-soft-secondary" on:click={() => (customClientInfoOpen = true)}><Icon icon="info-circle" /></button>
    </h2>
    {#if !benefits.vanityClient}
        <P>This feature is only available with the <b>Daedalus Ultimate Premium</b> plan!</P>
        <div class="absolute inset-0 card bg-surface-200/50 dark:bg-surface-400/50 backdrop-blur-[1px] pointer-events-none" />
    {:else if !$page.data.owner}
        <P>This setting is only available to the server owner.</P>
        <div class="absolute inset-0 card bg-surface-200/50 dark:bg-surface-400/50 pointer-events-none" />
    {:else}
        <div class="grid grid-cols-[1fr_auto] items-center gap-4">
            <input type="text" class="input" placeholder="Token" bind:value={token} />
            <div class="flex items-center gap-4">
                <button class="btn-icon btn-icon-sm variant-filled-primary" disabled={loading || !token.trim()} on:click={saveToken}>
                    <Icon icon="save" />
                </button>
                <button class="btn btn-sm variant-filled-error flex items-center gap-2" disabled={loading} on:click={resetToken}>
                    <Icon icon="xmark" /> Reset
                </button>
            </div>
        </div>
    {/if}
</Panel>

<Modal bind:open={premiumInfoOpen} hideFullscreenToggle>
    <P>You can add multiple premium keys here as a back-up and to prevent premium from expiring when someone's subscription ends.</P>
    <P>However, note that these do not stack, and having two basic premium keys active here will not give you ultimate premium.</P>
    <P>
        If you've purchased two basic premium subscriptions, you can convert it to an ultimate premium subscription in your
        <A to="/account/premium">account settings</A> and Stripe will automatically prorate your payment, resulting in no additional charges.
    </P>
</Modal>

<Modal bind:open={customClientInfoOpen} hideFullscreenToggle>
    <P>Daedalus' custom client feature allows you to run Daedalus on your own bot, letting you customize the username, avatar, bio, and status.</P>
    <P>
        <span class="text-primary-500 dark:text-primary-400">
            <b>You may need to make some changes.</b> Please refer to the <A to="/docs/guides/custom-clients" external>custom clients guide</A> for reference.
        </span>
    </P>
    <P>
        To set this up, first visit the <A to="https://discord.com/developers/applications" external>Developer Portal</A>. Don't worry, you won't be writing any
        code. You'll need to create a new application using the button in the top-right corner. Once you have a new application, you can set its name, avatar,
        and bio. In the application page, go to the "Bot" tab in the left sidebar.
    </P>
    <P>
        Now, you'll need to create a bot account for this application. Once you have your bot, scroll down and enable the "Server Members Intent" and "Message
        Content Intent" options.
    </P>
    <P>
        To add your bot, copy-paste the following URL and replace <code class="code">APP_ID</code> with your application ID (you can find this in the General tab
        or just copy-paste the ID out of the URL).
    </P>
    <P>
        Finally, go back to the bot settings, click "Reset Token", and then copy-paste the token into the input field. For security reasons, we never show you
        your token here after you submit it. <b>Make sure you keep this token secret.</b> Anyone who has your token gains full control of your bot.
    </P>
    <br />
    <P size="sm">
        Disclaimer: NSFW client profiles and misuse of custom clients in any way including impersonation, scamming, violations of terms of service, etc. may
        result in custom client privilieges being temporarily or permanently revoked or your server being temporarily or permanently banned from use of Daedalus
        altogether. There is no strict policy for this as generally it should be obvious what is allowed or not, but we will reach out to you first if we
        believe your use constitutes abuse before applying any sanctions.
    </P>
</Modal>

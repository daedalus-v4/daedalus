<script lang="ts">
    import { invalidateAll } from "$app/navigation";
    import { page } from "$app/stores";
    import A from "$lib/components/A.svelte";
    import Button from "$lib/components/Button.svelte";
    import P from "$lib/components/P.svelte";
    import Panel from "$lib/components/Panel.svelte";
    import { SlideToggle } from "@skeletonlabs/skeleton";

    let annual = true;
    let loading = false;

    $: basicKeys = $page.data.keys.filter((key: string) => key.startsWith("bpk_"));
    $: ultimateKeys = $page.data.keys.filter((key: string) => key.startsWith("upk_"));

    $: [basicTotal, ultimateTotal] = ["basic", "ultimate"].map((key, index) =>
        ($page.data.sessions as { subscriptions: { level: string; quantity: number }[] }[])
            .flatMap((session) => session.subscriptions.filter((sub) => sub.level === key).map((sub) => sub.quantity))
            .reduce((x, y) => x + y, 0),
    );

    $: basicQuantity = basicTotal - basicKeys.length;
    $: ultimateQuantity = ultimateTotal - ultimateKeys.length;

    async function getKey(level: string) {
        loading = true;

        const request = await fetch(`/api/premium/key?${new URLSearchParams({ level })}`, { method: "POST" });
        const response = await request.text();

        if (!request.ok) {
            loading = false;
            return alert(response);
        }

        await invalidateAll();
        loading = false;
    }

    async function moveToBottom(key: string) {
        loading = true;

        const request = await fetch(`/api/premium/move-key-to-bottom?${new URLSearchParams({ key })}`, { method: "POST" });
        const response = await request.text();

        if (!request.ok) {
            loading = false;
            return alert(response);
        }

        await invalidateAll();
        loading = false;
    }

    async function deleteKey(key: string) {
        if (
            !confirm(
                "Are you sure you want to delete this key? This guild will lose premium if no other key is providing it with premium and you will be able to create a new key.",
            )
        )
            return;

        loading = true;

        const request = await fetch(`/api/premium/delete-key?${new URLSearchParams({ key })}`, { method: "POST" });
        const response = await request.text();

        if (!request.ok) {
            loading = false;
            return alert(response);
        }

        await invalidateAll();
        loading = false;
    }
</script>

<div>
    Make sure you read the <A to="/premium/info">Daedalus Premium Info Page</A> before purchasing a subscription!
</div>

<Panel>
    <div class="flex flex-col gap-4">
        <h2 class="h2">Your Premium Status</h2>
        <h3 class="h3">Edit Existing Subscriptions</h3>
        {#each $page.data.sessions as session}
            <Panel>
                <h4 class="h4 flex flex-col items-start gap-2">
                    {#each session.subscriptions as { created, product, quantity }}
                        <span>
                            {product}
                            {#if quantity !== 1}(&times;{quantity}){/if}
                            <span class="text-surface-400">created {new Date(created * 1000).toLocaleString()}</span>
                        </span>
                    {/each}
                </h4>
                <a href={session.url} class="inline-flex"><Button>Edit on Stripe</Button></a>
            </Panel>
        {/each}
        <h3 class="h3">Add New Subscription</h3>
        <Panel>
            <h4 class="h4 flex items-center gap-4">
                Monthly
                <SlideToggle name="" size="sm" bind:checked={annual} />
                Annual
            </h4>
            {#if annual}
                <a href={$page.data.links[1]}><Button>Basic Premium &mdash; $50/yr</Button></a>
                <a href={$page.data.links[3]}><Button>Ultimate Premium &mdash; $100/yr</Button></a>
            {:else}
                <a href={$page.data.links[0]}><Button>Basic Premium &mdash; $5/mo</Button></a>
                <a href={$page.data.links[2]}><Button>Ultimate Premium &mdash; $10/mo</Button></a>
                <p class="text-lg text-tertiary-500 dark:text-tertiary-400">Save 16% with an annual subscription!</p>
            {/if}
            <P size="md">
                If you already paid for a subscription but it hasn't shown up here, your charge is still processing; please wait a few minutes. If this page
                does not update with your subscription after a few minutes, please contact support.
            </P>
        </Panel>
    </div>
</Panel>

<Panel>
    <h2 class="h2">Premium Keys</h2>
    {#each [true, false] as ultimate}
        <span class="flex items-center gap-4">
            {#if ultimate}
                <Button variant="secondary" disabled={loading || ultimateQuantity <= 0} on:click={() => getKey("ultimate")}>
                    New Ultimate Key (&times; {Math.max(0, ultimateQuantity)} remaining)
                </Button>
            {:else}
                <Button disabled={loading || basicQuantity <= 0} on:click={() => getKey("basic")}>
                    New Basic Key (&times; {Math.max(0, basicQuantity)} remaining)
                </Button>
            {/if}
        </span>
        <ul class="list-disc pl-4">
            {#each ultimate ? ultimateKeys : basicKeys as key, index}
                {#if key.startsWith(ultimate ? "upk_" : "bpk_")}
                    {@const guild = $page.data.activations[key]}
                    <li class="pl-2 py-1">
                        <svelte:element this={index >= (ultimate ? ultimateTotal : basicTotal) ? "s" : "span"}>
                            <code class="code">{key}</code> &mdash;
                            <Button variant="error-text-only" class="inline-flex p-0" disabled={loading} on:click={() => moveToBottom(key)}>
                                Move to bottom
                            </Button>
                            &mdash;
                            <Button variant="error-text-only" class="inline-flex p-0" disabled={loading} on:click={() => deleteKey(key)}>Delete</Button>
                            &mdash;
                            {#if guild}
                                <code class="code">{guild}</code>
                            {:else}
                                Not Activated
                            {/if}
                        </svelte:element>
                    </li>
                {/if}
            {/each}
        </ul>
    {/each}
</Panel>

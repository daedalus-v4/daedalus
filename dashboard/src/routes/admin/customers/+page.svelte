<script lang="ts">
    import { enhance } from "$app/forms";
    import Button from "$lib/components/Button.svelte";
    import P from "$lib/components/P.svelte";
    import Panel from "$lib/components/Panel.svelte";

    export let form: any;

    let discord: string = "";
    let customer: string = "";
</script>

<form method="post" use:enhance>
    <Panel>
        <h2 class="h2">Customers</h2>
        <div class="flex items-center gap-4">
            <input name="discord" type="text" class="input" placeholder="Discord ID" bind:value={discord} />
            <input name="stripe" type="text" class="input" placeholder="Stripe Customer ID" bind:value={customer} />
        </div>
        <div class="flex items-center gap-4">
            <Button><input type="submit" name="submit" value="Fetch Discord User from Customer ID" class="cursor-pointer" /></Button>
            <Button><input type="submit" name="submit" value="Fetch Customer IDs from Discord User" class="cursor-pointer" /></Button>
            <Button><input type="submit" name="submit" value="Add Association" class="cursor-pointer" /></Button>
            <Button><input type="submit" name="submit" value="Remove Association" class="cursor-pointer" /></Button>
        </div>
        {#if form?.error}
            <P class="text-red-600 dark:text-red-500">{@html form.error}</P>
        {:else if form?.success}
            <P class="text-success-500 dark:text-success-400">{@html form.success}</P>
        {:else if form?.discord}
            <P><code class="code">{form.og}</code> is assigned to <code class="code">{form.discord}</code></P>
        {:else if form?.customers}
            <P>
                {#if form.customers.length === 0}
                    <code class="code">{form.og}</code> does not have any Stripe customers assigned to them.
                {:else}
                    <code class="code">{form.og}</code> has the following Stripe customers assigned to them:
                    <ul class="list-disc pl-4">
                        {#each form.customers as id}
                            <li class="pl-2"><code class="code">{id}</code></li>
                        {/each}
                    </ul>
                {/if}
            </P>
        {/if}
    </Panel>
</form>

<script lang="ts">
    import { page } from "$app/stores";
    import { getLimit, limits } from "shared";
    import A from "./A.svelte";
    import Icon from "./Icon.svelte";
    import P from "./P.svelte";

    export let amount: number;
    export let key: keyof typeof limits;

    const limit = getLimit(key, $page.data.premium.increasedLimits);
    const basic = getLimit(key, 1);
    const ultimate = getLimit(key, 2);

    export let limited: boolean = amount >= limit;
    $: limited = amount >= limit;
</script>

{#if amount >= limit}
    <P class="text-red">
        You've {amount > limit ? "exceeded" : "reached"} the limit ({limit}).
        {#if amount > limit}Please remove some entries before saving.{/if}
        {#if basic > limit || ultimate > limit}
            Upgrade to
            <A to="/premium" external class="text-yellow-600 dark:text-yellow-400"><Icon icon="crown" /> {basic > limit ? "premium" : "Daedalus Ultimate"}</A> to
            increase the limit to {basic > limit ? "up to" : ""}
            {ultimate}!
        {/if}
    </P>
{:else}
    <slot />
{/if}

<script lang="ts">
    import { page } from "$app/stores";
    import { getLimit, limits } from "shared";
    import A from "./A.svelte";
    import Icon from "./Icon.svelte";
    import P from "./P.svelte";

    export let amount: number;
    export let key: keyof typeof limits;

    const limit = getLimit(key, $page.data.premium.increasedLimits);
    const raised = getLimit(key, true);
    const showPromo = raised > limit;

    export let limited: boolean = amount >= limit;
    $: limited = amount >= limit;
</script>

{#if amount >= limit}
    <P class="text-red">
        You've {amount > limit ? "exceeded" : "reached"} the limit ({limit}).
        {#if amount > limit}Please remove some entries before saving.{/if}
        {#if showPromo}
            Upgrade to <A to="/premium" external class="text-yellow-600 dark:text-yellow-400"><Icon icon="crown" /> premium</A> to increase the limit to {raised}!
        {/if}
    </P>
{:else}
    <slot />
{/if}

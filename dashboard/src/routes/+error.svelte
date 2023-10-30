<script lang="ts">
    import { page } from "$app/stores";
    import A from "$lib/components/A.svelte";
</script>

<div class="h-full grid items-center justify-center">
    <div class="block card card-hover p-4 bg-surface-100 dark:bg-surface-800">
        <header class="card-header text-5xl p-4">
            <span class="font-bold text-error-500 dark:text-error-400">
                {$page.status}
            </span>
            <span>{$page.error?.message}</span>
        </header>
        <hr />
        <section class="p-4">
            <p class="prose lg:prose-xl text-surface-800 dark:text-surface-50">
                {#if $page.status === 404}
                    The requested page could not be found. If you arrived here via a link on this webpage, please let us know in our support server! Otherwise,
                    check the spelling of the link, including capitalization.
                {:else}
                    If this issue perists, let us know in our support server!
                {/if}
            </p>
        </section>
        <hr />
        <footer class="card-footer p-4 flex flex-col items-start">
            <div class="flex items-center gap-8">
                <A on:click={() => history.back()}>Back</A>
                <span class="divider-vertical h-8" />
                <A to="/">Home</A>
            </div>
        </footer>
    </div>
</div>

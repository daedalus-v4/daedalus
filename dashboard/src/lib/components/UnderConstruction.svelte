<script lang="ts">
    import A from "./A.svelte";
    import P from "./P.svelte";
</script>

<div class="h-full grid items-center justify-center">
    <div class="block card card-hover p-4 bg-surface-100 dark:bg-surface-800">
        <header class="card-header text-5xl p-4">
            <span class="font-bold">Under Construction</span>
        </header>
        <hr />
        <section class="p-4">
            <P>Hey! We're working hard on this page right now. Come back at a later date!</P>
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

<script>
    import A from "$lib/components/A.svelte";
    import P from "$lib/components/P.svelte";
</script>

<div class="h-full grid items-center justify-center">
    <div class="block card card-hover p-4 bg-surface-100 dark:bg-surface-800">
        <header class="card-header text-5xl p-4">
            <span
                class="font-bold bg-clip-text text-transparent box-decoration-clone bg-gradient-to-br from-primary-500 via-tertiary-500 to-secondary-500 dark:from-primary-400 dark:via-tertiary-400 dark:to-secondary-400"
            >
                Thank You!
            </span>
        </header>
        <hr />
        <section class="p-4">
            <P>
                Thank you for subscribing to Daedalus Premium! We appreciate your support. To manage your premium servers, visit your
                <A to="/account/premium">account settings</A>.
            </P>
        </section>
    </div>
</div>

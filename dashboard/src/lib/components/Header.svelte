<script lang="ts">
    import Container from "./Container.svelte";
</script>

<div class="bg-primary-400 dark:bg-primary-500 py-12 drop-shadow-2xl">
    <Container class="flex flex-col items-start gap-2">
        <slot />
    </Container>
</div>

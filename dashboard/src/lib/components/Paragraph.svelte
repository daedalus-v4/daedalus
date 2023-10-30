<script lang="ts">
    export let size: "md" | "lg" | "xl" = "lg";
</script>

<p class="prose-{size} text-surface-900 dark:text-surface-50">
    <slot />
</p>

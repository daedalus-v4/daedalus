<script lang="ts">
    export let size: string = "4";
</script>

<svg viewBox="0 0 100 100" class="h-{size} w-{size}">
    <polygon id="small" class="text-primary-700 dark:text-primary-500 stroke-current stroke-[5px] fill-transparent" points="50,86 81.2,32 18.6,32" />
    <polygon id="large" class="text-primary-500 dark:text-primary-400 stroke-current stroke-[3px] fill-transparent" points="50,95 89,27.5 11,27.5" />
</svg>

<style lang="postcss">
    @keyframes spin {
        0% {
            transform: rotateZ(0deg);
        }
        100% {
            transform: rotateZ(360deg);
        }
    }

    #large {
        transform-origin: 50% 50%;
        animation: 2500ms spin cubic-bezier(0.75, 0.25, 0.25, 0.75) infinite;
    }

    #small {
        transform-origin: 50% 50%;
        animation: 7500ms spin linear infinite reverse;
    }
</style>

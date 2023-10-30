<script lang="ts">
    import Container from "$lib/components/Container.svelte";
    import Navbar from "$lib/components/Navbar.svelte";
    import UpButton from "$lib/components/UpButton.svelte";
    import { arrow, autoUpdate, computePosition, flip, offset, shift } from "@floating-ui/dom";
    import { storePopup } from "@skeletonlabs/skeleton";
    import "../app.postcss";

    storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
</script>

<Navbar />
<UpButton />
<div class="h-full pt-16">
    <div class="h-full grid" style="grid-template-rows: 1fr auto">
        <div class="pb-12 bg-surface-200 dark:bg-surface-800">
            <slot />
        </div>
        <Container class="py-4 bg-surface-600 dark:bg-surface-900 text-surface-50">
            <span class="text-lg">
                &copy; 2023 hyper-neutrino &mdash;
                <a href="/terms" class="text-secondary-400">Terms of Service</a> &mdash;
                <a href="/privacy" class="text-secondary-400">Privacy Policy</a>
            </span>
        </Container>
    </div>
</div>

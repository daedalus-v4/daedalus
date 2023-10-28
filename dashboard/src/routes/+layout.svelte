<script lang="ts">
    import Navbar from "$lib/components/Navbar.svelte";
    import { arrow, autoUpdate, computePosition, flip, offset, shift } from "@floating-ui/dom";
    import { storePopup } from "@skeletonlabs/skeleton";
    import "../app.postcss";

    storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
</script>

<Navbar />
<div class="h-full px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24">
    <slot />
</div>

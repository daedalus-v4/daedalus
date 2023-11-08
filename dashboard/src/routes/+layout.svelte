<script lang="ts">
    import ChannelSelectorModal from "$lib/components/ChannelSelectorModal.svelte";
    import Navbar from "$lib/components/Navbar.svelte";
    import PermissionModal from "$lib/components/PermissionModal.svelte";
    import RoleSelectorModal from "$lib/components/RoleSelectorModal.svelte";
    import UpButton from "$lib/components/UpButton.svelte";
    import { arrow, autoUpdate, computePosition, flip, offset, shift } from "@floating-ui/dom";
    import { initializeStores, storeHighlightJs, storePopup } from "@skeletonlabs/skeleton";
    import "../app.postcss";

    import MessageEditorModal from "$lib/components/MessageEditorModal.svelte";
    import { modalStackStore } from "$lib/stores";
    import hljs from "highlight.js/lib/core";
    import json from "highlight.js/lib/languages/json";
    import plaintext from "highlight.js/lib/languages/plaintext";
    import "highlight.js/styles/github-dark.css";

    hljs.registerLanguage("json", json);
    hljs.registerLanguage("plaintext", plaintext);

    $storeHighlightJs = hljs;

    initializeStores();
    $storePopup = { computePosition, autoUpdate, flip, shift, offset, arrow };
</script>

<svelte:window on:keydown={(e) => e.key === "Escape" && [$modalStackStore.at(-1)?.()]} />

<PermissionModal />
<RoleSelectorModal />
<ChannelSelectorModal />
<MessageEditorModal />

<input id="unfocus-dummy" class="fixed opacity-0 pointer-events-none" readonly />

<Navbar />
<UpButton />
<div class="h-full pt-16">
    <div class="h-full grid" style="grid-template-rows: 1fr auto">
        <div class="bg-surface-200 dark:bg-surface-700">
            <slot />
        </div>
        <div class="bg-surface-600 dark:bg-surface-900 text-surface-50">
            <div class="h-16 flex items-center px-4">
                <span class="text-lg">
                    &copy; 2023 hyper-neutrino &mdash;
                    <a href="/terms" class="text-secondary-400">Terms <span class="hidden sm:inline">of Service</span></a> &mdash;
                    <a href="/privacy" class="text-secondary-400">Privacy <span class="hidden sm:inline">Policy</span></a>
                </span>
            </div>
        </div>
    </div>
</div>

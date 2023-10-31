import { writable } from "svelte/store";
import type { FEModulesPermissionsSettings } from "./types.js";

export const permissionModalStore = writable<string | null>(null);

export const roleSelectorModalStore = writable<{
    showManaged: boolean;
    showHigher: boolean;
    showEveryone: boolean;
    select: (id: string, set: (ids: string[]) => unknown) => unknown;
    selected: string[];
} | null>(null);

export const channelSelectorModalStore = writable<{
    select: (id: string, set: (ids: string[]) => unknown) => unknown;
    selected: string[];
} | null>(null);

export const commandPermissionsModalStore = writable<FEModulesPermissionsSettings["commands"][string] | null>(null);

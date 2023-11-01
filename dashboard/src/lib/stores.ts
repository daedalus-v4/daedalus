import { writable } from "svelte/store";
import type { FEModulesPermissionsSettings } from "./types.js";

export const modalStackStore = writable<(() => unknown)[]>([]);

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

export const commandPermissionsModalStore = writable<{
    mid: string;
    cid: string;
    settings: FEModulesPermissionsSettings["commands"][string];
    set: (x: FEModulesPermissionsSettings["commands"][string]) => unknown;
} | null>(null);

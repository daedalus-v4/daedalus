import type { FEMessageData } from "shared";
import { writable } from "svelte/store";
import type { FEModulesPermissionsSettings } from "./types.js";

export const modalStackStore = writable<(() => unknown)[]>([]);

export const permissionModalStore = writable<string | null>(null);

export const messageEditorModalStore = writable<{ isStatic: boolean; message: FEMessageData; set: (data: FEMessageData) => unknown } | null>(null);

export const roleSelectorModalStore = writable<{
    showManaged: boolean;
    showHigher: boolean;
    showEveryone: boolean;
    select: (id: string, set: (ids: string[]) => unknown) => unknown;
    selected: string[];
} | null>(null);

export const channelSelectorModalStore = writable<{
    types: number[] | null;
    select: (id: string, set: (ids: string[]) => unknown) => unknown;
    selected: string[];
} | null>(null);

export const emojiSelectorModalStore = writable<{
    hideGlobal: boolean;
    select: (id: string, set: (ids: string[]) => unknown) => unknown;
    selected: string[];
} | null>(null);

export const stickerSelectorModalStore = writable<{
    select: (id: string, set: (ids: string[]) => unknown) => unknown;
    selected: string[];
} | null>(null);

export const commandPermissionsModalStore = writable<{
    mid: string;
    cid: string;
    settings: FEModulesPermissionsSettings["commands"][string];
    set: (x: FEModulesPermissionsSettings["commands"][string]) => unknown;
} | null>(null);

export const globalEmojiStore = writable<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global: { categories: ({ emojis: string[] } & Omit<Record<string, any>, "emojis">)[] } & Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reverseMap: Record<string, any>;
}>({ global: { categories: [{ emojis: [] }] }, reverseMap: {} });

export const globalEmojiHasBeenLoadedStore = writable<boolean>(false);

import type { FEData, FEReactionRolesSettings } from "$lib/types.js";
import type { DbReactionRolesSettings } from "shared";
import { b2fMessage, f2bMessage } from "./utils.js";

export async function b2fReactionRolesSettings(fe: FEData, data: Partial<DbReactionRolesSettings> | null): Promise<FEReactionRolesSettings> {
    return { entries: (data?.entries ?? []).map((entry) => ({ ...entry, promptMessage: b2fMessage(entry.promptMessage) })) };
}

export async function f2bReactionRolesSettings(data: FEReactionRolesSettings, guild: string): Promise<DbReactionRolesSettings> {
    data.entries.forEach((entry, outerIndex) => {
        try {
            if (!entry.name.trim()) throw `Provide a name for display in the dashboard.`;

            if (entry.addReactionsToExistingMessage) {
                if (!entry.url.trim().match(/^https:\/\/([^.]+\.)?discord\.com\/channels(\/[1-9][0-9]{16,19}){3}$/)) throw `Invalid message URL.`;
                if (entry.url.split("/")[4] !== guild) throw `Message URL must point to a message in this server.`;
            } else {
                if (!entry.channel) throw `Provide a channel in which to post the reaction role prompt.`;
            }

            if (!entry.addReactionsToExistingMessage && entry.style === "dropdown") {
                if (entry.dropdownData.length === 0) throw `You must provide at least one dropdown.`;

                entry.dropdownData.forEach((entry, index) => {
                    if (!entry.label.trim()) throw `Dropdown options must have labels (missing in dropdown #${index + 1}).`;
                    if (!entry.role) throw `Dropdown options must each have a role (missing in dropdown #${index + 1}).`;
                });
            } else if (!entry.addReactionsToExistingMessage && entry.style === "buttons") {
                if (entry.buttonData.length === 0) throw `You must provide at least one button row.`;

                entry.buttonData.forEach((row, rowIndex) => {
                    if (row.length === 0) throw `Button rows must not be empty (row #${rowIndex + 1}).`;

                    row.forEach((entry, index) => {
                        if (!entry.emoji && !entry.label.trim())
                            throw `Button options must have an emoji and/or a label (both missing in row #${rowIndex + 1} button #${index + 1}).`;
                        if (!entry.role) throw `Button options must each have a role (missing in row #${rowIndex + 1} button #${index + 1}).`;
                    });
                });
            } else if (entry.addReactionsToExistingMessage || entry.style === "reactions") {
                if (entry.reactionData.length === 0) throw `You must provide at least one reaction.`;

                entry.reactionData.forEach((entry, index) => {
                    if (!entry.emoji) throw `Reaction options must have an emoji (missing in reaction #${index + 1}).`;
                    if (!entry.role) throw `Reaction options must have a role (missing in reaction #${index + 1}).`;
                });

                if (entry.reactionData.length > new Set(entry.reactionData.map((x) => x.emoji)).size) throw `Reaction options must have unique emoji.`;
            }
        } catch (e) {
            throw `Prompt #${outerIndex + 1}: ${e}`;
        }
    });

    return { entries: data.entries.map((entry) => ({ ...entry, promptMessage: f2bMessage(entry.promptMessage, true) })) };
}

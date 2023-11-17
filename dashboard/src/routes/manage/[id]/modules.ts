import { b2fAutomodSettings, f2bAutomodSettings } from "$lib/modules/automod.js";
import { b2fAutoresponderSettings, f2bAutoresponderSettings } from "$lib/modules/autoresponder.js";
import { b2fCoOpSettings, f2bCoOpSettings } from "$lib/modules/co-op.js";
import { b2fCountSettings, f2bCountSettings } from "$lib/modules/count.js";
import { b2fCustomRolesSettings, f2bCustomRolesSettings } from "$lib/modules/custom-roles.js";
import { b2fGuildSettings, f2bGuildSettings } from "$lib/modules/guild-settings.js";
import { b2fLoggingSettings, f2bLoggingSettings } from "$lib/modules/logging.js";
import { b2fModmailSettings, f2bModmailSettings } from "$lib/modules/modmail.js";
import { b2fModulesPermissionsSettings, f2bModulesPermissionsSettings } from "$lib/modules/modules-permissions-settings.js";
import { b2fNukeguardSettings, f2bNukeguardSettings } from "$lib/modules/nukeguard.js";
import { b2fReactionRolesSettings, f2bReactionRolesSettings } from "$lib/modules/reaction-roles.js";
import { b2fRedditFeedsSettings, f2bRedditFeedsSettings } from "$lib/modules/reddit-feeds.js";
import { b2fStarboardSettings, f2bStarboardSettings } from "$lib/modules/starboard.js";
import { b2fStatsChannelsSettings, f2bStatsChannelsSettings } from "$lib/modules/stats-channels.js";
import { b2fStickyRolesSettings, f2bStickyRolesSettings } from "$lib/modules/sticky-roles.js";
import { b2fSuggestionsSettings, f2bSuggestionsSettings } from "$lib/modules/suggestions.js";
import { b2fSupporterAnnouncementsSettings, f2bSupporterAnnouncementsSettings } from "$lib/modules/supporter-announcements.js";
import { b2fTicketsSettings, f2bTicketsSettings } from "$lib/modules/tickets.js";
import { b2fWelcomeSettings, f2bWelcomeSettings } from "$lib/modules/welcome.js";
import { b2fXpSettings, f2bXpSettings } from "$lib/modules/xp.js";

export const b2f = {
    "-": b2fGuildSettings,
    "modules-permissions": b2fModulesPermissionsSettings,
    logging: b2fLoggingSettings,
    welcome: b2fWelcomeSettings,
    "supporter-announcements": b2fSupporterAnnouncementsSettings,
    xp: b2fXpSettings,
    "reaction-roles": b2fReactionRolesSettings,
    starboard: b2fStarboardSettings,
    automod: b2fAutomodSettings,
    "sticky-roles": b2fStickyRolesSettings,
    "custom-roles": b2fCustomRolesSettings,
    "stats-channels": b2fStatsChannelsSettings,
    autoresponder: b2fAutoresponderSettings,
    modmail: b2fModmailSettings,
    tickets: b2fTicketsSettings,
    nukeguard: b2fNukeguardSettings,
    suggestions: b2fSuggestionsSettings,
    "co-op": b2fCoOpSettings,
    "reddit-feeds": b2fRedditFeedsSettings,
    count: b2fCountSettings,
};

export const f2b = {
    "-": f2bGuildSettings,
    "modules-permissions": f2bModulesPermissionsSettings,
    logging: f2bLoggingSettings,
    welcome: f2bWelcomeSettings,
    "supporter-announcements": f2bSupporterAnnouncementsSettings,
    xp: f2bXpSettings,
    "reaction-roles": f2bReactionRolesSettings,
    starboard: f2bStarboardSettings,
    automod: f2bAutomodSettings,
    "sticky-roles": f2bStickyRolesSettings,
    "custom-roles": f2bCustomRolesSettings,
    "stats-channels": f2bStatsChannelsSettings,
    autoresponder: f2bAutoresponderSettings,
    modmail: f2bModmailSettings,
    tickets: f2bTicketsSettings,
    nukeguard: f2bNukeguardSettings,
    suggestions: f2bSuggestionsSettings,
    "co-op": f2bCoOpSettings,
    "reddit-feeds": f2bRedditFeedsSettings,
    count: f2bCountSettings,
};

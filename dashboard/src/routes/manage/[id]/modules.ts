import { b2fGuildSettings, f2bGuildSettings } from "$lib/modules/guild-settings.js";
import { b2fLoggingSettings, f2bLoggingSettings } from "$lib/modules/logging.js";
import { b2fModulesPermissionsSettings, f2bModulesPermissionsSettings } from "$lib/modules/modules-permissions-settings.js";
import { b2fSupporterAnnouncementsSettings, f2bSupporterAnnouncementsSettings } from "$lib/modules/supporter-announcements.js";
import { b2fWelcomeSettings, f2bWelcomeSettings } from "$lib/modules/welcome.js";
import { b2fXpSettings, f2bXpSettings } from "$lib/modules/xp.js";

export const b2f = {
    "-": b2fGuildSettings,
    "modules-permissions": b2fModulesPermissionsSettings,
    logging: b2fLoggingSettings,
    welcome: b2fWelcomeSettings,
    "supporter-announcements": b2fSupporterAnnouncementsSettings,
    xp: b2fXpSettings,
};

export const f2b = {
    "-": f2bGuildSettings,
    "modules-permissions": f2bModulesPermissionsSettings,
    logging: f2bLoggingSettings,
    welcome: f2bWelcomeSettings,
    "supporter-announcements": f2bSupporterAnnouncementsSettings,
    xp: f2bXpSettings,
};

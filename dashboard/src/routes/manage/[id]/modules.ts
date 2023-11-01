import { b2fGuildSettings, f2bGuildSettings } from "$lib/modules/guild-settings.js";
import { b2fModulesPermissionsSettings, f2bModulesPermissionsSettings } from "$lib/modules/modules-permissions-settings.js";
import { b2fWelcomeSettings, f2bWelcomeSettings } from "$lib/modules/welcome.js";

export const b2f = { "-": b2fGuildSettings, "modules-permissions": b2fModulesPermissionsSettings, welcome: b2fWelcomeSettings };

export const f2b = { "-": f2bGuildSettings, "modules-permissions": f2bModulesPermissionsSettings, welcome: f2bWelcomeSettings };

import { db } from "shared/db.js";

export default () => ({
    "-": db.guildSettings,
    "modules-permissions": db.modulesPermissionsSettings,
    logging: db.loggingSettings,
    welcome: db.welcomeSettings,
    "supporter-announcements": db.supporterAnnouncementSettings,
    xp: db.xpSettings,
    "reaction-roles": db.reactionRolesSettings,
    starboard: db.starboardSettings,
    automod: db.automodSettings,
    "sticky-roles": db.stickyRolesSettings,
    "custom-roles": db.customRolesSettings,
    "stats-channels": db.statsChannelsSettings,
});

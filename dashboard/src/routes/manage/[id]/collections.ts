import { db } from "shared/db.js";

export default () => ({
    "-": db.guildSettings,
    "modules-permissions": db.modulesPermissionsSettings,
    logging: db.loggingSettings,
    welcome: db.welcomeSettings,
    "supporter-announcements": db.supporterAnnouncementSettings,
    xp: db.xpSettings,
});

import { db } from "shared/db.js";

export default () => ({
    "-": db.guildSettings,
    "modules-permissions": db.modulesPermissionsSettings,
    logging: db.loggingSettings,
    welcome: db.welcomeSettings,
});

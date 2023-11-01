import { db } from "shared/db.js";

export default () => ({ "-": db.guildSettings, "modules-permissions": db.modulesPermissionsSettings, welcome: db.welcomeSettings });

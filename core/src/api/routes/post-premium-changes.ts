import { escapeMarkdown, PermissionFlagsBits } from "discord.js";
import { t } from "elysia";
import { db, getColor, getPremiumBenefitsFor } from "shared/db.js";
import { getClient } from "../../lib/premium.js";
import { App } from "../app.js";

const names = ["Free Tier", "Basic Premium", "Ultimate Premium"];

export default (app: App) =>
    app.post(
        "/premium-changes",
        async ({ body: { changes } }) => {
            for (const [gid, before, after] of changes) {
                const guild = await (await getClient(gid).catch(() => {}))?.guilds.fetch(gid).catch(() => {});
                if (!guild) continue;

                const owner = await guild.fetchOwner().catch(() => {});

                const permissions = (await db.guildSettings.findOne({ guild: gid }))?.dashboardPermissions ?? "manager";

                const managers =
                    permissions === "owner"
                        ? []
                        : (await guild.members.fetch())
                              .filter(
                                  (member) =>
                                      member.id !== owner?.id &&
                                      member.permissions.has(permissions === "admin" ? PermissionFlagsBits.Administrator : PermissionFlagsBits.ManageGuild),
                              )
                              .toJSON();

                const settings = await db.accountSettings.find({ user: { $in: [...(owner ? [owner.id] : []), ...managers.map((x) => x.id)] } }).toArray();
                const settingMap = Object.fromEntries(settings.map((x) => [x.user, x]));

                for (const user of [...(owner ? [owner] : []), ...managers])
                    if (
                        settingMap[user.id]?.[
                            user.id === owner?.id ? "notifyWhenOwnedServerPremiumStatusChanges" : "notifyWhenManagedServerPremiumStatusChanges"
                        ] ??
                        user.id === owner?.id
                    )
                        await user
                            .send({
                                embeds: [
                                    {
                                        title: "Premium Status Changed",
                                        description: `Hello ${owner},\n\nThe premium status of **${escapeMarkdown(guild.name)}** has changed from ${
                                            names[before]
                                        } to ${
                                            names[after]
                                        }. Please double-check your module settings as the change in module limits may affect functionality (${
                                            before < after
                                                ? "previously disabled prompts/actions may start operating again"
                                                : `some items may become disabled${
                                                      after === 0 ? ", and multi-target modmail and ticket prompts are only available with premium" : ""
                                                  }`
                                        }).${
                                            guild.client.token === Bun.env.TOKEN
                                                ? ""
                                                : (await getPremiumBenefitsFor(guild.id)).vanityClient
                                                  ? ""
                                                  : ` Additionally, this client will be disabled as vanity/custom clients are a feature this server no longer has access to. Please follow the instructions available at ${Bun.env.DOMAIN}/docs/guides/custom-clients for what changes/adjustments may be needed.`
                                        }\n\nIf you would like to stop receiving these notifications, please go to ${Bun.env.DOMAIN}/account.`,
                                        color: await getColor(guild),
                                    },
                                ],
                            })
                            .catch(() => {});
            }

            return true;
        },
        {
            body: t.Object({ changes: t.Array(t.Tuple([t.String(), t.Number(), t.Number()])) }),
            response: t.Boolean(),
        },
    );

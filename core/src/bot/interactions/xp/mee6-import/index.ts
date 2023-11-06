import { ButtonStyle, ComponentType, StringSelectMenuInteraction } from "discord.js";
import { colors } from "../../../lib/format.js";

export default async function (cmd: StringSelectMenuInteraction) {
    const [mode] = cmd.values;

    if (mode === "Cancel")
        return void (await cmd.update({
            embeds: [{ title: "Canceled", description: "MEE6 XP Import was canceled.", color: colors.prompts.canceled }],
            components: [],
        }));

    await cmd.update({
        embeds: [
            {
                title: "Confirm importing XP from MEE6",
                description: `You are about to import MEE6 XP into Daedalus. This will ${
                    {
                        ADD: "be added to existing Daedalus XP",
                        REPLACE: "replace all existing Daedalus XP",
                        KEEP: "be imported for users without Daedalus XP but will not be added to users with Daedalus XP",
                    }[mode]
                }. Voice XP will not be affected. This action is **irreversible**.`,
                color: colors.prompts.confirm,
            },
        ],
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    { type: ComponentType.Button, style: ButtonStyle.Success, customId: `:${cmd.user.id}:xp/mee6-import/confirm:${mode}`, label: "Import" },
                    { type: ComponentType.Button, style: ButtonStyle.Danger, customId: `:${cmd.user.id}:cancel`, label: "Cancel" },
                ],
            },
        ],
    });
}

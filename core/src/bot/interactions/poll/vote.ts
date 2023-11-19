import { ButtonInteraction, StringSelectMenuInteraction } from "discord.js";
import { db } from "shared/db.js";
import { renderPoll } from "../../modules/polls/lib.js";

export default async function (cmd: ButtonInteraction | StringSelectMenuInteraction, option: string) {
    const poll = await db.polls.findOne({ message: cmd.message.id });
    if (!poll) throw "Unexpected error: poll not found for this message.";

    if (poll.type === "binary") option = { yes: poll.leftOption, meh: "", no: poll.rightOption }[option]!;

    const vote = cmd.isStringSelectMenu() ? cmd.values : option;
    await db.polls.updateOne({ _id: poll._id }, { $set: { [`votes.${cmd.user.id}`]: vote } });
    poll.votes[cmd.user.id] = vote;

    await cmd.update(await renderPoll(poll, cmd.guild!));
}

import { ButtonInteraction } from "discord.js";
import { db } from "shared/db.js";
import { renderPoll } from "../../modules/polls/lib.js";

export default async function (button: ButtonInteraction) {
    const poll = await db.polls.findOne({ message: button.message.id });
    if (!poll) throw "Unexpected error: poll not found for this message.";

    await db.polls.updateOne({ _id: poll._id }, { $unset: { [`votes.${button.user.id}`]: 1 } });
    delete poll.votes[button.user.id];

    await button.update(await renderPoll(poll, button.guild!));
}

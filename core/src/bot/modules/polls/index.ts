import Argentium from "argentium";
import { ChatInputCommandInteraction, ComponentType, TextInputStyle } from "discord.js";
import { DBPoll } from "shared";
import { db } from "shared/db.js";
import { template } from "../../lib/format.js";
import { renderPoll } from "./lib.js";

export default (app: Argentium) =>
    app.commands((x) =>
        x
            .slash((x) =>
                x
                    .key("poll yes-no")
                    .description("create a yes/no poll")
                    .booleanOption("allow-neutral", "if true, allow users to vote neutrally")
                    .fn(getQuestionAndThreadName)
                    .fn(async ({ _, "allow-neutral": allowNeutral, question, threadName, modal }) => {
                        if (question === null) return;
                        await createPoll(_, { type: "yes-no", allowNeutral: !!allowNeutral, question, votes: {} }, threadName);
                        await modal.editReply(template.success("Your poll has been created!"));
                    }),
            )
            .slash((x) =>
                x
                    .key("poll binary")
                    .description("create a binary choice poll")
                    .stringOption("left-option", "left option's name", { required: true, maxLength: 80 })
                    .stringOption("right-option", "right option's name", { required: true, maxLength: 80 })
                    .booleanOption("allow-neutral", "if true, allow users to vote neutrally")
                    .fn(getQuestionAndThreadName)
                    .fn(async ({ _, "left-option": leftOption, "right-option": rightOption, "allow-neutral": allowNeutral, question, threadName, modal }) => {
                        if (question === null) return;
                        await createPoll(_, { type: "binary", leftOption, rightOption, allowNeutral: !!allowNeutral, question, votes: {} }, threadName);
                        await modal.editReply(template.success("Your poll has been created!"));
                    }),
            )
            .slash((x) =>
                x
                    .key("poll multi")
                    .description("create a multiple-choice poll")
                    .stringOption("option-1", "an option for the poll", { required: true })
                    .stringOption("option-2", "an option for the poll", { required: true })
                    .stringOption("option-3", "an option for the poll")
                    .stringOption("option-4", "an option for the poll")
                    .stringOption("option-5", "an option for the poll")
                    .stringOption("option-6", "an option for the poll")
                    .stringOption("option-7", "an option for the poll")
                    .stringOption("option-8", "an option for the poll")
                    .stringOption("option-9", "an option for the poll")
                    .stringOption("option-10", "an option for the poll")
                    .booleanOption("allow-multi", "if true, allow users to vote for multiple options")
                    .fn(getQuestionAndThreadName)
                    .fn(async ({ _, "allow-multi": allowMulti, question, threadName, modal, ...options }) => {
                        if (question === null) return;

                        await createPoll(
                            _,
                            { type: "multi", options: Object.values(options).filter((x) => x) as string[], allowMulti: !!allowMulti, question, votes: {} },
                            threadName,
                        );

                        await modal.editReply(template.success("Your poll has been created!"));
                    }),
            ),
    );

async function getQuestionAndThreadName<T extends { _: ChatInputCommandInteraction }>(data: T) {
    const { _ } = data;

    await _.showModal({
        title: "Creating Poll (30 minutes to fill out)",
        customId: "create-poll",
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.TextInput,
                        style: TextInputStyle.Paragraph,
                        customId: "question",
                        label: "Question",
                        required: true,
                        maxLength: 1024,
                    },
                ],
            },
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.TextInput,
                        style: TextInputStyle.Short,
                        customId: "thread-name",
                        label: "Thread Name",
                        required: false,
                        placeholder: "If set, create a thread with this name. If blank, do nothing.",
                        maxLength: 100,
                    },
                ],
            },
        ],
    });

    const modal = await _.awaitModalSubmit({ time: 30 * 60 * 1000 }).catch(() => {});
    if (!modal) return { ...data, question: null, threadName: null, modal: null };

    await modal.deferReply({ ephemeral: true });

    return { ...data, question: modal.fields.getTextInputValue("question"), threadName: modal.fields.getTextInputValue("thread-name"), modal };
}

async function createPoll(_: ChatInputCommandInteraction, data: DBPoll, threadName: string | null) {
    const message = await _.channel!.send(await renderPoll(data, _.guild!));
    await db.polls.insertOne({ message: message.id, ...data });

    if (threadName) await message.startThread({ name: threadName }).catch(() => {});
}

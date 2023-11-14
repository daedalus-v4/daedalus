import { RepliableInteraction } from "discord.js";

async function _deferTrue({ _ }: { _: RepliableInteraction }) {
    await _.deferReply({ ephemeral: true });
}

async function _deferFalse({ _ }: { _: RepliableInteraction }) {
    await _.deferReply({ ephemeral: false });
}

export function defer(ephemeral: boolean) {
    return ephemeral ? _deferTrue : _deferFalse;
}

export async function fetchCaller<T extends { _: RepliableInteraction }>(data: T) {
    const { _ } = data;
    return { ...data, caller: await _.guild!.members.fetch(_.user) };
}

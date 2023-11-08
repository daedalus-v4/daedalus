import { ButtonComponentData, ButtonInteraction, ButtonStyle, ComponentType, User } from "discord.js";
import { template } from "../lib/format.js";

const stopped = new Set<string>();

export function stopButton(caller: User): ButtonComponentData {
    return { type: ComponentType.Button, customId: `:${caller.id}:stop`, style: ButtonStyle.Danger, label: "HALT" };
}

export function isStopped(id: string) {
    if (stopped.has(id)) {
        stopped.delete(id);
        return true;
    }

    return false;
}

export default async function (button: ButtonInteraction) {
    stopped.add(button.message.id);
    return template.info("Attempting to stop the ongoing action...");
}

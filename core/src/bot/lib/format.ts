import { BaseMessageOptions, ButtonStyle, Colors, ComponentType, GuildChannel, GuildMember, Role, User, escapeMarkdown } from "discord.js";

export function embed(title: string, description: string, color: number, ephemeral: boolean = true): BaseMessageOptions & { ephemeral: boolean } {
    return { embeds: [{ title, description, color }], files: [], components: [], ephemeral };
}

export const template = {
    success: (body: string, ephemeral?: boolean) => embed("OK!", body, Colors.Green, ephemeral),
    error: (body: string, ephemeral?: boolean) => embed("Error!", body, Colors.Red, ephemeral),
    info: (body: string, ephemeral?: boolean) => embed("Info", body, Colors.Blue, ephemeral),
    logerror: (context: string, body: string, ephemeral?: boolean) => embed(`Bot Error: ${context}`, body, Colors.Red, ephemeral),
    confirm: (
        body: string,
        user: string,
        key: string,
        { yesLabel, noLabel, ephemeral }: { yesLabel?: string; noLabel?: string; ephemeral?: boolean } = {},
    ): BaseMessageOptions => ({
        ...embed("Confirm", body, colors.prompts.confirm, ephemeral),
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    { type: ComponentType.Button, customId: `:${user}:${key}`, style: ButtonStyle.Success, label: yesLabel ?? "Confirm" },
                    { type: ComponentType.Button, customId: `:${user}:cancel`, style: ButtonStyle.Danger, label: noLabel ?? "Cancel" },
                ],
            },
        ],
    }),
};

export function expand(item: any, ifAbsent?: string): string {
    if (item instanceof GuildChannel) return `${item} (${escapeMarkdown(item.name)} \`${item.id}\`)`;
    if (item instanceof GuildMember) return `${item} (${escapeMarkdown(item.user.tag)} \`${item.id}\`)`;
    if (item instanceof User) return `${item} (${escapeMarkdown(item.tag)} \`${item.id}\`)`;
    if (item instanceof Role) return `${item} (${escapeMarkdown(item.name)} \`${item.id}\`)`;

    return item || ifAbsent || `${item}`;
}

export function code(x: string): string {
    if (!x) return x;
    if (x.indexOf("`") === -1) return `\`${x}\``;
    if (x.indexOf("``") === -1) return `\`\` ${x} \`\``;
    return `\`\`${x.replaceAll("`", "\u200b`")}\`\``;
}

export const colors = {
    continued: Colors.DarkButNotBlack,
    default: 0x009688,
    error: Colors.Red,
    actions: {
        create: Colors.Green,
        delete: Colors.Red,
        update: Colors.Blue,
        importantUpdate: Colors.Gold,
        bulkDelete: Colors.Purple,
    },
    prompts: {
        confirm: 0xaa4477,
        canceled: Colors.Red,
        inProgress: Colors.Blue,
    },
};

export enum DurationStyle {
    Blank,
    For,
    Until,
}

export function formatDuration(duration: number, style = DurationStyle.For): string {
    if (duration === Infinity) return "indefinitely";

    duration = Math.round(duration / 1000);

    if (duration < 0) {
        const core = _formatDuration(-duration);
        if (style === DurationStyle.Blank) return `negative ${core}`;
        if (style === DurationStyle.For) return `for negative ${core}`;
        if (style === DurationStyle.Until) return `until ${core} ago`;
    }

    if (duration === 0) {
        if (style === DurationStyle.Blank) return "no time";
        if (style === DurationStyle.For) return "for no time";
        if (style === DurationStyle.Until) return "until right now";
    }

    const core = _formatDuration(duration);
    if (style === DurationStyle.Blank) return core;
    if (style === DurationStyle.For) return `for ${core}`;
    if (style === DurationStyle.Until) return `until ${core} from now`;

    return "??";
}

const timescales: [string, number][] = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
    ["second", 1],
];

function _formatDuration(duration: number): string {
    if (duration === Infinity) return "indefinitely";

    const parts: string[] = [];

    for (const [name, scale] of timescales) {
        if (duration >= scale) {
            const amount = Math.floor(duration / scale);
            duration %= scale;

            parts.push(`${amount} ${name}${amount === 1 ? "" : "s"}`);
        }
    }

    return parts.join(" ");
}

export function timestamp(date: number | Date, format?: "t" | "T" | "d" | "D" | "f" | "F" | "R"): string {
    return `<t:${Math.floor((typeof date === "number" ? date : date.getTime()) / 1000)}${format ? `:${format}` : ""}>`;
}

export function timeinfo(date: number | Date | undefined | null) {
    if (!date) return "(unknown time)";
    return `${timestamp(date)} (${timestamp(date, "R")})`;
}

export function idlist(ids: string[]): string {
    let display = "";

    for (let x = 0; x < ids.length; x += 4) {
        display += `${ids
            .slice(x, x + 4)
            .map((x) => x.padStart(20))
            .join(" ")}\n`;
    }

    return display;
}

export function englishList(list: any[], separator = "and"): string {
    return list.length === 0
        ? ""
        : list.length === 1
        ? `${list[0]}`
        : list.length === 2
        ? `${list[0]} ${separator} ${list[1]}`
        : `${list.slice(0, -1).join(", ")}, ${separator} ${list[list.length - 1]}`;
}

export function ordinal(x: number): string {
    if (x < 0) return `-${ordinal(-x)}`;

    if (x === 0 || (x > 10 && x < 20)) return `${x}th`;
    if (x % 10 === 1) return `${x}st`;
    if (x % 10 === 2) return `${x}nd`;
    if (x % 10 === 3) return `${x}rd`;
    return `${x}th`;
}

export function truncate(string: string, length: number): string {
    return string.length > length ? `${string.slice(0, length - 3)}...` : string;
}

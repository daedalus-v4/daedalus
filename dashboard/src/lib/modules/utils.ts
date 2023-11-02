import { parseMessage, type FEIEmbed, type FEMessageData, type IField, type MessageData } from "shared";

export function defaults<T extends object>(inputs: Partial<T> | undefined | null, object: T): T {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Object.fromEntries(Object.entries(object).map(([k, v]) => [k, (inputs as any)?.[k] ?? v])) as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function nometa(x: any): any {
    if (x === undefined || x === null) return x;
    if (typeof x !== "object") return x;
    if (Array.isArray(x)) return x.map(nometa);

    return Object.fromEntries(
        Object.entries(x)
            .filter(([k]) => k !== "_meta")
            .map(([k, v]) => [k, nometa(v)]),
    );
}

export const defaultMessage: MessageData = { content: "", embeds: [], parsed: { content: [], embeds: [] } };

export const defaultEmbed = (): FEIEmbed => ({
    author: { iconURL: "", name: "", url: "" },
    color: "#009688",
    colorMode: "fixed",
    description: "",
    fields: [],
    footer: { iconURL: "", text: "" },
    image: { url: "" },
    thumbnail: { url: "" },
    title: "",
    url: "",
    showTimestamp: false,
    _meta: {},
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const defaultField = (): IField & { _meta?: any } => ({
    name: "",
    value: "",
    inline: false,
    _meta: {},
});

export function b2fMessage(message: MessageData): FEMessageData {
    return {
        content: message.content,
        embeds: message.embeds.map((e) => ({
            ...e,
            fields: e.fields.map((field) => ({ ...field, _meta: {} })),
            color: `#${e.color.toString(16).padStart(6, "0")}`,
            _meta: {},
        })),
    };
}

export function recursiveTrim<T>(object: T): T {
    if (typeof object === "string") return object.trim() as T;
    if (!object) return object;
    if (typeof object !== "object") return object;
    if (Array.isArray(object)) return object.map((x) => recursiveTrim(x)) as T;
    return Object.fromEntries(Object.entries(object).map(([k, v]) => [k, recursiveTrim(v)])) as T;
}

export function f2bMessage(message: FEMessageData): MessageData {
    if (message.embeds.some((e) => !e.color.match(/^#[0-9a-f]{6}$/i))) throw "Invalid format for embed color: expected # followed by 6 hexadecimal digits.";

    const data: Omit<MessageData, "parsed"> = {
        content: message.content.trim(),
        embeds: message.embeds.map((e) => ({ ...recursiveTrim(e), color: parseInt(e.color.slice(1), 16) })),
    };

    return { ...data, parsed: parseMessage(data) };
}

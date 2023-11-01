import type { IEmbed, MessageData } from "shared";

export function defaults<T extends object>(inputs: Partial<T> | undefined | null, object: T): T {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Object.fromEntries(Object.entries(object).map(([k, v]) => [k, (inputs as any)?.[k] ?? v])) as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function nometa(x: any): any {
    if (typeof x !== "object") return x;
    if (Array.isArray(x)) return x.map(nometa);
    if ("_meta" in x) delete x._meta;
    return x;
}

export const defaultMessage: MessageData = { content: "", embeds: [] };

export const defaultEmbed = (): IEmbed & { _meta?: unknown } => ({
    author: { iconURL: "", name: "", url: "" },
    color: 0,
    colorMode: "fixed",
    description: "",
    fields: [],
    footer: { iconURL: "", text: "" },
    image: { url: "" },
    thumbnail: { url: "" },
    title: "",
    url: "",
    _meta: {},
});

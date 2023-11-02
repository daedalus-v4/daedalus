import type { MessageCreateOptions } from "discord.js";
import { db } from "../db.js";
import customMessageFunctions, { CustomMessageContext, FN, Value, flatFMap } from "./custom-message-functions.js";
import { CustomMessageComponent, CustomMessageText, MessageData } from "./types.js";

const escapeMap: Record<string, string> = { r: "\r", t: "\t", f: "\f", n: "\n", "\\": "\\", "'": "'", '"': '"' };

class CharArray {
    public array: string[];
    public index = 0;

    constructor(input: string) {
        this.array = input.split("");
    }

    public empty() {
        return this.index >= this.array.length;
    }

    public peek() {
        return this.array[this.index];
    }

    public pop() {
        return this.array[this.index++];
    }
}

function purgeWS(chars: CharArray) {
    while (!chars.empty() && /\s/.test(chars.peek())) chars.pop();
}

function parseCustomMessageComponent(chars: CharArray, depth: number = 0): CustomMessageComponent {
    if (depth >= 10) throw "Parsing error: message data is too deep";

    purgeWS(chars);
    if (chars.empty()) throw "Parsing error: unclosed {";

    let fname = "";
    while (!chars.empty() && /[^\s}]/.test(chars.peek())) fname += chars.pop();

    const fn = flatFMap[fname];
    if (!fn) throw `Unrecognized function: ${fname}.`;

    const output: CustomMessageComponent = [fname];

    while (true) {
        purgeWS(chars);
        if (chars.empty()) throw "Parsing error: unclosed {";

        const char = chars.pop();

        if (char === "{") output.push(parseCustomMessageComponent(chars, depth + 1));
        else if (char === "}") {
            if (typeof fn.arity === "number") {
                if (output.length - 1 !== fn.arity) throw `Function ${fname} expected ${fn.arity} argument${fn.arity === 1 ? "" : "s"}.`;
            } else {
                if (output.length - 1 < fn.arity[0]) throw `Function ${fname} expected at least ${fn.arity[0]} argument${fn.arity[0] === 1 ? "" : "s"}.`;
                if (output.length - 1 > fn.arity[1]) throw `Function ${fname} expected at most ${fn.arity[1]} argument${fn.arity[1] === 1 ? "" : "s"}.`;
            }

            return output;
        } else if (char === "'" || char === '"') {
            let string = "";
            let closed = false;

            while (!chars.empty()) {
                const next = chars.pop();

                if (next === char) {
                    closed = true;
                    break;
                } else if (next === "\\") {
                    if (chars.empty()) break;

                    const after = chars.pop();
                    if (after in escapeMap) string += escapeMap[after];
                    else string += `\\${after}`;
                } else string += next;
            }

            if (!closed) throw `Parsing error: unclosed ${char}`;

            output.push(string);
        } else if (/[0-9]/.test(char) || ((char === "-" || char === ".") && !chars.empty() && /[0-9]/.test(chars.peek()))) {
            let raw = char;
            let decimal = char === ".";

            while (!chars.empty()) {
                const next = chars.peek();

                if ((!decimal && next === ".") || /[0-9]/.test(next)) raw += chars.pop();
                else break;
            }

            if (raw.charAt(raw.length - 1) === ".") raw += "0";
            output.push(parseFloat(raw));
        } else throw `Parsing error: expected a block, string, or number, but instead got ${chars.array.slice(chars.index, chars.index + 10).join("")}...`;
    }
}

export function parseCustomMessageString(input: string): CustomMessageText {
    const chars = new CharArray(input);
    const output: CustomMessageText = [];

    let string = "";

    while (!chars.empty()) {
        const char = chars.pop();

        if (char === "\\") {
            if (chars.peek() === "\\" || chars.peek() === "{") string += chars.pop();
            else string += "\\";
        } else if (char === "{") {
            if (string) output.push(string);
            output.push(parseCustomMessageComponent(chars));
            string = "";
        } else string += char;
    }

    if (string) output.push(string);

    return output;
}

export function parseMessage(input: Omit<MessageData, "parsed">): MessageData["parsed"] {
    const p = parseCustomMessageString;

    return {
        content: p(input.content),
        embeds: input.embeds.map((e) => ({
            colorMode: e.colorMode,
            color: e.color,
            author: { name: p(e.author.name), iconURL: p(e.author.iconURL), url: p(e.author.url) },
            title: p(e.title),
            description: p(e.description),
            url: p(e.url),
            fields: e.fields.map((f) => ({ name: p(f.name), value: p(f.value), inline: f.inline })),
            image: { url: p(e.image.url) },
            thumbnail: { url: p(e.thumbnail.url) },
            footer: { text: p(e.footer.text), iconURL: p(e.footer.iconURL) },
            showTimestamp: e.showTimestamp,
        })),
    };
}

function formatCustomMessageComponent([fname, ...args]: CustomMessageComponent, ctx: CustomMessageContext): Value {
    let fn: FN | undefined;

    if (ctx.member) fn ??= customMessageFunctions.member[fname];
    if (ctx.user) fn ??= customMessageFunctions.user[fname];
    if (ctx.role) fn ??= customMessageFunctions.role[fname];
    if (ctx.guild) fn ??= customMessageFunctions.guild[fname];
    fn ??= customMessageFunctions.global[fname];

    if (!fn) throw `Unrecognized function: ${fname}.`;

    if (typeof fn.arity === "number") {
        if (args.length !== fn.arity) throw `Function ${fname} expected ${fn.arity} argument${fn.arity === 1 ? "" : "s"}.`;
    } else {
        if (args.length < fn.arity[0]) throw `Function ${fname} expected at least ${fn.arity[0]} argument${fn.arity[0] === 1 ? "" : "s"}.`;
        if (args.length > fn.arity[1]) throw `Function ${fname} expected at most ${fn.arity[1]} argument${fn.arity[1] === 1 ? "" : "s"}.`;
    }

    return fn.apply(ctx, ...args.map((x) => (typeof x === "string" || typeof x === "number" ? x : formatCustomMessageComponent(x, ctx))));
}

function formatCustomMessageString(input: CustomMessageText, ctx: CustomMessageContext): string {
    return input.map((x) => (typeof x === "string" ? x : `${formatCustomMessageComponent(x, ctx)}`)).join("");
}

export async function formatMessage(input: MessageData["parsed"], ctx: CustomMessageContext): Promise<MessageCreateOptions> {
    ctx.user ??= ctx.member?.user;
    ctx.guild ??= ctx.member?.guild ?? ctx.role?.guild;

    await ctx.member?.fetch();
    await ctx.user?.fetch();
    await ctx.guild?.fetch();
    await ctx.guild?.members.fetch();

    const u = (x: CustomMessageText) => formatCustomMessageString(x, ctx);

    return {
        content: u(input.content),
        embeds: await Promise.all(
            input.embeds.map(async (e) => ({
                color:
                    (e.colorMode === "fixed"
                        ? e.color
                        : e.colorMode === "member"
                        ? ctx.member?.displayColor
                        : e.colorMode === "user"
                        ? ctx.user?.accentColor
                        : e.colorMode === "guild"
                        ? ctx.guild && (await db.guildSettings.findOne({ guild: ctx.guild.id }))?.embedColor
                        : undefined) ?? e.color,
                author: { name: u(e.author.name), iconURL: u(e.author.iconURL), url: u(e.author.url) },
                title: u(e.title),
                description: u(e.description),
                url: u(e.url),
                fields: e.fields.map((f) => ({ name: u(f.name), value: u(f.value), inline: f.inline })),
                image: { url: u(e.image.url) },
                thumbnail: { url: u(e.thumbnail.url) },
                footer: { text: u(e.footer.text), iconURL: u(e.footer.iconURL) },
                timestamp: e.showTimestamp ? undefined : new Date().toISOString(),
            })),
        ),
    };
}

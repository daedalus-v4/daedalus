import type { MessageCreateOptions } from "discord.js";
import { getColor } from "./db.js";
import customMessageFunctions, { CustomMessageContext, FN, Value } from "./src/custom-message-functions.js";
import { CustomMessageComponent, CustomMessageText, MessageData } from "./src/types.js";

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

export async function formatMessage(input: MessageData["parsed"], ctx: CustomMessageContext, allowPings: boolean = false): Promise<MessageCreateOptions> {
    ctx.user ??= ctx.member?.user;
    ctx.guild ??= ctx.member?.guild ?? ctx.role?.guild;

    await ctx.member?.fetch();
    await ctx.user?.fetch();
    await ctx.guild?.fetch();
    await ctx.guild?.members.fetch();

    const u = (x: CustomMessageText) => formatCustomMessageString(x, ctx);

    return {
        content: u(input.content),
        allowedMentions: allowPings ? { parse: ["everyone", "roles", "users"] } : undefined,
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
                        ? ctx.guild && (await getColor(ctx.guild, true))
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

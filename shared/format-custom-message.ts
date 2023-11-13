import type { MessageCreateOptions } from "discord.js";
import { getColor } from "./db.js";
import customMessageFunctions, { CustomMessageContext, FN, Value } from "./src/custom-message-functions.js";
import { CustomMessageComponent, CustomMessageText, MessageData } from "./src/types.js";

async function formatCustomMessageComponent([fname, ...args]: CustomMessageComponent, ctx: CustomMessageContext): Promise<Value> {
    let fn: FN | undefined;

    if (ctx.member) fn ??= customMessageFunctions.member[fname];
    if (ctx.user) fn ??= customMessageFunctions.user[fname];
    if (ctx.role) fn ??= customMessageFunctions.role[fname];
    if (ctx.guild) fn ??= customMessageFunctions.guild[fname];
    fn ??= customMessageFunctions.global[fname];

    if (!fn) throw `Unrecognized function: ${fname}.`;

    for (const key of fn.fetch ?? []) {
        if (key === "members") await ctx.guild?.members.fetch();
    }

    if (typeof fn.arity === "number") {
        if (args.length !== fn.arity) throw `Function ${fname} expected ${fn.arity} argument${fn.arity === 1 ? "" : "s"}.`;
    } else {
        if (args.length < fn.arity[0]) throw `Function ${fname} expected at least ${fn.arity[0]} argument${fn.arity[0] === 1 ? "" : "s"}.`;
        if (args.length > fn.arity[1]) throw `Function ${fname} expected at most ${fn.arity[1]} argument${fn.arity[1] === 1 ? "" : "s"}.`;
    }

    return fn.apply(
        ctx,
        ...(await Promise.all(args.map(async (x) => (typeof x === "string" || typeof x === "number" ? x : await formatCustomMessageComponent(x, ctx))))),
    );
}

export async function formatCustomMessageString(input: CustomMessageText, ctx: CustomMessageContext): Promise<string> {
    return (await Promise.all(input.map(async (x) => (typeof x === "string" ? x : `${await formatCustomMessageComponent(x, ctx)}`)))).join("");
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
        content: await u(input.content),
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
                author: { name: await u(e.author.name), iconURL: await u(e.author.iconURL), url: await u(e.author.url) },
                title: await u(e.title),
                description: await u(e.description),
                url: await u(e.url),
                fields: await Promise.all(e.fields.map(async (f) => ({ name: await u(f.name), value: await u(f.value), inline: f.inline }))),
                image: { url: await u(e.image.url) },
                thumbnail: { url: await u(e.thumbnail.url) },
                footer: { text: await u(e.footer.text), iconURL: await u(e.footer.iconURL) },
                timestamp: e.showTimestamp ? undefined : new Date().toISOString(),
            })),
        ),
    };
}

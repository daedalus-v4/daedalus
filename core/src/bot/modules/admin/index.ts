import Argentium from "argentium";
import { BaseMessageOptions } from "discord.js";
import db from "../../../lib/db.js";
import { template } from "../../lib/format.js";
import { defer } from "../../lib/hooks.js";

export default (app: Argentium) =>
    app.commands((x) =>
        x
            .beforeAll(async ({ _ }) => {
                if (_.user.id === Bun.env.OWNER) return;
                if ((await db.admins.countDocuments({ user: _.user.id })) === 0) return template.error("You are not a Daedalus admin.");
            })
            .slash((x) =>
                x
                    .key("admin eval")
                    .description("evaluate JS code")
                    .stringOption("code", "what to evaluate", { required: true })
                    .fn(defer(true))
                    .fn(async ({ _, code }): Promise<string | BaseMessageOptions> => {
                        const result = await eval(`(async function(){${code}})()`);

                        if (result === undefined || result === null) return { content: `\`\`\`js\n${result}\n\`\`\`` };

                        const output = JSON.stringify(result, undefined, 4);
                        const formatted = `\`\`\`json\n${output}\n\`\`\``;

                        if (formatted.length <= 2000) return { content: formatted };
                        else if (formatted.length <= 4096) return template.success(formatted);
                        else return { files: [{ name: "result.json", attachment: Buffer.from(output, "utf-8") }] };
                    }),
            ),
    );

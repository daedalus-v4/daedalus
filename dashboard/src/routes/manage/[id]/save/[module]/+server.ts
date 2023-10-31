import collections from "../../collections.js";
import type { RequestHandler } from "./$types.js";
import schemas from "./schemas.js";

export const POST: RequestHandler = async ({ params: { id, module }, request }) => {
    try {
        if (!(module in schemas)) throw "Missing schema (this is our fault).";
        if (!(module in collections())) throw "Missing database collection (this is our fault).";

        const data = schemas[module as keyof typeof schemas].parse(await request.json());
        await collections()[module as keyof ReturnType<typeof collections>].updateOne({ guild: id }, { $set: data }, { upsert: true });

        return new Response();
    } catch (error) {
        return new Response(`${error}`, { status: 400 });
    }
};

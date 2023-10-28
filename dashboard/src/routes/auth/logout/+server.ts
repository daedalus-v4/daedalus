import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = ({ url }) => {
    const headers = new Headers({ Location: url.searchParams.get("redirect") ?? "/" });

    headers.append("Set-Cookie", "discord_access_token=deleted; path=/; Max-Age=-1");
    headers.append("Set-Cookie", "discord_refresh_token=deleted; path=/; Max-Age=-1");

    return new Response(null, { headers, status: 302 });
};

export default async function () {
    const request = await fetch("https://cdn.jsdelivr.net/npm/@emoji-mart/data");
    const global = await request.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reverseMap: Record<string, any> = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const [key, value] of Object.entries(global.emojis) as any) reverseMap[value.skins[0]?.native] = key;

    return { global, reverseMap };
}

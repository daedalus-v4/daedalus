const timescales = [
    [1, 86400000],
    [3, 3600000],
    [6, 60000],
    [9, 1000],
];

export function parseDuration(string: string, allow_infinity = true) {
    if (string === "forever" || string === "-") {
        if (allow_infinity) return Infinity;
        else throw "Enter a non-infinite time.";
    }

    const match = string.match(/^(\d+\s*d(ays?)?\s*)?(\d+\s*h((ou)?rs?)?\s*)?(\d+\s*m(in(ute)?s?)?\s*)?(\d+\s*s(ec(ond)?s?)?\s*)?$/);

    if (!match) throw "Invalid format for date (e.g. 20h, 3 days 12 hours, forever).";

    let duration = 0;

    for (const [index, scale] of timescales) {
        const submatch = match[index]?.match(/\d+/);
        if (submatch) duration += parseInt(submatch[0]) * scale;
    }

    return duration;
}

export function parseMessageURL(link: string): [string, string, string] {
    const match = link.match(/^https:\/\/(.+?\.)?discord(app)?\.com\/channels\/(\d{17,20})\/(\d{17,20})\/(\d{17,20})$/);

    if (!match) throw `${link} is not a valid message URL.`;

    return [match[3], match[4], match[5]];
}

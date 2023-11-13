export function parseMessageURL(link: string): [string, string, string] {
    const match = link.match(/^https:\/\/(.+?\.)?discord(app)?\.com\/channels\/(\d{17,20})\/(\d{17,20})\/(\d{17,20})$/);

    if (!match) throw `${link} is not a valid message URL.`;

    return [match[3], match[4], match[5]];
}

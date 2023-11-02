import type { TFChannel, TFRole } from "shared";

export function fuzzy(string: string, query: string | undefined): boolean {
    if (!query) return true;

    const lower = query.toLowerCase();
    string = string.toLowerCase();
    let i = 0;
    for (const char of lower) {
        if ((i = string.indexOf(char, i)) === -1) return false;
        i++;
    }
    return true;
}

export function sortRoles(input: string[], roles: TFRole[]) {
    const indexes = Object.fromEntries(roles.map((x, i) => [x, i]));
    return input.sort((x, y) => indexes[x] - indexes[y]);
}

export const textlike = [0, 2, 5, 10, 11, 12, 13];

export function shouldShowChannel(channel: TFChannel, types: number[] | null | undefined, input: string): boolean {
    return (
        ((types?.includes(channel.type) ?? true) && fuzzy(channel.name, input)) || (channel.children ?? []).some((ch) => shouldShowChannel(ch, types, input))
    );
}

export function without<T>(array: T[], index: number) {
    return [...array.slice(0, index), ...array.slice(index + 1)];
}

export function insert<T>(array: T[], index: number, item: T) {
    return [...array.slice(0, index), item, ...array.slice(index)];
}

export function swap<T>(array: T[], x: number, y: number) {
    if (x === y) return array;
    if (x > y) return swap(array, y, x);
    return [...array.slice(0, x), array[y], ...array.slice(x + 1, y), array[x], ...array.slice(y + 1)];
}

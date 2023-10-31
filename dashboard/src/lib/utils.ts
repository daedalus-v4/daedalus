import type { TFRole } from "shared";

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

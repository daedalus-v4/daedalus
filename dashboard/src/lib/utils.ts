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

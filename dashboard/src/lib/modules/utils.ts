export function defaults<T extends object>(inputs: Partial<T> | undefined | null, object: T): T {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Object.fromEntries(Object.entries(object).map(([k, v]) => [k, (inputs as any)?.[k] ?? v])) as T;
}

import { t } from "elysia";

export const guildSchema = t.Object({
    id: t.String(),
    name: t.String(),
    icon: t.Nullable(t.String()),
    owner: t.Boolean(),
    permissions: t.String(),
    features: t.Array(t.String()),
});

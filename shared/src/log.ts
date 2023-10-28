import pino from "pino";

export const log = pino({ name: "CORE", level: Bun.env.LOG_LEVEL ?? (Bun.env.PRODUCTION ? "info" : "trace") });

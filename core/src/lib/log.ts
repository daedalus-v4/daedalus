import pino from "pino";

export default pino({ name: "CORE", level: Bun.env.LOG_LEVEL ?? (Bun.env.PRODUCTION ? "info" : "trace") });

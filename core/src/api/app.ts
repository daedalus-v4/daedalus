import Elysia from "elysia";
import { log } from "../lib/log.js";

export const app = new Elysia().onBeforeHandle(({ path, request }) => {
    log.info(`${request.method} ${path}`);
});

export type App = typeof app;

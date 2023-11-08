import { log } from "./log.js";

export default function (fn: () => unknown, length: number, uuid: string, invokeImmediately: boolean = true) {
    async function inner() {
        try {
            await fn();
        } catch (error) {
            log.error(error, uuid);
        }
    }

    setTimeout(
        () => {
            if (invokeImmediately) inner();
            setInterval(inner, length);
        },
        length - (Date.now() % length),
    );
}

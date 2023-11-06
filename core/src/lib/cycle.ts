import { log } from "./log.js";

export default function (fn: () => unknown, length: number, uuid: string) {
    async function inner() {
        try {
            await fn();
        } catch (error) {
            log.error(error, uuid);
        }
    }

    setTimeout(
        () => {
            inner();
            setInterval(inner, length);
        },
        length - (Date.now() % length),
    );
}

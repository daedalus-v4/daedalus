// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
interface User {
    id: string;
    username: string;
    global_name: string;
    discriminator: string;
    admin: boolean;
    owner: boolean;
    avatar: string;
}

declare namespace App {
    interface Locals {
        user: User;
        realUser: User | null;
        admin: boolean;
        owner: boolean;
        authorized?: boolean;
    }

    interface PageData {
        user: User;
        realUser: User | null;
        admin: boolean;
        owner: boolean;
    }
}

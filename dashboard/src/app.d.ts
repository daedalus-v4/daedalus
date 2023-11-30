// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
    interface Locals {
        user: {
            id: string;
            username: string;
            global_name: string;
            discriminator: string;
            admin: boolean;
            owner: boolean;
            avatar: string;
        };
        authorized?: boolean;
    }

    interface PageData {
        user: {
            id: string;
            username: string;
            global_name: string;
            discriminator: string;
            admin: boolean;
            owner: boolean;
            avatar: string;
        };
    }
}

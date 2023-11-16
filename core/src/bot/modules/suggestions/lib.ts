import { Colors } from "discord.js";

export const statuses = {
    implement: { name: "Implemented", color: Colors.Blue },
    approve: { name: "Approved", color: Colors.Green },
    consider: { name: "Considered", color: Colors.Yellow },
    deny: { name: "Denied", color: Colors.Red },
} as const;

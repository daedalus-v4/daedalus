import { ModuleData } from "./types.js";

export const modules: ModuleData = {
    logging: {
        name: "Logging",
        icon: "list-ul",
        description: "Log events/changes in your server.",
    },
    welcome: {
        name: "Welcome",
        icon: "door-open",
        description: "Welcome incoming members to the server.",
    },
    "supporter-announcements": {
        name: "Supporter Announcements",
        icon: "bullhorn",
        description: "Announce new boosters and other server supporters by role.",
    },
    xp: {
        name: "XP",
        icon: "ranking-star",
        description: "Server experience system to reward active members.",
        commands: {
            top: {
                name: "Top",
                icon: "arrow-down-wide-short",
                description: "Get top users by XP.",
                ghost: true,
            },
            rank: {
                name: "Rank",
                icon: "medal",
                description: "Get a user's XP and rank.",
                ghost: true,
            },
            xp: {
                name: "Manage XP",
                icon: "ranking-star",
                description: "Manage the server's XP, including importing or fully resetting XP.",
                permissions: ["ManageGuild"],
            },
        },
        default: false,
    },
    "reaction-roles": {
        name: "Reaction Roles",
        icon: "icons",
        description: "Allow users to self-assign roles, including verification roles.",
        selfPermissions: ["ManageRoles"],
    },
    moderation: {
        name: "Moderation",
        icon: "shield-halved",
        description: "Moderation commands for managing users and content.",
        commands: {
            ban: {
                name: "Ban",
                icon: "gavel",
                description: "Ban a user (even if they are not in the server).",
                permissions: ["BanMembers"],
                selfPermissions: ["BanMembers"],
            },
            kick: {
                name: "Kick",
                icon: "user-minus",
                description: "Kick a member from the server.",
                permissions: ["KickMembers"],
                selfPermissions: ["KickMembers"],
            },
            mute: {
                name: "Mute",
                icon: "volume-xmark",
                description: "Mute a user by assigning them a mute role. This only works on non-members if the Sticky Roles module is enabled.",
                permissions: ["ModerateMembers"],
                selfPermissions: ["ManageRoles"],
            },
            timeout: {
                name: "Timeout",
                icon: "hourglass-start",
                description: "Timeout a member or remove their timeout.",
                permissions: ["ModerateMembers"],
                selfPermissions: ["ModerateMembers"],
            },
            warn: {
                name: "Warn",
                icon: "triangle-exclamation",
                description: "DM a warning to a user and log it to their user history.",
                permissions: ["ModerateMembers"],
            },
            unban: {
                name: "Unban",
                icon: "user-gear",
                description: "Unban a user, allowing them to rejoin the server.",
                permissions: ["BanMembers"],
                selfPermissions: ["BanMembers"],
            },
            unmute: {
                name: "Unmute",
                icon: "volume-low",
                description: "Unmute a user by removing their mute role. This only works on non-members if the Sticky Roles module is enabled.",
                permissions: ["ModerateMembers"],
                selfPermissions: ["ManageRoles"],
            },
            massban: {
                name: "Massban",
                icon: "users-rays",
                description: "Ban many users at once.",
                permissions: ["ManageGuild"],
                selfPermissions: ["BanMembers"],
            },
            history: {
                name: "View History",
                icon: "clock-rotate-left",
                description: "View a user's history.",
                ghost: true,
                permissions: ["ModerateMembers"],
            },
            "delete-history": {
                name: "Delete History Entry",
                icon: "delete-left",
                description: "Remove a single history entry.",
                permissions: ["ManageGuild"],
            },
            "clear-history": {
                name: "Clear History",
                icon: "broom",
                description: "Clear a user's history.",
                permissions: ["ManageGuild"],
            },
            slowmode: {
                name: "Slowmode",
                icon: "gauge",
                description: "Set a channel's slowmode.",
                bypass: true,
                permissions: ["ManageChannels"],
                selfPermissions: ["ManageChannels"],
            },
            purge: {
                name: "Purge",
                icon: "trash",
                description: "Purge many messages at once.",
                permissions: ["ManageGuild"],
                selfPermissions: ["ManageMessages"],
            },
            notes: {
                name: "Notes",
                icon: "note-sticky",
                description: "Record mod notes for a user.",
                permissions: ["ModerateMembers"],
            },
        },
    },
    starboard: {
        name: "Starboard",
        icon: "star",
        description: "Feature messages that receive a specified reaction.",
    },
    automod: {
        name: "Automod",
        icon: "eye",
        description: "Automatically scan and filter messages and edits for blocked content.",
        selfPermissions: ["ManageMessages", "ManageRoles", "ModerateMembers", "KickMembers", "BanMembers"],
    },
    "sticky-roles": {
        name: "Sticky Roles",
        icon: "arrow-rotate-right",
        description: "Automatically re-add roles to members when they rejoin the server.",
        selfPermissions: ["ManageRoles"],
        default: false,
    },
    "custom-roles": {
        name: "Custom Roles",
        icon: "eye-dropper",
        description: "Give boosters and other server supporters the ability to create custom roles.",
        commands: {
            role: {
                name: "Custom Role",
                icon: "fill-drip",
                description: "Manage the user's custom role.",
                ghost: true,
                selfPermissions: ["ManageRoles"],
            },
        },
        selfPermissions: ["ManageRoles"],
        default: false,
    },
    "stats-channels": {
        name: "Stats Channels",
        icon: "chart-line",
        description: "Keep track of server stats with automatically updating channels.",
        selfPermissions: ["ManageChannels"],
    },
    autoresponder: {
        name: "Autoresponder",
        icon: "bolt",
        description: "Automatically respond to certain messages",
    },
    modmail: {
        name: "Modmail",
        icon: "envelope",
        description: "Allow users to contact staff via direct-messaging the bot.",
        commands: {
            modmail: {
                name: "Modmail",
                icon: "envelope",
                description: "Modmail operation commands.",
                permissions: ["ManageMessages"],
            },
        },
        selfPermissions: ["CreatePublicThreads", "ManageThreads", "ManageChannels"],
        default: false,
    },
    tickets: {
        name: "Tickets",
        icon: "ticket",
        description: "Allow users to contact staff by creating new private channels at the press of a button.",
        commands: {
            ticket: {
                name: "Ticket",
                icon: "ticket",
                description: "Manage tickets.",
            },
        },
        selfPermissions: ["ManageChannels"],
    },
    nukeguard: {
        name: "Nukeguard",
        icon: "lock",
        description: "Anti-nuke features to guard against rogue or compromised mods/admins.",
        selfPermissions: ["BanMembers"],
    },
    suggestions: {
        name: "Suggestions",
        icon: "comment",
        description: "Allow members to give feedback on the server.",
        default: false,
        commands: {
            suggest: {
                name: "Suggest",
                icon: "comment",
                description: "Make a suggestion.",
                ghost: true,
            },
            suggestion: {
                name: "Manage Suggestions",
                icon: "comments",
                description: "Answer suggestions and view anonymously submitted suggestions' authors.",
                permissions: ["ManageGuild"],
            },
        },
    },
    "co-op": {
        name: "Co-op (Genshin Impact)",
        icon: "handshake",
        description: "Co-op group finding system for Genshin Impact.",
    },
    feeds: {
        name: "Feeds",
        icon: "rss",
        description: "Subscribe to live updates from various other websites.",
        commands: {
            feed: {
                name: "Feed",
                icon: "rss",
                description: "Set up or manage feeds.",
                permissions: ["ManageGuild"],
            },
        },
    },
    count: {
        name: "Counting Channels",
        icon: "arrow-up-9-1",
        description: "Counting channels.",
        commands: {
            scoreboard: {
                name: "Scoreboard",
                icon: "ranking-star",
                description: "View the counting leaderboard.",
                ghost: true,
            },
        },
        selfPermissions: ["ManageMessages"],
    },
    giveaways: {
        name: "Giveaway",
        icon: "gift",
        description: "Set up giveaways for server members.",
        commands: {
            giveaway: {
                name: "Manage Giveaways",
                icon: "gift",
                description: "Manage giveaways.",
                permissions: ["ManageGuild"],
            },
        },
    },
    reminders: {
        name: "Reminders",
        icon: "calendar-day",
        description: "Set up reminders to appear in your DMs.",
        commands: {
            reminder: {
                name: "Reminder",
                icon: "calendar-day",
                description: "Set, list, or manage your reminders.",
                ghost: true,
            },
        },
    },
    reports: {
        name: "Reports",
        icon: "flag",
        description: "Allow members to report users and messages to moderators.",
        commands: {
            "Report User": {
                name: "Report User",
                icon: "flag",
                description: "Report a user (user context menu command).",
                ghost: true,
            },
            "Flag Message": {
                name: "Flag Message",
                icon: "flag",
                description: "Flag a message (message context menu command).",
                ghost: true,
            },
            report: {
                name: "Report User",
                icon: "flag",
                description: "Report a user (slash command).",
                ghost: true,
            },
            flag: {
                name: "Flag Message",
                icon: "flag",
                description: "Flag a message (slash command).",
                ghost: true,
            },
        },
        default: false,
    },
    polls: {
        name: "Polls",
        icon: "square-poll-vertical",
        description: "Yes/no and multiple-choice polls.",
        commands: {
            polls: {
                name: "Polls",
                icon: "square-poll-vertical",
                description: "Create and manage polls.",
                permissions: ["ManageGuild"],
            },
        },
    },
    highlights: {
        name: "Highlights",
        icon: "bell",
        description: "Receive DM notifications for messages matching your filters.",
        commands: {
            highlights: {
                name: "Highlight",
                icon: "bell",
                description: "Manage your highlights.",
                ghost: true,
            },
        },
    },
    utility: {
        name: "Utility",
        icon: "toolbox",
        description: "Utility commands for server management and other purposes.",
        commands: {
            "emoji-roles": {
                name: "Emoji Roles",
                icon: "filter-circle-dollar",
                description: "Control which roles can use which server emoji.",
                permissions: ["ManageGuildExpressions"],
                selfPermissions: ["ManageGuildExpressions"],
            },
            help: {
                name: "Help",
                icon: "circle-question",
                description: "Get help for the bot.",
                ghost: true,
            },
            info: {
                name: "Info",
                icon: "circle-info",
                description: "Get info for a user, role, channel, server, or invite.",
                ghost: true,
            },
            avatar: {
                name: "Avatar",
                icon: "id-badge",
                description: "View a user's avatar.",
                ghost: true,
            },
            roles: {
                name: "Roles",
                icon: "user-gear",
                description: "Alter a user's roles.",
                permissions: ["ManageRoles"],
                selfPermissions: ["ManageRoles"],
            },
            format: {
                name: "Format",
                icon: "text-slash",
                description: "Convert a Discord message element into its source text.",
                ghost: true,
            },
            say: {
                name: "Say",
                icon: "message",
                description: "Say a message.",
                permissions: ["ManageGuild"],
            },
            code: {
                name: "Code",
                icon: "gift",
                description: "Display a Genshin Impact gift code.",
                ghost: true,
            },
            qr: {
                name: "QR",
                icon: "qrcode",
                description: "Convert any text into a QR code.",
                ghost: true,
            },
            tex: {
                name: "Render LaTeX",
                icon: "image",
                description: "Render LaTeX to a PNG file.",
                ghost: true,
            },
            convert: {
                name: "Convert Units",
                icon: "money-bill-transfer",
                description: "Convert between common units or between currencies.",
                ghost: true,
            },
            snowflake: {
                name: "Snowflake",
                icon: "snowflake",
                description: "Deconstruct a Discord snowflake (ID).",
                ghost: true,
            },
            "role-accessibility": {
                name: "Role Accessibility",
                icon: "eye-low-vision",
                description: "Check if role colors' contrasts meet accessibility standards.",
                ghost: true,
            },
            "Extract IDs": {
                name: "Extract IDs",
                icon: "id-card",
                description: "Extract all IDs from a message for easier copying.",
                ghost: true,
            },
        },
    },
    "sticky-messages": {
        name: "Sticky Messages",
        icon: "sticky-note",
        description: "Set messages to stick to the bottom of a channel.",
        commands: {
            stick: {
                name: "Stick",
                icon: "tag",
                description: "Set the channel's sticky message.",
                permissions: ["ManageChannels"],
            },
            unstick: {
                name: "Unstick",
                icon: "eraser",
                description: "Remove the channel's sticky message.",
                permissions: ["ManageChannels"],
            },
            sticklist: {
                name: "List Sticky Messages",
                icon: "tags",
                description: "List the server's sticky messages.",
                permissions: ["ManageChannels"],
            },
        },
    },
    fun: {
        name: "Fun",
        icon: "wand-magic-sparkles",
        description: "Fun commands that are mostly pointless/unimportant.",
        commands: {
            random: {
                name: "Random",
                icon: "shuffle",
                description: "Random-related functions.",
                ghost: true,
            },
        },
    },
};

export const commandMap = Object.fromEntries(
    Object.entries(modules).flatMap(([mid, module]) => Object.entries(module.commands ?? {}).map(([k, v]) => [k, { ...v, module: mid }])),
);

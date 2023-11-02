export const logCategories: Record<string, string> = {
    server: "Server Change Logs",
    mod: "Mod Action Logs",
    join_leave: "Join/Leave Logs",
    member: "Member Change Logs",
    invite: "Invite Logs",
    message: "Message Logs",
    reaction: "Reaction Logs",
    voice: "Voice Logs",
    debug: "Debug Logs",
};

export const logEvents: Record<string, { name: string; category: string }> = {
    guildUpdate: { name: "Server Updated", category: "server" },
    channelCreate: { name: "Channel Created", category: "server" },
    channelDelete: { name: "Channel Deleted", category: "server" },
    channelUpdate: { name: "Channel Updated", category: "server" },
    emojiCreate: { name: "Emoji Created", category: "server" },
    emojiDelete: { name: "Emoji Deleted", category: "server" },
    emojiUpdate: { name: "Emoji Updated", category: "server" },
    guildScheduledEventCreate: { name: "Event Created", category: "server" },
    guildScheduledEventDelete: { name: "Event Deleted", category: "server" },
    guildScheduledEventUpdate: { name: "Event Updated", category: "server" },
    roleCreate: { name: "Role Created", category: "server" },
    roleDelete: { name: "Role Deleted", category: "server" },
    roleUpdate: { name: "Role Updated", category: "server" },
    stickerCreate: { name: "Sticker Created", category: "server" },
    stickerDelete: { name: "Sticker Deleted", category: "server" },
    stickerUpdate: { name: "Sticker Updated", category: "server" },
    threadCreate: { name: "Thread Created", category: "server" },
    threadDelete: { name: "Thread Deleted", category: "server" },
    threadUpdate: { name: "Thread Updated", category: "server" },
    guildBanAdd: { name: "Ban", category: "mod" },
    guildBanRemove: { name: "Unban", category: "mod" },
    guildMemberKick: { name: "Kick", category: "mod" },
    guildMemberTimeout: { name: "Timeout", category: "mod" },
    guildMemberTimeoutRemove: { name: "Timeout Removed", category: "mod" },
    guildMemberMute: { name: "Muted", category: "mod" },
    guildMemberUnmute: { name: "Unmuted", category: "mod" },
    guildMemberAdd: { name: "Member Joined", category: "join_leave" },
    guildMemberRemove: { name: "Member Left", category: "join_leave" },
    guildMemberUpdateRoles: { name: "Member Role Update", category: "member" },
    guildMemberUpdateName: { name: "Member Name Update", category: "member" },
    guildMemberUpdateAvatar: { name: "Member Avatar Update", category: "member" },
    interactionCreate: { name: "Command Invoked", category: "debug" },
    botError: { name: "Bot Error", category: "debug" },
    inviteCreate: { name: "Invite Created", category: "invite" },
    inviteDelete: { name: "Invite Deleted", category: "invite" },
    messageDelete: { name: "Message Deleted", category: "message" },
    messageDeleteBulk: { name: "Messages Purged", category: "message" },
    messageUpdate: { name: "Message Edited", category: "message" },
    messageReactionAdd: { name: "Reaction Added", category: "reaction" },
    messageReactionRemove: { name: "Reaction Removed", category: "reaction" },
    voiceJoin: { name: "Voice Join", category: "voice" },
    voiceMove: { name: "Voice Move", category: "voice" },
    voiceLeave: { name: "Voice Leave", category: "voice" },
    voiceStateUpdate: { name: "Voice State Change", category: "voice" },
};

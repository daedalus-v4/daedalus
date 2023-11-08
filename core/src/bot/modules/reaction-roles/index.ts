import Argentium from "argentium";
import { Events } from "discord.js";
import handleReaction from "./handle-reaction.js";

export default (app: Argentium) =>
    app.on(Events.MessageReactionAdd, (x, y) => handleReaction(x, y, true)).on(Events.MessageReactionRemove, (x, y) => handleReaction(x, y, false));

import { Canvas, CanvasRenderingContext2D, loadImage } from "canvas";
import { config } from "dotenv";
import fastify from "fastify";

process.on("uncaughtException", console.error);
config();

function levelToXp(level: number): number {
    return (5 / 3) * level ** 3 + (135 / 6) * level ** 2 + (455 * level) / 6;
}

function xpToLevel(xp: number, floor = true): number {
    if (xp === 0) return 0;

    const u = Math.cbrt(Math.sqrt(11664 * xp ** 2 + 874800 * xp - 621075) - 108 * xp - 4050);
    const level = -u / 2 / Math.cbrt(45) - (61 * Math.cbrt(5 / 3)) / 2 / u - 9 / 2;
    return floor ? Math.floor(level) : level;
}

async function drawLevelup(query: any) {
    const { before, after, url, avatar } = JSON.parse(query.data) as { before: number; after: number; url: string | null; avatar: string };

    const canvas = new Canvas(1000, 200);
    const img = canvas.getContext("2d");

    // draw background image
    try {
        const background = url ? await loadImage(url).catch(null) : null;
        img.drawImage(background ?? (await loadImage("./assets/xp-levelup-announcement-background.png")), 0, 0, 1000, 200);
    } catch {
        // ignore it if painting the image fails
    }

    let amount: number = before;

    // draw the levels
    for (const x of [400, 850]) {
        // draw hexagon textbox
        img.fillStyle = "#000a";
        img.beginPath();
        img.moveTo(x, 25);
        img.lineTo(x + 65, 62.5);
        img.lineTo(x + 65, 137.5);
        img.lineTo(x, 175);
        img.lineTo(x - 65, 137.5);
        img.lineTo(x - 65, 62.5);
        img.closePath();
        img.fill();

        // write level
        const string = `${amount}`;
        const height = constrainText(img, "sans-serif", string, 120, 60);
        img.fillStyle = "#eee";
        img.fillText(string, x - img.measureText(string).width / 2, 100 + height / 3, 120);

        // switch amount to after level-up for the next component
        amount = after;
    }

    // draw arrow
    img.fillStyle = "#000a";
    img.beginPath();
    img.moveTo(550, 75);
    img.lineTo(650, 75);
    img.lineTo(650, 50);
    img.lineTo(700, 100);
    img.lineTo(650, 150);
    img.lineTo(650, 125);
    img.lineTo(550, 125);
    img.closePath();
    img.fill();

    // variables for drawing profile picture
    const x = 150,
        y = 100,
        r = 75;

    // draw top-left corner triangle behind profile picture
    img.fillStyle = "#fff5";
    img.beginPath();
    img.moveTo(0, 0);
    img.lineTo(400, 0);
    img.lineTo(0, 240);
    img.closePath();
    img.fill();

    // draw border / large circle
    img.fillStyle = "#888";
    img.beginPath();
    img.arc(x, y, r + 3, 0, Math.PI * 2, true);
    img.fill();

    // draw avatar background / small circle
    img.fillStyle = "#eee";
    img.beginPath();
    img.arc(x, y, r, 0, Math.PI * 2, true);
    img.fill();

    // draw avatar, clipped to a circle
    img.beginPath();
    img.arc(x, y, r, 0, Math.PI * 2, true);
    img.closePath();
    img.clip();
    img.drawImage(await loadImage(avatar), x - r, y - r, r * 2, r * 2);

    return canvas.toBuffer();
}

async function drawRankcard(query: any) {
    const { name, xp, rank, url, avatar } = JSON.parse(query.data) as {
        name: string;
        xp: { text: number; voice: number };
        rank: { text: number; voice: number };
        url: string | null;
        avatar: string;
    };

    const canvas = new Canvas(1000, 400);
    const img = canvas.getContext("2d");

    // draw background image
    try {
        const background = url ? await loadImage(url).catch(null) : null;
        img.drawImage(background ?? (await loadImage("./assets/xp-rank-card-background.png")), 0, 0, 1000, 400);
    } catch {
        // ignore it if painting the image fails
    }

    // draw name textbox
    img.fillStyle = "#0009";
    roundRect(img, 350, 25, 600, 100, 10);
    img.fill();

    // write name
    const height = constrainText(img, "sans-serif", name, 550, 60);
    img.fillStyle = "#eee";
    img.fillText(name, 640 - img.measureText(name).width / 2, 75 + height / 3, 550);

    // draw stats textbox
    img.fillStyle = "#0007";
    roundRect(img, 350, 150, 600, 225, 10);
    img.fill();

    // draw stats rows
    ["text", "voice"].forEach((key, index) => {
        const level = xpToLevel(xp[key]);
        const lower = Math.floor(levelToXp(level));
        const upper = Math.floor(levelToXp(level + 1));
        const progress = Math.floor(xp[key]) - lower;
        const goal = upper - lower;

        const y = index * 87;

        // draw progress bar background
        img.fillStyle = "#bbb";
        roundRect(img, 500, 201 + y, 400, 36, 10);
        img.fill();

        const span = 396 * (progress / goal);

        const string = `${progress} / ${goal}`;
        img.font = "30px sans-serif";

        const { width } = img.measureText(string);

        // write progress text
        img.fillStyle = "#444";
        img.fillText(string, 700 - width / 2, 229 + y);

        // begin the bar fill
        img.save();

        // draw progress bar fill
        img.beginPath();
        roundRect(img, 502, 203 + y, Math.max(span, 20), 32, 10);
        img.fillStyle = "#444";
        img.fill();

        // clip text and re-draw progress text over bar
        img.clip();
        img.fillStyle = "#bbb";
        img.fillText(string, 700 - width / 2, 229 + y);

        // end the bar fill
        img.restore();

        // write level
        img.fillStyle = "#bbb";
        img.fillText(`ʟᴠʟ ${Math.floor(level)}`, 375, 229 + y);

        // write rank
        img.font = "16px sans-serif";
        img.fillText(`${key} rank: #${rank[key]}`, 505, 190 + y);

        // write total XP
        const total = `total: ${Math.floor(xp[key])}`;
        img.fillText(total, 895 - img.measureText(total).width, 190 + y);
    });

    // variables for drawing profile picture
    const x = 150,
        y = 150,
        r = 100;

    // draw top-left corner triangle behind profile picture
    img.fillStyle = "#fff5";
    img.beginPath();
    img.moveTo(0, 0);
    img.lineTo(400, 0);
    img.lineTo(0, 240);
    img.closePath();
    img.fill();

    // draw border / large circle
    img.fillStyle = "#888";
    img.beginPath();
    img.arc(x, y, r + 3, 0, Math.PI * 2, true);
    img.fill();

    // draw avatar background / small circle
    img.fillStyle = "#eee";
    img.beginPath();
    img.arc(x, y, r, 0, Math.PI * 2, true);
    img.fill();

    // draw avatar, clipped to a circle
    img.beginPath();
    img.arc(x, y, r, 0, Math.PI * 2, true);
    img.closePath();
    img.clip();
    img.drawImage(await loadImage(avatar), x - r, y - r, r * 2, r * 2);

    return canvas.toBuffer();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function constrainText(ctx: CanvasRenderingContext2D, font: string, text: string, w: number, h: number): number {
    let size = (h ?? 60) + 1;

    if (w)
        do {
            ctx.font = `${--size}px ${font}`;
        } while (ctx.measureText(text).width > w);

    return size;
}

fastify()
    .get("/draw-levelup", async (req, res) => res.type("image/png").send(await drawLevelup(req.query as any)))
    .get("/draw-rankcard", async (req, res) => res.type("image/png").send(await drawRankcard(req.query as any)))
    .listen({ port: parseInt(process.env.PORT ?? "4040") });

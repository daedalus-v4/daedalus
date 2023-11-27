module.exports = {
    apps: [
        {
            name: "core",
            script: "./src/index.ts",
            cwd: "./core",
            interpreter: "/root/.bun/bin/bun",
            min_uptime: 20000,
            max_restarts: 5,
        },
        {
            name: "dashboard",
            script: "./build/index.js",
            cwd: "./dashboard",
            interpreter: "/root/.bun/bin/bun",
            min_uptime: 10000,
            max_restarts: 5,
        },
        {
            name: "renderer",
            script: "./dist/index.js",
            cwd: "./renderer",
            min_uptime: 1000,
            max_restarts: 10,
        },
    ],
};

module.exports = {
    apps: [
        {
            name: "test-online-consultation",
            script: "index.js",   // 👈 backend ka entry file
            watch: true,
            ignore_watch: [
                "node_modules",
                "uploads",
                "uploads/consultants"
            ],
            env: {
                NODE_ENV: "production"
            }
        }
    ]
};

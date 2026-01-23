module.exports = {
    apps: [
        {
            name: "test-online-consultation",
            script: "index.js",   // ya app.js
            watch: true,
            ignore_watch: [
                "node_modules",
                "uploads",
                "uploads/consultants",
                ".git",
                "logs",
                "*.log"
            ],
            env: {
                NODE_ENV: "production"
            }
        }
    ]
};

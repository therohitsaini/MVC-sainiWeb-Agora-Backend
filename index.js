    const express = require("express");
    const cors = require("cors");
    const dotenv = require("dotenv");
    const http = require("http");
    const bodyParser = require("body-parser");
    const { Server } = require("socket.io");
    const { connectDB } = require("./Utils/db");
    dotenv.config();
    connectDB();

    const app = express();
    const PORT = process.env.PORT || process.env.MVC_BACKEND_PORT || 3001;
    const server = http.createServer(app);
    const { ioServer } = require("./server-io");
    const { razerPayRoute } = require("./Routes/razerPayRoute");
    const shopifyRoute = require("./Routes/shopifyRoute");

    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    // Shopify CSP headers to allow embedding in admin dashboard
    // app.use((req, res, next) => {
    //     res.setHeader("Content-Security-Policy", "frame-ancestors https://admin.shopify.com https://*.myshopify.com;");
    //     res.setHeader("X-Frame-Options", "ALLOWALL");
    //     res.setHeader("X-Content-Type-Options", "nosniff");
    //     res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    //     next();
    // });


    const videoCallRouter = require("./Routes/videoCallRotes");
    const { signinSignupRouter } = require("./Routes/signin-signupRoute");
    const { userDetailsRouter } = require("./Routes/userDetailsRoutes");
    const bookAppointmentRoute = require("./Routes/bookAppointmentRoute");
    const { consultantRoute } = require("./Routes/consultantRoute");
    const { employRoute } = require("./Routes/employRutes");





    app.use("/api/video-call", videoCallRouter);
    app.use("/api/auth", signinSignupRouter);
    app.use("/api/users", userDetailsRouter);
    app.use("/api/razerpay-create-order", razerPayRoute)
    app.use("/api-consltor", bookAppointmentRoute)
    app.use("/api-consultant", consultantRoute)
    app.use("/api-employee", employRoute)
    // app.use("/apps", shopifyRoute);

<<<<<<< Updated upstream

    app.get("/apps/agora", (req, res) => {
     // Shopify adds shop and other params automatically
=======
    app.get("/apps/agora", (req, res) => {
        // Shopify adds shop and other params automatically
>>>>>>> Stashed changes
        const shop = req.query.shop;
        res.redirect(`https://agora-ui-v2.netlify.app/home`);
      });

    // app.use("/app/install", shopifyController.createOrder)

    ioServer(server);

    server.listen(PORT, () => {
        console.log(` Server running on port ${PORT}`);
    });

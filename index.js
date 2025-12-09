const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");
const { connectDB } = require("./Utils/db");
dotenv.config();
connectDB();
const path = require("path");
const app = express();
const PORT = process.env.MVC_BACKEND_PORT || 3001;
const server = http.createServer(app);
const { ioServer } = require("./server-io");
const { razerPayRoute } = require("./Routes/razerPayRoute");
const shopifyRoute = require("./Routes/shopifyRoute");
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve React frontend build (consultant-app) statically
// Assuming sibling folder structure:
// - MVC-sainiWeb-Agora-Backend (this project)
// - consultant-app (React project with build/)
const reactBuildPath = path.join(__dirname, "..", "consultant-app", "build");
app.use("/static", express.static(path.join(reactBuildPath, "static")));
app.use("/consultant-app", express.static(reactBuildPath));

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});



const videoCallRouter = require("./Routes/videoCallRotes");
const { signinSignupRouter } = require("./Routes/signin-signupRoute");
const { userDetailsRouter } = require("./Routes/userDetailsRoutes");
const { consultantRoute } = require("./Routes/consultantRoute");
const { employRoute } = require("./Routes/employRutes");
const chatRoutes = require("./Routes/chatRoutes");
const firebaseRouter = require("./Routes/firebaseRoutes");


app.use("/api/video-call", videoCallRouter);
app.use("/api/auth", signinSignupRouter);
app.use("/api/users", userDetailsRouter);
app.use("/api/razerpay-create-order", razerPayRoute)
app.use("/api-consultant", consultantRoute)
app.use("/api-employee", employRoute)

/** Shopify Routes */
app.use("/app", shopifyRoute);
app.use("/local-consultant/public/app", shopifyRoute);
app.use("/local-consultant/public/apps", shopifyRoute);

/** Chat Routes */
app.use("/api/chat", chatRoutes);
app.use("/api", firebaseRouter);


ioServer(server);

server.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});



// https://admin.shopify.com/store/saini-dev/oauth/authorize?SHOPIFY_API_KEY=569d15bd4d003d0ff174b2fdcfa8c59b&scope=read_customers,write_customers&redirect_uri=http://localhost:5001/local-consultant/public/app/app/install
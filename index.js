const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const path = require("path");

dotenv.config();

/* ---------------- DB ---------------- */
const { connectDB } = require("./Utils/db");
connectDB();

/* ---------------- App Init ---------------- */
const app = express();
const PORT = process.env.MVC_BACKEND_PORT || 3001;
const server = http.createServer(app);

/* ---------------- Socket.IO ---------------- */
const { ioServer } = require("./server-io");

/* ---------------- CORS (MULTI SHOP SAFE) ---------------- */
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (
        origin.endsWith(".myshopify.com") ||
        origin === "https://admin.shopify.com"
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

/* ---------------- WEBHOOK RAW BODY ---------------- */
const { webHookRoute } = require("./Routes/webHookRoute");
app.use("/api/webhooks", webHookRoute);

/* ---------------- BODY PARSERS ---------------- */
app.use((req, res, next) => {
  if (req.path.startsWith("/api/webhooks")) return next();
  express.json()(req, res, next);
});

app.use((req, res, next) => {
  if (req.path.startsWith("/api/webhooks")) return next();
  express.urlencoded({ extended: true })(req, res, next);
});

/* ---------------- STATIC FILES ---------------- */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const reactBuildPath = path.join(
  __dirname,
  "..",
  "consultant-app",
  "build"
);

app.use("/static", express.static(path.join(reactBuildPath, "static")));
app.use("/consultant-app", express.static(reactBuildPath));

/* ---------------- SECURITY HEADERS (VERY IMPORTANT) ---------------- */
app.use((req, res, next) => {
  // No cache
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  // Shopify iframe allow (ALL SHOPS)
  res.setHeader(
    "Content-Security-Policy",
    "frame-ancestors https://*.myshopify.com https://admin.shopify.com"
  );

  // Agora mic / camera permission
  res.setHeader(
    "Permissions-Policy",
    "microphone=*, camera=*"
  );

  next();
});

/* ---------------- ROUTES ---------------- */
const { callRoutes } = require("./Routes/videoCallRotes");
const { signinSignupRouter } = require("./Routes/signin-signupRoute");
const { userDetailsRouter } = require("./Routes/userDetailsRoutes");
const { consultantRoute } = require("./Routes/consultantRoute");
const { employRoute } = require("./Routes/employRutes");
const chatRoutes = require("./Routes/chatRoutes");
const firebaseRouter = require("./Routes/firebaseRoutes");
const { shopifyDraftOrderRoute } = require("./Routes/shopifyDraftOrderRoute");
const { userRouter } = require("./Routes/userRoutes");
const { adminRoute } = require("./Routes/adminRoute");
const shopifyRoute = require("./Routes/shopifyRoute");
const { razerPayRoute } = require("./Routes/razerPayRoute");

/* ---------------- API ROUTES ---------------- */
app.use("/api/call", callRoutes);
app.use("/api/auth", signinSignupRouter);
app.use("/api/users", userDetailsRouter);
app.use("/api/razerpay-create-order", razerPayRoute);
app.use("/api-consultant", consultantRoute);
app.use("/api-employee", employRoute);
app.use("/api/chat", chatRoutes);
app.use("/api", firebaseRouter);
app.use("/api/draft-order", shopifyDraftOrderRoute);
app.use("/api/admin", adminRoute);

/* ---------------- SHOPIFY APP ROUTES ---------------- */
app.use("/app", shopifyRoute);
app.use("/local-consultant/public/app", shopifyRoute);
app.use("/local-consultant/public/apps", shopifyRoute);

/* ---------------- SOCKET START ---------------- */
ioServer(server);

/* ---------------- START SERVER ---------------- */
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

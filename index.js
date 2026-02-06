const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const bodyParser = require("body-parser");
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
const { webHookRoute } = require("./Routes/webHookRoute");

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(cors({
  origin: "*",
  credentials: true,
}));


app.use('/api/webhooks', express.raw({ type: 'application/json' }));
app.use("/api/webhooks", webHookRoute);



app.use((req, res, next) => {
  if (req.path.startsWith('/api/webhooks')) return next();
  express.json()(req, res, next);
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/webhooks')) return next();
  express.urlencoded({ extended: true })(req, res, next);
});


app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const reactBuildPath = path.join(__dirname, "..", "consultant-app", "build");

app.use("/static", express.static(path.join(reactBuildPath, "static")));
app.use("/consultant-app", express.static(reactBuildPath));

// 🔔 Serve ringtone & public assets
app.use(
  "/sounds",
  express.static(
    path.join(__dirname, "..", "consultant-app", "public", "sounds"),
    {
      setHeaders: (res) => {
        res.setHeader("Content-Type", "audio/mpeg");
      },
    }
  )
);


app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});



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
const { adminPrincingRoute } = require("./Routes/adminPrincingRoutes");


app.use("/api/call", callRoutes);
app.use("/api/auth", signinSignupRouter);
app.use("/api/users", userDetailsRouter);
app.use("/api/razerpay-create-order", razerPayRoute)
app.use("/api-consultant", consultantRoute)
app.use("/api-employee", employRoute)

/** Shopify Routes */
app.use("/app", shopifyRoute);
app.use("/apps", shopifyRoute);

app.use("/local-consultant/public/app", shopifyRoute);
app.use("/local-consultant/public/apps", shopifyRoute);

/** Chat Routes */
app.use("/api/chat", chatRoutes);
app.use("/api", firebaseRouter);

/** Shopify Draft Order Routes */
app.use("/api/draft-order", shopifyDraftOrderRoute);


/** User Routes */
app.use("/api/users", userRouter);
app.use("/api/admin", adminRoute);
app.use("/api/princing", adminPrincingRoute)
app.use("/pricing-callback", adminPrincingRoute)

/** Web Hook Routes */

app.get(/^\/consultant-app(\/.*)?$/, (req, res) => {
  res.sendFile(path.join(reactBuildPath, "index.html"));
});



ioServer(server);

server.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});



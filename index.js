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
const PORT =  process.env.MVC_BACKEND_PORT || 3001;
const server = http.createServer(app);
const { ioServer } = require("./server-io");
const { razerPayRoute } = require("./Routes/razerPayRoute");
const shopifyRoute = require("./Routes/shopifyRoute");
// let axios, wrapper, CookieJar;
// try {
//   axios = require("axios");
//   wrapper = require("axios-cookiejar-support").wrapper;
//   CookieJar = require("tough-cookie").CookieJar;
// } catch (e) {
//   // Optional deps not installed; auto-login will be disabled
// }

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
app.use("/apps", shopifyRoute);
// app.use("/apps/a", shopifyRoute);


// app.get("/apps/agora", async (req, res) => {
//   try {
//     const shop = req.query.shop || "rohit-12345839.myshopify.com";
//     const themeId = req.query.theme_id; // optional for draft theme preview

//     // Forward storefront/preview cookies so password/preview sessions work
//     const cookieHeader = req.headers.cookie || "";
//     const userAgent = req.headers["user-agent"] || "node";
//     const makeUrl = (base) => themeId ? `${base}${base.includes("?") ? "&" : "?"}theme_id=${themeId}` : base;
//     const fetchWithSession = (url) => fetch(url, { headers: { Cookie: cookieHeader, "User-Agent": userAgent }, redirect: "manual" });

//     // 1) Pull the storefront home page to capture <head> assets (CSS/JS)
//     let homeResp = await fetchWithSession(makeUrl(`https://${shop}/`));

//     // If storefront is locked and we have a password, auto-login (dev/testing)
//     if (homeResp.status >= 300 && homeResp.status < 400) {
//       const storefrontPassword = process.env.STOREFRONT_PASSWORD || 1;
//       if (storefrontPassword && wrapper && CookieJar && axios) {
//         const jar = new CookieJar();
//         const client = wrapper(axios.create({ jar, withCredentials: true, headers: { "User-Agent": userAgent } }));
//         // visit password page to establish cookies
//         await client.get(`https://${shop}/password`).catch(() => {});
//         // submit password form
//         await client.post(`https://${shop}/password`, new URLSearchParams({ password: storefrontPassword }).toString(), {
//           headers: { "Content-Type": "application/x-www-form-urlencoded" },
//           maxRedirects: 0, validateStatus: () => true
//         });
//         // re-fetch home with authenticated jar
//         homeResp = await client.get(makeUrl(`https://${shop}/`));
//         // helper to fetch sections with jar
//         var jarFetch = async (url) => (await client.get(url)).data;
//       } else {
//         return res.status(401).send("Storefront locked. Enter password or use preview.");
//       }
//     }
//     const homeHtml = typeof homeResp.data === "string" ? homeResp.data : (await homeResp.text());
//     const headMatch = homeHtml.match(/<head[\s\S]*?<\/head>/i);
//     const headHtml = headMatch ? headMatch[0] :`

//       <head>
//         <meta charset="UTF-8" />
//         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//         <title>Agora App</title>
//       </head>`;

//     // 2) Fetch real header/footer HTML via Section Rendering API
//     const sectionFetch = typeof jarFetch === "function"
//       ? (url) => jarFetch(url)
//       : (url) => fetchWithSession(url).then(r => r.text());

//     const [headerHtml, footerHtml] = await Promise.all([
//       sectionFetch(makeUrl(`https://${shop}/?section_id=header`)),
//       sectionFetch(makeUrl(`https://${shop}/?section_id=footer`))
//     ]);

//     const pageHtml = `
//       <!DOCTYPE html>
//       <html>
//         ${headHtml}
//         <body style="margin:0;padding:0;">
//           ${headerHtml}
//           <main style="min-height:70vh;">
//             <iframe 
//               src="https://agora-ui-v2.netlify.app/home" 
//               style="border:none;width:100%;height:100vh;display:block;"
//             ></iframe>
//           </main>
//           ${footerHtml}
//         </body>
//       </html>`;

//     return res.status(200).send(pageHtml);
//   } catch (e) {
//     console.error("/apps/agora error:", e);
//     return res.status(500).send("Failed to compose Shopify header/footer");
//   }
// });

// app.use("/app/install", shopifyController.createOrder)

ioServer(server);

server.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});

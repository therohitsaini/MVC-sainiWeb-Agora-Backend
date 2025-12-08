// utils/shopifyProxy.js
const axios = require("axios");
const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");

async function fetchWithCookies(url, cookieHeader, userAgent) {
    return fetch(url, {
        headers: { Cookie: cookieHeader, "User-Agent": userAgent },
        redirect: "manual",
    });
}

async function handleStorefrontPassword(shop, userAgent) {
    const storefrontPassword = process.env.STOREFRONT_PASSWORD || null;
    if (!storefrontPassword) return null;

    const jar = new CookieJar();
    const client = wrapper(
        axios.create({
            jar,
            withCredentials: true,
            headers: { "User-Agent": userAgent },
        })
    );

    try {
        await client.get(`https://${shop}/password`).catch(() => { });
        await client.post(
            `https://${shop}/password`,
            new URLSearchParams({ password: storefrontPassword }).toString(),
            {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                maxRedirects: 0,
                validateStatus: () => true,
            }
        );
        return client;
    } catch {
        return null;
    }
}

function injectTheme(url, themeId) {
    return themeId ? `${url}${url.includes("?") ? "&" : "?"}theme_id=${themeId}` : url;
}

async function loadSections(shop, themeId, cookieHeader, userAgent, client) {
    const fetchFn = client
        ? async (url) => (await client.get(url)).data
        : async (url) => fetchWithCookies(url, cookieHeader, userAgent).then((r) => r.text());

    const header = fetchFn(injectTheme(`https://${shop}/?section_id=header`, themeId));
    const footer = fetchFn(injectTheme(`https://${shop}/?section_id=footer`, themeId));

    return await Promise.all([header, footer]);
}

/**
 * 🔥 MAIN REUSABLE FUNCTION
 */
async function renderShopifyPage(req, res, iframeUrl, options = {}) {
    const shop = req.query.shop;
    const themeId = req.query.theme_id;
    const cookieHeader = req.headers.cookie || "";
    const userAgent = req.headers["user-agent"] || "node";

    try {
        let homeResp = await fetchWithCookies(
            injectTheme(`https://${shop}/`, themeId),
            cookieHeader,
            userAgent
        );

        let client = null;
        if (homeResp.status >= 300 && homeResp.status < 400) {
            client = await handleStorefrontPassword(shop, userAgent);
            if (!client) return res.status(401).send("Storefront locked. Provide password.");
            homeResp = await client.get(injectTheme(`https://${shop}/`, themeId));
        }

        const homeHtml =
            typeof homeResp.data === "string"
                ? homeResp.data
                : await homeResp.text();

        const headMatch = homeHtml.match(/<head[\s\S]*?<\/head>/i);
        const headHtml =
            headMatch?.[0] ||
            `
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${options.title || "Shopify Embedded App"}</title>
      </head>`;

        const [headerHtml, footerHtml] = await loadSections(
            shop,
            themeId,
            cookieHeader,
            userAgent,
            client
        );

        const pageHtml = `
      <!DOCTYPE html>
      <html>
        ${headHtml}
        <body style="margin:0;padding:0;display:flex;flex-direction:column;min-height:700px;">
          <header style="flex-shrink:0;">
            ${headerHtml}
          </header>
          <main style="flex:1;overflow:hidden;position:relative;">
            <iframe 
              id="agora-iframe"
              src="${iframeUrl}" 
              style="border:none;width:100%;min-height:700px;display:block;"
            ></iframe>
          </main>
          <footer style="flex-shrink:0;">
            ${footerHtml}
          </footer>
          <!-- Parent script (MUST HAVE) -->
          <script src="https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/4.3.6/iframeResizer.min.js"></script>
          <script>
            window.addEventListener("message", (event) => {
              console.log("🔥 TOAST RECEIVED IN PARENT:", event.data); 
                if (event.data.type === "SHOW_TOAST") {
                  showToast(event.data.message);
                }
              });

              function showToast(message) {
                const toast = document.createElement("div");
                toast.innerText = message;
                toast.style.position = "fixed";
                toast.style.bottom = "20px";
                toast.style.right = "20px";
                toast.style.background = "#333";
                toast.style.color = "#fff";
                toast.style.padding = "10px 20px";
                toast.style.borderRadius = "8px";
                toast.style.zIndex = "999999";
                toast.style.opacity = "1";
                toast.style.transition = "opacity 1s ease";
                
                document.body.appendChild(toast);

                setTimeout(() => (toast.style.opacity = "0"), 3000);
                setTimeout(() => toast.remove(), 4000);
              }

            iFrameResize({
              checkOrigin: false,
              autoResize: true,
              heightCalculationMethod: "bodyScroll",
              minHeight: 700,
            }, "#agora-iframe");
          </script>
        </body>
      </html>`;

        return res.status(200).send(pageHtml);
    } catch (err) {
        console.error("Shopify proxy error:", err);
        return res.status(500).send("Failed to load Shopify page");
    }
}

module.exports = { renderShopifyPage };

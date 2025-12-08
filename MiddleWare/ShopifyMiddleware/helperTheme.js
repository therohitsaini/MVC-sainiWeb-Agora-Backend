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

                toast.innerHTML = \`
                  <div style="
                    display:flex;
                    gap:12px;
                    align-items:center;
                  ">

                    <div style="
                      width:40px;
                      height:40px;
                      border-radius:50%;
                      overflow:hidden;
                      background:#eee;
                      flex-shrink:0;
                    ">
                      <img 
                        src="https://cdn-icons-png.flaticon.com/512/1077/1077063.png"
                        style="width:100%;height:100%;object-fit:cover;"
                      />
                    </div>

                    <div style="flex:1;">
                      <div style="
                        font-weight:600;
                        font-size:15px;
                        color:#202223;
                      ">
                        New Message
                      </div>
                      <div style="
                        font-size:14px;
                        color:#4a4a4a;
                      ">
                        \${message}
                      </div>
                    </div>

                    <div 
                      style="
                        font-size:22px;
                        cursor:pointer;
                        color:#666;
                        padding:4px;
                      "
                      onclick="this.parentNode.parentNode.remove()"
                    >
                      ×
                    </div>
                  </div>
                \`;
                

                // MAIN CARD STYLE
                toast.style.position = "fixed";
                toast.style.top = "20px";
                toast.style.right = "20px";
                toast.style.background = "#fff";
                toast.style.borderRadius = "12px";
                toast.style.boxShadow = "0 4px 18px rgba(0,0,0,0.18)";
                toast.style.padding = "14px 16px";
                toast.style.minWidth = "280px";
                toast.style.maxWidth = "340px";
                toast.style.zIndex = "999999";
                toast.style.opacity = "0";
                toast.style.transform = "translateY(-10px)";
                toast.style.transition = "all .3s ease";

                document.body.appendChild(toast);

                // Fade-in
                setTimeout(() => {
                  toast.style.opacity = "1";
                  toast.style.transform = "translateY(0)";
                }, 10);

                // Auto Remove
                setTimeout(() => {
                  toast.style.opacity = "0";
                  toast.style.transform = "translateY(-10px)";
                }, 3500);

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

const proxyThemeAssetsController = async (req, res) => {
    try {

        const shop = req.query.shop
        const themeId = req.query.theme_id;
        const customerId = req.query.logged_in_customer_id;
        let userId;
        if (shop && customerId) {
            try {
                const result = await manageShopifyUser(shop, customerId);
                userId = result;
                console.log("result", result);
                if (result.success) {
                    console.log("✅ Customer registration:", result.message, result.userId ? `userId: ${result.userId}` : '');
                } else {
                    console.log("⚠️ Customer registration failed:", result.message);
                }
            } catch (error) {
                console.error("❌ Error registering customer:", error.message);
            }
        }

        const shopDocId = await shopModel.findOne({ shop: shop });
        console.log("userId__shop", shopDocId._id);
        const cookieHeader = req.headers.cookie || "";
        const userAgent = req.headers["user-agent"] || "node";
        const makeUrl = (base) => themeId ? `${base}${base.includes("?") ? "&" : "?"}theme_id=${themeId}` : base;
        const fetchWithSession = (url) => fetch(url, { headers: { Cookie: cookieHeader, "User-Agent": userAgent }, redirect: "manual" });
        let homeResp = await fetchWithSession(makeUrl(`https://${shop}/`));

        if (homeResp.status >= 300 && homeResp.status < 400) {
            const storefrontPassword = process.env.STOREFRONT_PASSWORD || 1;
            if (storefrontPassword && wrapper && CookieJar && axios) {
                const jar = new CookieJar();
                const client = wrapper(axios.create({ jar, withCredentials: true, headers: { "User-Agent": userAgent } }));
                await client.get(`https://${shop}/password`).catch(() => { });
                await client.post(`https://${shop}/password`, new URLSearchParams({ password: storefrontPassword }).toString(), {
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    maxRedirects: 0, validateStatus: () => true
                });

                homeResp = await client.get(makeUrl(`https://${shop}/`));
                var jarFetch = async (url) => (await client.get(url)).data;

            } else {
                return res.status(401).send("Storefront locked. Enter password or use preview.");
            }
        }

        const homeHtml = typeof homeResp.data === "string" ? homeResp.data : (await homeResp.text());
        const headMatch = homeHtml.match(/<head[\s\S]*?<\/head>/i);
        const headHtml = headMatch ? headMatch[0] : `
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Agora App</title>
          </head>`;
        const sectionFetch = typeof jarFetch === "function"
            ? (url) => jarFetch(url)
            : (url) => fetchWithSession(url).then(r => r.text());

        const [headerHtml, footerHtml] = await Promise.all([
            sectionFetch(makeUrl(`https://${shop}/?section_id=header`)),
            sectionFetch(makeUrl(`https://${shop}/?section_id=footer`))
        ]);
        const pageHtml = `
          <!DOCTYPE html>
          <html>
            ${headHtml}
            <body style="margin:0;padding:0;">
                <script>
                    const customerId = "${customerId}";
                </script>
              <main style="min-height:70vh;">
                  ${headerHtml}
              <iframe 
                  src="https://projectable-eely-minerva.ngrok-free.dev/consultant-cards?customerId=${userId?.userId || ''}&shopid=${shopDocId._id || ''}" 
                  style="border:none;width:100%;height:100vh;display:block;"
                ></iframe>
                  ${footerHtml}
              </main>
            </body>
          </html>
          `;
        return res.status(200).send(pageHtml);
    }

    catch (e) {
        console.error("/apps/agora error:", e);
        return res.status(500).send("Failed to compose Shopify header/footer");
    }
}
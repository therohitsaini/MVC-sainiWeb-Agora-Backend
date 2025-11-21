const axios = require("axios");

const createAppMenu = async (shop, accessToken) => {
    try {
        console.log("[DEBUG] createAppMenu - Starting with shop:", shop);
        console.log("[DEBUG] createAppMenu - Access token present:", !!accessToken);

        // 1. Create Section in Admin
        const sectionUrl = `https://${shop}/admin/api/2024-10/app_sections.json`;
        const sectionPayload = {
            app_section: { title: "Consultant App" }  // Sidebar Title
        };
        
        console.log("[DEBUG] createAppMenu - Creating section at:", sectionUrl);
        console.log("[DEBUG] createAppMenu - Section payload:", JSON.stringify(sectionPayload, null, 2));

        const sectionRes = await axios.post(
            sectionUrl,
            sectionPayload,
            { headers: { "X-Shopify-Access-Token": accessToken } }
        );

        console.log("[DEBUG] createAppMenu - Section creation response status:", sectionRes.status);
        console.log("[DEBUG] createAppMenu - Section creation response data:", JSON.stringify(sectionRes.data, null, 2));

        const sectionId = sectionRes.data.app_section.id;
        console.log("[DEBUG] createAppMenu - Extracted sectionId:", sectionId);

        // 2. Add a Link inside Section
        const linkUrl = `https://${shop}/admin/api/2024-10/app_sections/${sectionId}/links.json`;
        const linkPayload = {
            app_link: {
                title: "Dashboard",
                target: "app",
                url: "https://your-app-url.com/dashboard"
            }
        };

        console.log("[DEBUG] createAppMenu - Adding link at:", linkUrl);
        console.log("[DEBUG] createAppMenu - Link payload:", JSON.stringify(linkPayload, null, 2));

        const linkRes = await axios.post(
            linkUrl,
            linkPayload,
            { headers: { "X-Shopify-Access-Token": accessToken } }
        );

        console.log("[DEBUG] createAppMenu - Link creation response status:", linkRes.status);
        console.log("[DEBUG] createAppMenu - Link creation response data:", JSON.stringify(linkRes.data, null, 2));

        console.log("[DEBUG] createAppMenu - App menu added successfully!");
    } catch (err) {
        console.error("[DEBUG] createAppMenu - Error occurred:");
        console.error("[DEBUG] createAppMenu - Error message:", err.message);
        console.error("[DEBUG] createAppMenu - Error response status:", err.response?.status);
        console.error("[DEBUG] createAppMenu - Error response data:", JSON.stringify(err.response?.data, null, 2));
        console.error("[DEBUG] createAppMenu - Error stack:", err.stack);
        console.error("[DEBUG] createAppMenu - Full error:", err);
    }
}

module.exports = { createAppMenu };
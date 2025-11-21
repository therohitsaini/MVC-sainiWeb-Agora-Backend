const axios = require("axios");

/**
 * NOTE: This function attempts to create app navigation via API, but the App Sections API
 * endpoint appears to be unavailable or deprecated. Modern Shopify apps configure navigation
 * through:
 * 1. App configuration files (app.toml for Shopify CLI apps)
 * 2. Shopify Partner Dashboard → App setup → Navigation
 * 3. App Bridge navigation components in the frontend (RECOMMENDED for React apps)
 * 
 * 📖 See APP_BRIDGE_NAVIGATION_GUIDE.md for complete React + App Bridge navigation setup
 * 
 * This function will fail gracefully and not block app installation.
 */
const createAppMenu = async (shop, accessToken) => {
    try {
        console.log("[DEBUG] createAppMenu - Starting with shop:", shop);
        console.log("[DEBUG] createAppMenu - Access token present:", !!accessToken);
        console.log("[DEBUG] createAppMenu - NOTE: App Sections API may not be available via REST API");

        // 1. Create Section in Admin
        // Using 2025-01 API version (matching Shopify's current version)
        const sectionUrl = `https://${shop}/admin/api/2025-01/app_sections.json`;
        const sectionPayload = {
            app_section: { title: "Consultant App" }  // Sidebar Title
        };
        
        console.log("[DEBUG] createAppMenu - Creating section at:", sectionUrl);
        console.log("[DEBUG] createAppMenu - Section payload:", JSON.stringify(sectionPayload, null, 2));

        // IMPORTANT: Add Accept header to fix 406 error
        const sectionRes = await axios.post(
            sectionUrl,
            sectionPayload,
            { 
                headers: { 
                    "X-Shopify-Access-Token": accessToken,
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                } 
            }
        );

        console.log("[DEBUG] createAppMenu - Section creation response status:", sectionRes.status);
        console.log("[DEBUG] createAppMenu - Section creation response data:", JSON.stringify(sectionRes.data, null, 2));

        const sectionId = sectionRes.data.app_section.id;
        console.log("[DEBUG] createAppMenu - Extracted sectionId:", sectionId);

        // 2. Add a Link inside Section
        const linkUrl = `https://${shop}/admin/api/2025-01/app_sections/${sectionId}/links.json`;
        const linkPayload = {
            app_link: {
                title: "Dashboard",
                target: "app",
                url: "https://your-app-url.com/dashboard"
            }
        };

        console.log("[DEBUG] createAppMenu - Adding link at:", linkUrl);
        console.log("[DEBUG] createAppMenu - Link payload:", JSON.stringify(linkPayload, null, 2));

        // IMPORTANT: Add Accept header to fix 406 error
        const linkRes = await axios.post(
            linkUrl,
            linkPayload,
            { 
                headers: { 
                    "X-Shopify-Access-Token": accessToken,
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                } 
            }
        );

        console.log("[DEBUG] createAppMenu - Link creation response status:", linkRes.status);
        console.log("[DEBUG] createAppMenu - Link creation response data:", JSON.stringify(linkRes.data, null, 2));

        console.log("[DEBUG] createAppMenu - App menu added successfully!");
    } catch (err) {
        console.error("[DEBUG] createAppMenu - Error occurred:");
        console.error("[DEBUG] createAppMenu - Error message:", err.message);
        console.error("[DEBUG] createAppMenu - Error response status:", err.response?.status);
        console.error("[DEBUG] createAppMenu - Error response status text:", err.response?.statusText);
        console.error("[DEBUG] createAppMenu - Error response headers:", JSON.stringify(err.response?.headers, null, 2));
        console.error("[DEBUG] createAppMenu - Error response data:", JSON.stringify(err.response?.data, null, 2));
        
        // Check if it's a 406 error and provide specific guidance
        if (err.response?.status === 406) {
            console.error("[DEBUG] createAppMenu - ⚠️ 406 Error: App Sections API endpoint not available");
            console.error("[DEBUG] createAppMenu - This endpoint (/admin/api/2025-01/app_sections.json) doesn't exist or isn't accessible");
            console.error("[DEBUG] createAppMenu - ");
            console.error("[DEBUG] createAppMenu - ✅ SOLUTION: Configure app navigation through:");
            console.error("[DEBUG] createAppMenu -    1. Shopify Partner Dashboard → Your App → App setup → Navigation");
            console.error("[DEBUG] createAppMenu -    2. app.toml file (for Shopify CLI apps)");
            console.error("[DEBUG] createAppMenu -    3. App Bridge navigation components in your frontend");
            console.error("[DEBUG] createAppMenu - ");
            console.error("[DEBUG] createAppMenu - This is a non-critical error - app installation will continue");
        }
        
        console.error("[DEBUG] createAppMenu - Error stack:", err.stack);
        
        // Don't throw - let the caller handle it gracefully
        // The controller already catches this and continues installation
        return null;
    }
}

module.exports = { createAppMenu };
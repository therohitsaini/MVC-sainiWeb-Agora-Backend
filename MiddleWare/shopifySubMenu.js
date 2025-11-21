const axios = require("axios");

const createAppMenu = async (shop, accessToken) => {
    try {
        // 1. Create Section in Admin
        const sectionRes = await axios.post(
            `https://${shop}/admin/api/2024-10/app_sections.json`,
            {
                app_section: { title: "Consultant App" }  // Sidebar Title
            },
            { headers: { "X-Shopify-Access-Token": accessToken } }
        );

        const sectionId = sectionRes.data.app_section.id;
        console.log("sectionId", sectionId);

        // 2. Add a Link inside Section
        await axios.post(
            `https://${shop}/admin/api/2024-10/app_sections/${sectionId}/links.json`,
            {
                app_link: {
                    title: "Dashboard",
                    target: "app",
                    url: "https://your-app-url.com/dashboard"
                }
            },
            { headers: { "X-Shopify-Access-Token": accessToken } }
        );

        console.log("App menu added successfully!");
    } catch (err) {
        console.error(err.response?.data || err.message);
    }
}

module.exports = { createAppMenu };
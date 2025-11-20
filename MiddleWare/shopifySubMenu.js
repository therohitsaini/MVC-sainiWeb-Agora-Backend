const { default: axios } = require("axios");

const createAppMenu = async (shop, accessToken) => {
    try {
        // 1️⃣ Create section
        const sectionRes = await axios.post(
            `https://${shop}/admin/api/2024-10/app_sections.json`,
            { title: "Consultant App" },
            { headers: { "X-Shopify-Access-Token": accessToken } }
        );

        const sectionId = sectionRes.data.app_section.id;

        // 2️⃣ Add Dashboard link
        await axios.post(
            `https://${shop}/admin/api/2024-10/app_links.json`,
            {
                title: "Dashboard",
                url: "https://shopify-consultant.vercel.app/dashboard",
                type: "APP",
                position: 1,
                app_section_id: sectionId
            },
            { headers: { "X-Shopify-Access-Token": accessToken } }
        );

        // 3️⃣ Add Settings link
        await axios.post(
            `https://${shop}/admin/api/2024-10/app_links.json`,
            {
                title: "Consultant List",
                url: "https://shopify-consultant.vercel.app/consultant-list",
                type: "APP",
                position: 2,
                app_section_id: sectionId
            },
            { headers: { "X-Shopify-Access-Token": accessToken } }
        );

        console.log("Shopify App Menu Created Successfully");
    } catch (e) {
        console.log("Menu Error", e?.response?.data);
    }
}
module.exports = { createAppMenu }
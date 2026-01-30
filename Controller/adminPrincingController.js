 const pricingCallback = async (req, res) => {
    try {
        const { shop, host, plan_id } = req.query;
        console.log("shop host plan_id", shop, host, plan_id)
        console.log("req.query", req.query)

        // if (!shop) return res.status(400).send("Missing shop");

        // const shopDomain = shop.includes(".myshopify.com")
        //     ? shop
        //     : `${shop}.myshopify.com`;

        // const shopHandle = shopDomain.replace(".myshopify.com", "");

        // // 🔥 Find shop
        // const shopRecord = await shopModel.findOne({ shop: shopDomain });

        // if (!shopRecord) return res.status(404).send("Shop not found");

        // // ✅ Update plan
        // shopRecord.planId = plan_id;
        // shopRecord.availableTokens = process.env[`Plan_${plan_id}_Tokens`];
        // shopRecord.planStatus = "ACTIVE";

        // await shopRecord.save();

        // // Optional: fetch subscription later via webhook

        // // Frontend redirect
        // const redirectUrl =
        //     `${process.env.FRONTEND_URL}/?` +
        //     new URLSearchParams({
        //         shop: shopDomain,
        //         host,
        //         adminId: shopRecord._id.toString(),
        //         source: "billing_callback"
        //     }).toString();

        // return res.redirect(redirectUrl);

    } catch (err) {
        console.error("Billing callback error:", err);
        res.status(500).send("Billing callback failed");
    }
};

module.exports = { pricingCallback }

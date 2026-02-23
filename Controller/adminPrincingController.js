const { shopModel } = require("../Modal/shopify");
const axios = require("axios");

async function getChargeDetails(shop, accessToken, charge_id) {
    const url = `https://${shop}/admin/api/2023-10/recurring_application_charges/${charge_id}.json`;

    const response = await axios.get(url, {
        headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json"
        }
    });

    return response.data.recurring_application_charge;
}

const pricingCallback = async (req, res) => {
    try {
        const { shop, charge_id } = req.query;
        console.log("req____", req.query)
        console.log("-------------", req.path)
        // if (req.path === "/1") {
        //     console.log("Request came from route 1");
        // } else if (req.path === "/2") {
        //     console.log("Request came from route 2");
        // }
        if (!shop) return res.status(400).send("not found");
        const match = shop?.match(/^([a-z0-9-]+)\.myshopify\.com$/);
        if (!match) {
            return res.status(400).send("Invalid shop domain");
        }
        const shopHandle = match[1];
        console.log("shopHandle", shopHandle)

        const shop_ = await shopModel.findOne({ shop });

        if (!shop_) return res.status(404).send("Shop not found");
        const charge = await getChargeDetails(
            shop,
            shop_.accessToken,
            charge_id
        );
        console.log("charge", charge)
        let planName;
        if (charge_id === "26034864191") {
            planName = "Basic"
        }
        shop_.planStatus = "ACTIVE";
        await shop_.save();

        return res.send(`
                <script>
                window.top.location.href = "https://admin.shopify.com/store/${shopHandle}/apps/label-node01";
                </script>
                `);


    } catch (err) {
        console.error(err);
        res.status(500).send("Billing callback failed");
    }
};


module.exports = { pricingCallback }

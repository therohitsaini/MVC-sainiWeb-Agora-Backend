const { shopModel } = require("../Modal/shopify");

const pricingCallback = async (req, res) => {
    try {
        const { shop, charge_id } = req.query;
        console.log("req____", req.query)
        if (!shop) return res.status(400).send("not found");
        const match = shop?.match(/^([a-z0-9-]+)\.myshopify\.com$/);
        if (!match) {
            return res.status(400).send("Invalid shop domain");
        }
        const shopHandle = match[1];
        console.log("shopHandle", shopHandle)

        const shop_ = await shopModel.findOne({ shop });

        if (!shop_) return res.status(404).send("Shop not found");
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

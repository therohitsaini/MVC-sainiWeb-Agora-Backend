const { shopModel } = require("../Modal/shopify");

const pricingCallback = async (req, res) => {
    try {
        const { shop } = req.query;

        if (!shop) return res.status(400).send("Missing shop");

        const shop_ = await shopModel.findOne({ shop });

        if (!shop_) return res.status(404).send("Shop not found");

        shop_.planStatus = "ACTIVE";
        await shop_.save();

        return res.send(`
            <script>
              window.top.location.href = "https://admin.shopify.com/store/rohit-12345839/apps/label-node";
            </script>
        `);

    } catch (err) {
        console.error(err);
        res.status(500).send("Billing callback failed");
    }
};


module.exports = { pricingCallback }

const { shopModel } = require("../Modal/shopify");
const planMap = {
    '26034896959': {
        planName: "Basic",
        planType: "monthly",
        planAmount: "9.99"
    },
    '26034864191': {
        planName: "Pro",
        planType: "monthly",
        planAmount: "19.99"
    }
};
const pricingCallback = async (req, res) => {
    try {
        const { shop, charge_id } = req.query;

        if (!shop) return res.status(400).send("Shop missing");

        const match = shop.match(/^([a-z0-9-]+)\.myshopify\.com$/);
        if (!match) return res.status(400).send("Invalid shop");

        const shopHandle = match[1];

        const shop_ = await shopModel.findOne({ shop });
        if (!shop_) return res.status(404).send("Shop not found");

        const newPlan = planMap[charge_id];
        if (!newPlan) {
            return res.status(400).send("Invalid charge id");
        }

        if (shop_.accountPlanInfo?.length) {
            shop_.accountPlanInfo[0].planName = newPlan.planName;
            shop_.accountPlanInfo[0].planType = newPlan.planType;
            shop_.accountPlanInfo[0].planAmount = newPlan.planAmount;
        } else {
            shop_.accountPlanInfo = [{
                planName: newPlan.planName,
                planType: newPlan.planType,
                planAmount: newPlan.planAmount
            }];
        }

        shop_.planStatus = "ACTIVE";
        shop_.chargeId = charge_id; // 🔹 DB me charge id bhi save

        await shop_.save(); // ✅ DB SAVE

        return res.send(`
      <script>
        window.top.location.href =
        "https://admin.shopify.com/store/${shopHandle}/apps/label-node01";
      </script>
    `);

    } catch (err) {
        console.error(err);
        res.status(500).send("Billing callback failed");
    }
};


module.exports = { pricingCallback }

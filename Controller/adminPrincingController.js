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

function getPlanType(trialEndsOn, billingOn) {
    const trialDate = new Date(trialEndsOn);
    const billingDate = new Date(billingOn);

    const diffInDays =
        (billingDate - trialDate) / (1000 * 60 * 60 * 24);

    if (diffInDays > 300) {
        return "YEARLY";
    }
    return "MONTHLY";
}

const pricingCallback = async (req, res) => {
    try {
        const { shop, charge_id } = req.query;
        console.log("req____", req.query)
        console.log("-------------", req.path)

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

        const planType = getPlanType(
            charge.trial_ends_on,
            charge.billing_on
        );
        const planData = {
            planName: charge.name,
            planType: planType,
            planAmount: charge.price,
            currency: charge.currency
        };

        if (shop_.accountPlanInfo?.length) {
            shop_.accountPlanInfo[0].planName = planData.planName;
            shop_.accountPlanInfo[0].planType = planData.planType;
            shop_.accountPlanInfo[0].planAmount = planData.planAmount;
            shop_.accountPlanInfo[0].currency = planData.currency;

        } else {
            shop_.accountPlanInfo = [planData];
        }

        shop_.planStatus = "ACTIVE";
        shop_.activeChargeId = charge.id;

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

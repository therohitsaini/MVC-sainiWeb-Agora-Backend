const { verifyWebhook } = require("../MiddleWare/ShopifyMiddleware/verifyWebHook");

const webhooksOrdersCreated = async (req, res) => {
    try {

        const isValid = verifyWebhook(req);
        if (!isValid) {
            return res.status(401).send("Invalid webhook");
        }

        const order = JSON.parse(req.body.toString());
        console.log("✅ Order Created:", order.id);

        res.status(200).send("OK");

    } catch (error) {
        console.error(error);
        res.status(500).send("Webhook error");
    }
};


const webhooksOrdersDeleted = async (req, res) => {
    try {
        const data = req.body;
        console.log("Orders deleted webhook received:", data);
        res.status(200).send("Webhook received");
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server error while processing webhook"
        });
    }
}

module.exports = { webhooksOrdersCreated, webhooksOrdersDeleted };
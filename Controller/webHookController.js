const webhooksOrdersCreated = async (req, res) => {
    try {
        // req.body is a Buffer at this point (from express.raw())
        const order = JSON.parse(req.body.toString('utf8'));
        console.log("✅ Order Created:", order.id);
        console.log("order", order);

        res.status(200).send("OK");

    } catch (error) {
        console.error(error);
        res.status(500).send("Webhook error");
    }
};


const webhooksOrdersDeleted = async (req, res) => {
    try {
        // req.body is a Buffer at this point (from express.raw())
        const data = JSON.parse(req.body.toString('utf8'));
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

const webhooksAppUninstalled = async (req, res) => {
    try {
        const shop = req.headers["x-shopify-shop-domain"];
        console.log("shop____app-uninstalled", shop);
        const data = JSON.parse(req.body.toString('utf8'));
        console.log("App uninstalled webhook received:", data);
        await shopModel.findOneAndUpdate(
            { shop: shop },
            {
             
                accessToken: null,
                uninstalledAt: new Date(),
            }
        );
        console.log("Shop uninstalled successfully");
        res.status(200).send("OK");
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server error while processing webhook"
        });
    }
}


module.exports = { webhooksOrdersCreated, webhooksOrdersDeleted, webhooksAppUninstalled };
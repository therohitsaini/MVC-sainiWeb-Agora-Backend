const { shopModel } = require("../Modal/shopify");

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

const webhooksCustomerDataRequest = async (req, res) => {
    console.log('📥 GDPR customer data request', req.body);

    // TODO:
    // - find customer data
    // - email merchant if required

    res.status(200).send('OK');
};

const webhooksCustomerRedact = async (req, res) => {
    console.log('🧹 GDPR customer redact', req.body);

    // TODO:
    // - delete customer data from DB

    res.status(200).send('OK');
};

const webhooksShopRedact = async (req, res) => {
    console.log('🏪 GDPR shop redact', req.body);

    // TODO:
    // - delete all shop data

    res.status(200).send('OK');
};

const paymentSucessController = async (req, res) => {
    try {

        const topic = req.headers["x-shopify-topic"];
        console.log("topic", topic)
        // ONLY payment success
        if (topic !== "orders/paid") {
            return res.sendStatus(200);
        }

        const order = req.body;
        console.log("Order", order)
        const appUserId = order.note_attributes.find(
            attr => attr.name === 'app_user_id'
        )?.value;
        console.log("appUserId", appUserId)

        // Draft order id
        // const draftOrderId = order.source_identifier;

        // if (!draftOrderId) return res.sendStatus(200);

        // // Find recharge record
        // const transaction = await ReachargeTransactionHistroy.findOne({
        //     draftOrderId,
        //     status: "PENDING"
        // });

        // if (!transaction) return res.sendStatus(200);

        // // Prevent double credit
        // if (transaction.status === "COMPLETED") return res.sendStatus(200);

        // // Update wallet
        // await User.findByIdAndUpdate(transaction.userId, {
        //     $inc: { walletBalance: transaction.amount }
        // });

        // // Mark transaction completed
        // transaction.status = "COMPLETED";
        // await transaction.save();

        // console.log("✅ Wallet recharged:", transaction.userId);

        // res.sendStatus(200);

    } catch (err) {
        console.log("Webhook error:", err);
        res.sendStatus(500);
    }
}



module.exports = {
    webhooksOrdersCreated,
    webhooksOrdersDeleted,
    webhooksAppUninstalled,
    webhooksCustomerDataRequest,
    webhooksCustomerRedact,
    webhooksShopRedact,
    paymentSucessController
};
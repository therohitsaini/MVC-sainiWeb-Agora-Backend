const { shopModel } = require("../Modal/shopify");
const { User } = require("../Modal/userSchema");
const { WalletHistory } = require("../Modal/walletHistory");

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

// const paymentSucessController = async (req, res) => {
//     try {

//         const topic = req.headers["x-shopify-topic"];
//         console.log("topic", topic)
//         // ONLY payment success
//         if (topic !== "orders/paid") {
//             return res.sendStatus(200);
//         }

//         const order = req.body;
//         console.log("Order", order)
//         const appUserId = order.note_attributes.find(
//             attr => attr.name === 'app_user_id'
//         )?.value;
//         console.log("appUserId", appUserId)

//         // Draft order id
//         // const draftOrderId = order.source_identifier;

//         // if (!draftOrderId) return res.sendStatus(200);

//         // // Find recharge record
//         // const transaction = await ReachargeTransactionHistroy.findOne({
//         //     draftOrderId,
//         //     status: "PENDING"
//         // });

//         // if (!transaction) return res.sendStatus(200);

//         // // Prevent double credit
//         // if (transaction.status === "COMPLETED") return res.sendStatus(200);

//         // // Update wallet
//         // await User.findByIdAndUpdate(transaction.userId, {
//         //     $inc: { walletBalance: transaction.amount }
//         // });

//         // // Mark transaction completed
//         // transaction.status = "COMPLETED";
//         // await transaction.save();

//         // console.log("✅ Wallet recharged:", transaction.userId);

//         // res.sendStatus(200);

//     } catch (err) {
//         console.log("Webhook error:", err);
//         res.sendStatus(500);
//     }
// }
const paymentSucessController = async (req, res) => {
    try {
        // 1. Get order data from Shopify webhook
        let orderData = req.body;

        // Convert buffer to object if needed
        if (Buffer.isBuffer(orderData)) {
            orderData = JSON.parse(orderData.toString());
        }

        // 2. Extract note_attributes
        const noteAttrs = orderData.note_attributes;

        if (!noteAttrs || !Array.isArray(noteAttrs)) {
            return res.status(400).send('No note attributes found');
        }

        // 3. Find app_user_id and customer_id
        const appUserIdAttr = noteAttrs.find(attr => attr.name === 'app_user_id');
        const customerIdAttr = noteAttrs.find(attr => attr.name === 'customer_id');
        const customerIdAttrTransId = noteAttrs.find(attr => attr.name === 'transaction_id');
        const shopId = noteAttrs.find(attr => attr.name === 'shop_id');


        if (!appUserIdAttr || !customerIdAttr || !customerIdAttrTransId || !shopId) {
            return res.status(400).send('Required attributes missing');
        }

        const appUserId = appUserIdAttr.value;
        const shopifyCustomerId = customerIdAttr.value;
        const transactionId = customerIdAttrTransId.value;
        const shopId_ = shopId.value
        const orderAmount = parseFloat(orderData.total_price) || 0;
        const user = await User.findById(appUserId);

        if (!user) {
            console.error('❌ User not found:', appUserId);
            return res.status(404).send('User not found');
        }
        const findVoucherPlan = await shopModel.findById(shopId_)

        const currentBalance = user.walletBalance || 0;
        const newBalance = currentBalance + orderAmount;
        console.log("orderAmount", orderAmount)
        console.log("currentBalance", currentBalance)
        console.log("newBalance", newBalance)
        console.log("findVoucherPlan", findVoucherPlan.vouchers)
        
        user.walletBalance = newBalance;
        await user.save();
        await WalletHistory.findByIdAndUpdate(transactionId, {
            status: "success",
            // completedAt: new Date(),
            // shopifyOrderId: orderData.id,
            // orderData: orderData // Store full order data if needed
        },
            { new: true }
        );

        console.log('✅ Balance updated:', {
            userId: appUserId,
            oldBalance: currentBalance,
            addedAmount: orderAmount,
            newBalance: newBalance
        });

        // // 6. ✅ Update transaction status (अगर आपके पास transaction table है)
        // const transaction = await ReachargeTransactionHistroy.findOneAndUpdate(
        //     {
        //         userId: appUserId,
        //         draftOrderId: orderData.id.toString(),
        //         status: 'PENDING'
        //     },
        //     {
        //         status: 'COMPLETED',
        //         completedAt: new Date(),
        //         shopifyOrderId: orderData.id,
        //         orderData: orderData // Store full order data if needed
        //     },
        //     { new: true }
        // );

        // if (transaction) {
        //     console.log('✅ Transaction updated:', transaction._id);
        // }

        // 7. ✅ Send notification to user (WebSocket या push notification)
        // Example: Send socket notification


        // 8. ✅ Response send करें
        res.status(200).json({
            success: true,
            message: 'Balance updated successfully',
            userId: appUserId,
            amountAdded: orderAmount,
            newBalance: newBalance,
            // transactionId: transaction?._id
        });

    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};


module.exports = {
    webhooksOrdersCreated,
    webhooksOrdersDeleted,
    webhooksAppUninstalled,
    webhooksCustomerDataRequest,
    webhooksCustomerRedact,
    webhooksShopRedact,
    paymentSucessController
};
const { shopModel } = require("../Modal/shopify");
const mongoose = require("mongoose");
const axios = require("axios");
const { ReachargeTransactionHistroy } = require("../Modal/reachargeTransactionHistroy");
const { User } = require("../Modal/userSchema");

/**
 * Create Shopify Draft Order (Latest GraphQL version)
 * API: POST /api/draft-order/create-draft-order
 * Body: { shop, amount, title, userId }
 */


const createDraftOrder = async (req, res) => {
    try {
        const { shop, amount, title, userId } = req.body;

        if (!shop || !amount || !title || !userId) {
            return res
                .status(400)
                .json({ success: false, message: "All fields are required" });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid user ID" });
        }
        let customerId = null;
        if (userId) {
            const user = await User.findById(userId).select("shopifyCustomerId");
            if (user) {
                customerId = user.shopifyCustomerId;
            }
        }

        const shopAccessToken = await shopModel.findOne({ shop });
        if (!shopAccessToken) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid shop" });
        }

        const accessToken = shopAccessToken.accessToken;

        const response = await axios.post(
            `https://${shop}/admin/api/2024-01/graphql.json`,
            {
                query: `
                    mutation draftOrderCreate($input: DraftOrderInput!) {
                        draftOrderCreate(input: $input) {
                        draftOrder {
                            id
                            name
                            invoiceUrl
                            totalPriceSet {
                            shopMoney {
                                amount
                                currencyCode
                            }
                            }
                        }
                        userErrors {
                            field
                            message
                        }
                        }
                    }
                    `,
                variables: {
                    input: {
                        lineItems: [
                            {
                                title: title || "Consultation Fee",
                                quantity: 1,
                                originalUnitPrice: amount
                            }
                        ],
                        note: "Consultation payment from app",
                        // Optional: add custom attributes for tracking in Shopify
                        noteAttributes: [
                            { key: "app_user_id", value: userId },
                            { key: "customer_id", value: customerId }
                        ]
                    }
                }
            },
            {
                headers: {
                    "X-Shopify-Access-Token": accessToken,
                    "Content-Type": "application/json"
                }
            }
        );

        const result = response.data?.data?.draftOrderCreate;


        if (!result) {
            console.log("Unexpected draftOrderCreate response:", response.data);
            return res.status(500).json({
                success: false,
                message: "Failed to create draft order"
            });
        }

        if (result.userErrors && result.userErrors.length) {
            console.log("GraphQL draftOrderCreate errors:", result.userErrors);
            return res.status(400).json({
                success: false,
                message: "Draft order creation failed",
                errors: result.userErrors
            });
        }

        const draftOrder = result.draftOrder;
        const draftOrderId = draftOrder?.id.split("/").pop();

        const transaction = await ReachargeTransactionHistroy.create({
            shop,
            userId,
            amount,
            customerId: customerId,
            currency: "INR",
            draftOrderId: draftOrderId,
            invoiceUrl: draftOrder.invoiceUrl,
            status: "PENDING",
            purpose: "RECHARGE"
        });
        await transaction.save();

        return res.status(200).json({
            success: true,
            invoiceUrl: draftOrder?.invoiceUrl || null,
            draftOrderId: draftOrder?.id || null,
            name: draftOrder?.name || null,
            totalPrice: draftOrder?.totalPriceSet?.shopMoney || null
        });
    } catch (error) {
        console.log(
            "createDraftOrder error:",
            error.response?.data || error.message
        );
        res.status(500).json({
            success: false,
            message: "Server error while creating draft order"
        });
    }
};


module.exports = { createDraftOrder };

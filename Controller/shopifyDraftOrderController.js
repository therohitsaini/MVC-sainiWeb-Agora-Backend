const { shopModel } = require("../Modal/shopify");
const mongoose = require("mongoose");
const axios = require("axios");

 const createDraftOrder = async (req, res) => {
    try {
        const { shop, amount, title, userId } = req.body;
        if (!shop || !amount || !title || !userId) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }
        const shopAccessToken = await shopModel.findOne({ shop: shop });
        if (!shopAccessToken) {
            return res.status(400).json({ success: false, message: "Invalid shop" });
        }
        const accessToken = shopAccessToken.accessToken;
        const draftOrderPayload = {
            draft_order: {
                line_items: [
                    {
                        title: title || "Consultation Fee",
                        quantity: 1,
                        price: amount
                    }
                ],
                note: "Consultation payment from app",
                note_attributes: [
                    { name: "app_user_id", value: userId },
                    { name: "payment_type", value: "chat" }
                ]
            }
        };

        const response = await axios.post(
            `https://${shop}/admin/api/2024-01/draft_orders.json`,
            draftOrderPayload,
            {
                headers: {
                    "X-Shopify-Access-Token": accessToken,
                    "Content-Type": "application/json"
                }
            }
        );

        return res.status(200).json({
            success: true,
            invoiceUrl: response.data.draft_order.invoice_url
        });

    } catch (error) {
        console.log(error.response?.data || error.message);
        res.status(500).json({ success: false });
    }
};

module.exports = { createDraftOrder };

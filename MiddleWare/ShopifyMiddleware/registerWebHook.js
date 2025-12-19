const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const registerOrderPaidWebhook = async (shop, accessToken) => {
    const query = `
      mutation {
        webhookSubscriptionCreate(
          topic: ORDERS_PAID,
          webhookSubscription: {
            callbackUrl: "${process.env.APP_URL}/api/webhooks/webhooks/orders-paid",
            format: JSON
          }
        ) {
          webhookSubscription {
            id
          }
          userErrors {
            message
          }
        }
      }
    `;

    const response = await axios.post(
        `https://${shop}/admin/api/2024-01/graphql.json`,
        { query },
        {
            headers: {
                "X-Shopify-Access-Token": accessToken,
                "Content-Type": "application/json",
            },
        }
    );

    console.log("Webhook created:", response.data);
};

module.exports = { registerOrderPaidWebhook };

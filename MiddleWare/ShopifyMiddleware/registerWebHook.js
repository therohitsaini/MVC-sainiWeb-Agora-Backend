const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const registerOrderPaidWebhook = async (shop, accessToken, topic, callbackUrl) => {
    console.log("Registering webhook for topic:", topic, "and callback url:", callbackUrl);
    try {

        const query = `
      mutation {
        webhookSubscriptionCreate(
          topic: ${topic},
          webhookSubscription: {
            uri: ${callbackUrl},
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

        if (response.data.errors) {
            console.log("Webhook creation error:", response.data.errors);
            throw new Error(response.data.errors[0].message);
        }
        console.log("Webhook user errors:", response.data.data.webhookSubscriptionCreate.userErrors);
        console.log("Webhook created:", response.data.data.webhookSubscriptionCreate.webhookSubscription);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

module.exports = { registerOrderPaidWebhook };

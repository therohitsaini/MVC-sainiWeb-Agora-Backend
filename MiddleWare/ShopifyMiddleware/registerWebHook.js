const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const registerOrderPaidWebhook = async (shop, accessToken,) => {
  try {

    const query = `
      mutation {
        webhookSubscriptionCreate(
          topic: ORDERS_CREATE,
          webhookSubscription: {
            callbackUrl: "${process.env.APP_URL}/api/webhooks/webhooks/orders-created",
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

const registerOrderDeletedWebhook = async (shop, accessToken) => {
  try {

    const query = `
      mutation {
        webhookSubscriptionCreate(
          topic: ORDERS_DELETE,
          webhookSubscription: {
            callbackUrl: "${process.env.APP_URL}/api/webhooks/webhooks/orders-deleted",
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
    console.log("Webhook deleted:", response.data.data.webhookSubscriptionCreate.webhookSubscription);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}


// const registerAppUninstallWebhook = async (shop, accessToken) => {
//   try {
//     const query = `
//       mutation {
//         webhookSubscriptionCreate(
//           topic: APP_UNINSTALLED,
//           webhookSubscription: {
//             callbackUrl: "${process.env.APP_URL}/api/webhooks/app-uninstalled",
//             format: JSON
//           }
//         ) {
//           webhookSubscription {
//             id
//           }
//           userErrors {
//             message
//           }
//         }
//       }
//     `;

//     const response = await axios.post(
//       `https://${shop}/admin/api/2024-01/graphql.json`,
//       { query },
//       {
//         headers: {
//           "X-Shopify-Access-Token": accessToken,
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     console.log("response", response.data);

//     if (response.data.errors) {
//       console.log("Uninstall webhook creation error:", response.data.errors);
//       throw new Error(response.data.errors[0].message);
//     }

//     console.log(
//       "Uninstall webhook user errors:",
//       response.data.data.webhookSubscriptionCreate.userErrors
//     );

//     console.log(
//       "App Uninstall webhook created:",
//       response.data.data.webhookSubscriptionCreate.webhookSubscription
//     );

//     return response.data;
//   } catch (error) {
//     console.log("Register uninstall webhook error:", error);
//     throw error;
//   }
// };
const registerAppUninstallWebhook = async (shop, accessToken) => {
  try {
    const query = `
      mutation webhookSubscriptionCreate(
        $topic: WebhookSubscriptionTopic!, 
        $webhookSubscription: WebhookSubscriptionInput!
      ) {
        webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
          webhookSubscription {
            id
            topic
            endpoint {
              __typename
              ... on WebhookHttpEndpoint {
                callbackUrl
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      topic: "APP_UNINSTALLED",
      webhookSubscription: {
        callbackUrl: `${process.env.APP_URL}/api/webhooks/app-uninstalled`
      },
    };

    const { data } = await axios.post(
      `https://${shop}/admin/api/2024-10/graphql.json`,
      { query, variables },
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    const response = data.data.webhookSubscriptionCreate;

    if (response.userErrors.length) {
      console.error("❌ Webhook user errors:", response.userErrors);
      return null;
    }

    console.log(
      "✅ Uninstall webhook created:",
      response.webhookSubscription
    );

    return response.webhookSubscription;
  } catch (error) {
    console.error("Webhook subscription error:", error.response?.data || error);
    throw error;
  }
};


module.exports = { registerOrderPaidWebhook, registerOrderDeletedWebhook, registerAppUninstallWebhook };

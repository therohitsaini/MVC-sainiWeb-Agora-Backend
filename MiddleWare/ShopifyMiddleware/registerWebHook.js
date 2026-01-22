const axios = require("axios");
const dotenv = require("dotenv");
const { Shopify } = require('@shopify/shopify-api');
const { shopifyConfig } = require("../../config/shopifyConfig");
dotenv.config();




// check webhook is already registered midle ware function
const getExistingWebhooks = async (shop, accessToken) => {
  const query = `
    query {
      webhookSubscriptions(first: 100) {
        edges {
          node {
            id
            topic
            endpoint {
              ... on WebhookHttpEndpoint {
                callbackUrl
              }
            }
          }
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

  return response.data.data.webhookSubscriptions.edges;
};

// check webhook is already registered midle ware function end


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




const registerAppUninstallWebhook = async (shop, accessToken) => {
  try {
    const callbackUrl = `${process.env.APP_URL}/api/webhooks/app-uninstalled`;

    const webhooks = await getExistingWebhooks(shop, accessToken);
    const alreadyRegistered = webhooks.some(({ node }) =>
      node.topic === "APP_UNINSTALLED" &&
      node.endpoint?.callbackUrl === callbackUrl
    );

    if (alreadyRegistered) {
      console.log("✅ APP_UNINSTALLED webhook already registered");
      return { status: "already_registered" };
    }

    const mutation = `
      mutation {
        webhookSubscriptionCreate(
          topic: APP_UNINSTALLED,
          webhookSubscription: {
            callbackUrl: "${callbackUrl}",
            format: JSON
          }
        ) {
          webhookSubscription {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await axios.post(
      `https://${shop}/admin/api/2024-01/graphql.json`,
      { query: mutation },
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    const errors = response.data.data.webhookSubscriptionCreate.userErrors;
    if (errors.length) {
      throw new Error(errors[0].message);
    }

    console.log("🎉 APP_UNINSTALLED webhook created successfully");
    return response.data;

  } catch (error) {
    console.error("❌ Register uninstall webhook error:", error.message);
    throw error;
  }
};


const registerGdprWebhook = async (shop, accessToken) => {
  const client = new shopifyConfig.clients.Graphql({
    session: {
      shop,
      accessToken,
    },
  });


  const mutation = `
    mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
      webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
        userErrors {
          field
          message
        }
        webhookSubscription {
          id
        }
      }
    }
  `;

  for (const wh of webhooks) {
    try {
      const variables = {
        topic: wh.topic,
        webhookSubscription: {
          callbackUrl: wh.callbackUrl,
          format: "JSON",
        },
      };

      const response = await client.query({ data: { query: mutation, variables } });
      const errors = response.body.data.webhookSubscriptionCreate.userErrors;

      if (errors.length) {
        console.error(`❌ Failed to create ${wh.topic} webhook:`, errors);
      } else {
        console.log(`✅ Registered ${wh.topic} webhook successfully`);
      }
    } catch (err) {
      console.error(`❌ Error registering ${wh.topic} webhook:`, err.message);
    }
  }
}




module.exports = { registerOrderPaidWebhook, registerOrderDeletedWebhook, registerAppUninstallWebhook, registerGdprWebhook };

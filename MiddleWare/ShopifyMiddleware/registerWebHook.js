const axios = require("axios");
const dotenv = require("dotenv");
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

const registerGdprWebhook = async (shop, accessToken, topic, callbackPath) => {
  const callbackUrl = `${process.env.APP_URL}${callbackPath}`;
  console.log("callbackUrl", callbackUrl);
  const mutation = `
    mutation webhookSubscriptionCreate(
      $topic: WebhookSubscriptionTopic!
      $callbackUrl: URL!
    ) {
      webhookSubscriptionCreate(
        topic: $topic
        webhookSubscription: {
          callbackUrl: $callbackUrl
          format: JSON
        }
      ) {
        webhookSubscription { id }
        userErrors { field message }
      }
    }
  `;

  const response = await axios.post(
    `https://${shop}/admin/api/2024-01/graphql.json`,
    {
      query: mutation,
      variables: { topic, callbackUrl }
    },
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json"
      }
    }
  );

  const result = response.data?.data?.webhookSubscriptionCreate;

  if (!result) {
    console.error("❌ Invalid GraphQL response:", response.data);
    throw new Error("Webhook creation failed");
  }

  if (result.userErrors?.length) {
    console.error("❌ Webhook user errors:", result.userErrors);
    throw new Error(result.userErrors[0].message);
  }

  console.log(`✅ GDPR webhook registered: ${topic}`);
  return result.webhookSubscription;
};


module.exports = { registerOrderPaidWebhook, registerOrderDeletedWebhook, registerAppUninstallWebhook, registerGdprWebhook };

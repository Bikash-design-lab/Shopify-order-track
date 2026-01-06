import db from "./db";

// after sucessfully auth webhook create
// once create when user place order webhook will be called and store data in db 
async function afterAuth(req, res) {
  const appUrl = process.env.APP_URL;
  const { authenticate } = require('./shopify.server');
  const { admin } = await authenticate.admin(req, res);

  // Now we are AFTER AUTH:
  // → Safe to call Admin GraphQL on this shop
  // → Create the ORDERS_CREATE webhook
  
  const mutation = `#graphql
    mutation CreateOrdersCreateWebhook(
      $topic: WebhookSubscriptionTopic!
      $webhookSubscription: WebhookSubscriptionInput!
    ) {
      webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
        webhookSubscription {
          id
          topic
          uri
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  const variables = {
    topic: 'ORDERS_CREATE',
    webhookSubscription: {
      uri: `${appUrl}/webhooks/orders-create`,
    },
  };

  try {
    const response = await admin.graphql(mutation, { variables });
    const data = await response.json();

    const { webhookSubscription, userErrors } =
      data.data.webhookSubscriptionCreate;

    if (userErrors && userErrors.length > 0) {
      console.error('Webhook creation errors:', userErrors);
    } else {
      console.log('ORDERS_CREATE webhook created:', webhookSubscription);
    }
  } catch (err) {
    console.error('Error creating ORDERS_CREATE webhook:', err);
  }

  res.redirect('/app');
}


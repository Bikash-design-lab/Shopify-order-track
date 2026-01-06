// webhooks.js
import {crypto} from 'crypto';
import { prisma } from './db.server';
import { APP_URL } from 'process.env';
import { SHOPIFY_WEBHOOK_SECRET } from 'process.env';

// Helper to verify HMAC (simplified)
function verifyShopifyWebhook(req) {
  const hmacHeader = req.headers['x-shopify-hmac-sha256'];
  const body = req.rawBody; // this is the raw body of the request make sure middleware gives raw body

  const digest = crypto
    .createHmac('sha256', SHOPIFY_WEBHOOK_SECRET)
    .update(body)
    .digest('base64');

  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
}

// This is the handler for ORDERS_CREATE
async function ordersCreateWebhookHandler(req, res) {
  // 1. (optional during dev) skip verification or keep it:
  if (!verifyShopifyWebhook(req)) {
    return res.status(401).send('Unauthorized');
  }

  // 2. Parse payload
  const payload = JSON.parse(req.body.toString()); // JSON.parse(req.rawBody)
  const shop = req.headers['x-shopify-shop-domain'];

  // 3. Get the order GraphQL ID
  // Shopify often sends "admin_graphql_api_id" in payload
  const orderGid = payload.admin_graphql_api_id || payload.id;

  if (!orderGid) {
    console.warn('ORDERS_CREATE webhook without order ID', payload);
    return res.status(400).send('Missing order ID');
  }

  // 4. Store in Prisma
  try {
    await prisma.OrderRecord.create({
      data: {
        shop,
        orderGid,
      },
    });
    console.log('Stored order ID', orderGid);
  } catch (e) {
    // If the same order arrives twice, unique constraint will throw an error
    console.error('Error storing order ID', e);
  }

  res.status(200).send('OK');
}

export default ordersCreateWebhookHandler;    
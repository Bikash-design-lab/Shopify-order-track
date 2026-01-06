import express from 'express';
const port = 3000;
import dotenv from 'dotenv';
dotenv.config();    
import cors from 'cors';

import ordersCreateWebhookHandler from '../order-create/app/weebhook.js';

const app = express();
app.use(cors());

app.post(
  '/webhooks/orders-create',
  express.raw({ type: 'application/json' }),
  ordersCreateWebhookHandler
);

app.listen(port, () => {
  console.log(`Backend app listening on port ${port}`);
});

import { useEffect } from "react";
import { useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price 
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();
  const product = responseJson.data.productCreate.product;
  const webhookResponse = await admin.graphql(
    `#graphql 
  mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
  webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
    webhookSubscription {
      id
      topic
      filter
      uri
    }
    userErrors {
      field
      message
    }
  }
    }
    }`,
    {
      variables: {
        topic: "ORDERS_CREATE",
        webhookSubscription: {
          uri: `${appUrl}/webhooks/orders-create`,
        },
      },
    },
  );
  const webhookResponseJson = await webhookResponse.json();

  return {

// our response
// {
//   "webhookSubscriptionCreate": {
//     "webhookSubscription": {
//       "id": "gid://shopify/WebhookSubscription/8589934634",
//       "topic": "ORDERS_CREATE",
//       "filter": "type:lookbook",
//       "uri": "process.env.APP_URL/webhooks/orders-create"
//     },
//     "userErrors": []
//   }
// }
    product: responseJson.data.productCreate.product,
    webhook: webhookResponseJson.data.webhookSubscriptionCreate.webhookSubscription,
  };
};

export default function Index() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";

  useEffect(() => { 
    if (fetcher.data?.product?.id) {
      shopify.toast.show("Product created");
    }
  }, [fetcher.data?.product?.id, shopify]);
  const generateProduct = () => fetcher.submit({}, { method: "POST" });
  if(isLoading) return <s-spinner />;

  return (
    <>
      <p>Order Id: {fetcher.data?.order?.id}</p>
    </>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};

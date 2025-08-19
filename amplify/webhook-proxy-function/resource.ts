import { defineFunction } from "@aws-amplify/backend";

export const webhookProxyFunction = defineFunction({
  name: "webhook-proxy-function",
  entry: "./handler.ts"
});

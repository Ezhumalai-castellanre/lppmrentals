import { defineFunction } from "@aws-amplify/backend";

export const submitApplicationFunction = defineFunction({
  name: "submit-application-function",
  entry: "./handler.ts"
});

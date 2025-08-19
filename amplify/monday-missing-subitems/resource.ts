import { defineFunction } from "@aws-amplify/backend";

export const mondayMissingSubitemsFunction = defineFunction({
  name: "monday-missing-subitems",
  entry: "./handler.ts"
});

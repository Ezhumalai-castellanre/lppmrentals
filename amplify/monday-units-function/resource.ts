import { defineFunction } from "@aws-amplify/backend";

export const mondayUnitsFunction = defineFunction({
  name: "monday-units-function",
  entry: "./handler.ts"
});

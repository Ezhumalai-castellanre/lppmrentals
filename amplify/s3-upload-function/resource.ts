import { defineFunction } from "@aws-amplify/backend";

export const s3UploadFunction = defineFunction({
  name: "s3-upload-function",
  entry: "./handler.ts"
});

import { defineBackend } from "@aws-amplify/backend";
import { mondayMissingSubitemsFunction } from './monday-missing-subitems/resource';
import { s3UploadFunction } from './s3-upload-function/resource';
import { webhookProxyFunction } from './webhook-proxy-function/resource';
import { mondayUnitsFunction } from './monday-units-function/resource';
import { submitApplicationFunction } from './submit-application-function/resource';

export const backend = defineBackend({
  mondayMissingSubitemsFunction,
  s3UploadFunction,
  webhookProxyFunction,
  mondayUnitsFunction,
  submitApplicationFunction,
});

import { defineBackend } from "@aws-amplify/backend";
import { mondayMissingSubitemsFunction } from './monday-missing-subitems/resource';
import { s3UploadFunction } from './s3-upload-function/resource';
import { webhookProxyFunction } from './webhook-proxy-function/resource';
import { mondayUnitsFunction } from './monday-units-function/resource';
import { submitApplicationFunction } from './submit-application-function/resource';
import { a } from "@aws-amplify/backend";

export const backend = defineBackend({
  mondayMissingSubitemsFunction,
  s3UploadFunction,
  webhookProxyFunction,
  mondayUnitsFunction,
  submitApplicationFunction,
});

// Add DynamoDB tables for separate data structure
const appNycTable = a.dynamo.table("app_nyc", {
  partitionKey: a.dynamo.string("appid"),
  sortKey: a.dynamo.string("zoneinfo"),
  billing: a.dynamo.billing.onDemand(),
});

const applicantNycTable = a.dynamo.table("applicant_nyc", {
  partitionKey: a.dynamo.string("userId"),
  sortKey: a.dynamo.string("zoneinfo"),
  billing: a.dynamo.billing.onDemand(),
});

const coApplicantsTable = a.dynamo.table("Co-Applicants", {
  partitionKey: a.dynamo.string("userId"),
  sortKey: a.dynamo.string("zoneinfo"),
  billing: a.dynamo.billing.onDemand(),
});

const guarantorsNycTable = a.dynamo.table("Guarantors_nyc", {
  partitionKey: a.dynamo.string("userId"),
  sortKey: a.dynamo.string("zoneinfo"),
  billing: a.dynamo.billing.onDemand(),
});

// Grant access to Lambda functions
backend.mondayMissingSubitemsFunction.resources.lambda.addToResourcePolicy(
  new a.aws.iam.PolicyStatement({
    effect: a.aws.iam.Effect.ALLOW,
    actions: ["dynamodb:*"],
    resources: [
      appNycTable.resource.arn,
      `${appNycTable.resource.arn}/*`,
      applicantNycTable.resource.arn,
      `${applicantNycTable.resource.arn}/*`,
      coApplicantsTable.resource.arn,
      `${coApplicantsTable.resource.arn}/*`,
      guarantorsNycTable.resource.arn,
      `${guarantorsNycTable.resource.arn}/*`,
    ],
  })
);

backend.s3UploadFunction.resources.lambda.addToResourcePolicy(
  new a.aws.iam.PolicyStatement({
    effect: a.aws.iam.Effect.ALLOW,
    actions: ["dynamodb:*"],
    resources: [
      appNycTable.resource.arn,
      `${appNycTable.resource.arn}/*`,
      applicantNycTable.resource.arn,
      `${applicantNycTable.resource.arn}/*`,
      coApplicantsTable.resource.arn,
      `${coApplicantsTable.resource.arn}/*`,
      guarantorsNycTable.resource.arn,
      `${guarantorsNycTable.resource.arn}/*`,
    ],
  })
);

backend.webhookProxyFunction.resources.lambda.addToResourcePolicy(
  new a.aws.iam.PolicyStatement({
    effect: a.aws.iam.Effect.ALLOW,
    actions: ["dynamodb:*"],
    resources: [
      appNycTable.resource.arn,
      `${appNycTable.resource.arn}/*`,
      applicantNycTable.resource.arn,
      `${applicantNycTable.resource.arn}/*`,
      coApplicantsTable.resource.arn,
      `${coApplicantsTable.resource.arn}/*`,
      guarantorsNycTable.resource.arn,
      `${guarantorsNycTable.resource.arn}/*`,
    ],
  })
);

backend.mondayUnitsFunction.resources.lambda.addToResourcePolicy(
  new a.aws.iam.PolicyStatement({
    effect: a.aws.iam.Effect.ALLOW,
    actions: ["dynamodb:*"],
    resources: [
      appNycTable.resource.arn,
      `${appNycTable.resource.arn}/*`,
      applicantNycTable.resource.arn,
      `${applicantNycTable.resource.arn}/*`,
      coApplicantsTable.resource.arn,
      `${coApplicantsTable.resource.arn}/*`,
      guarantorsNycTable.resource.arn,
      `${guarantorsNycTable.resource.arn}/*`,
    ],
  })
);

backend.submitApplicationFunction.resources.lambda.addToResourcePolicy(
  new a.aws.iam.PolicyStatement({
    effect: a.aws.iam.Effect.ALLOW,
    actions: ["dynamodb:*"],
    resources: [
      appNycTable.resource.arn,
      `${appNycTable.resource.arn}/*`,
      applicantNycTable.resource.arn,
      `${applicantNycTable.resource.arn}/*`,
      coApplicantsTable.resource.arn,
      `${coApplicantsTable.resource.arn}/*`,
      guarantorsNycTable.resource.arn,
      `${guarantorsNycTable.resource.arn}/*`,
    ],
  })
);

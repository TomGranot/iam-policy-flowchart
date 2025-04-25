import type { Scenario } from "./store"

export function getExamplePolicies(scenario: Scenario) {
  // Return example policies based on the scenario
  switch (scenario.id) {
    case "vpc-s3":
      return {
        allowBased: {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: ["s3:GetObject", "s3:ListBucket"],
              Resource: ["arn:aws:s3:::example-bucket", "arn:aws:s3:::example-bucket/*"],
              Condition: {
                StringEquals: {
                  "aws:SourceVpc": "vpc-1234567",
                },
                Bool: {
                  "aws:SecureTransport": "true",
                },
              },
            },
          ],
        },
        denyBased: {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: ["s3:GetObject", "s3:ListBucket"],
              Resource: ["arn:aws:s3:::example-bucket", "arn:aws:s3:::example-bucket/*"],
            },
            {
              Effect: "Deny",
              Action: ["s3:GetObject", "s3:ListBucket"],
              Resource: ["arn:aws:s3:::example-bucket", "arn:aws:s3:::example-bucket/*"],
              Condition: {
                StringNotEquals: {
                  "aws:SourceVpc": "vpc-1234567",
                },
              },
            },
            {
              Effect: "Deny",
              Action: ["s3:GetObject", "s3:ListBucket"],
              Resource: ["arn:aws:s3:::example-bucket", "arn:aws:s3:::example-bucket/*"],
              Condition: {
                Bool: {
                  "aws:SecureTransport": "false",
                },
              },
            },
          ],
        },
      }

    case "lambda-kms":
      return {
        allowBased: {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: ["kms:Decrypt", "kms:GenerateDataKey"],
              Resource: "arn:aws:kms:us-west-2:123456789012:key/example-key-id",
              Condition: {
                StringEquals: {
                  "kms:ViaService": "lambda.amazonaws.com",
                },
              },
            },
          ],
        },
        denyBased: {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: ["kms:Decrypt", "kms:GenerateDataKey"],
              Resource: "arn:aws:kms:us-west-2:123456789012:key/example-key-id",
            },
            {
              Effect: "Deny",
              Action: ["kms:Decrypt", "kms:GenerateDataKey"],
              Resource: "arn:aws:kms:us-west-2:123456789012:key/example-key-id",
              Condition: {
                StringNotEquals: {
                  "kms:ViaService": "lambda.amazonaws.com",
                },
              },
            },
          ],
        },
      }

    case "cross-account":
      return {
        allowBased: {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                AWS: "arn:aws:iam::123456789012:role/source-role",
              },
              Action: "sts:AssumeRole",
              Condition: {
                StringEquals: {
                  "aws:PrincipalOrgID": "o-exampleorgid",
                },
                Bool: {
                  "aws:MultiFactorAuthPresent": "true",
                },
              },
            },
          ],
        },
        denyBased: {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                AWS: "arn:aws:iam::123456789012:role/source-role",
              },
              Action: "sts:AssumeRole",
            },
            {
              Effect: "Deny",
              Principal: "*",
              Action: "sts:AssumeRole",
              Condition: {
                StringNotEquals: {
                  "aws:PrincipalOrgID": "o-exampleorgid",
                },
              },
            },
            {
              Effect: "Deny",
              Principal: "*",
              Action: "sts:AssumeRole",
              Condition: {
                Bool: {
                  "aws:MultiFactorAuthPresent": "false",
                },
              },
            },
          ],
        },
      }

    case "secure-transport":
      return {
        allowBased: {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: ["s3:GetObject", "s3:PutObject"],
              Resource: "arn:aws:s3:::example-bucket/*",
              Condition: {
                Bool: {
                  "aws:SecureTransport": "true",
                },
                StringEquals: {
                  "aws:SourceVpc": "vpc-1234567",
                },
              },
            },
          ],
        },
        denyBased: {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: ["s3:GetObject", "s3:PutObject"],
              Resource: "arn:aws:s3:::example-bucket/*",
            },
            {
              Effect: "Deny",
              Action: "*",
              Resource: "arn:aws:s3:::example-bucket/*",
              Condition: {
                Bool: {
                  "aws:SecureTransport": "false",
                },
              },
            },
            {
              Effect: "Deny",
              NotAction: ["s3:GetObject", "s3:PutObject"],
              Resource: "arn:aws:s3:::example-bucket/*",
            },
            {
              Effect: "Deny",
              Action: "*",
              Resource: "arn:aws:s3:::example-bucket/*",
              Condition: {
                StringNotEquals: {
                  "aws:SourceVpc": "vpc-1234567",
                },
              },
            },
          ],
        },
      }

    default:
      // For custom scenarios, generate a generic example
      return {
        allowBased: {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: ["service:Action1", "service:Action2"],
              Resource: "*",
              Condition: {
                StringEquals: {
                  "aws:SourceVpc": "vpc-example",
                },
              },
            },
          ],
        },
        denyBased: {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: ["service:Action1", "service:Action2"],
              Resource: "*",
            },
            {
              Effect: "Deny",
              Action: ["service:Action1", "service:Action2"],
              Resource: "*",
              Condition: {
                StringNotEquals: {
                  "aws:SourceVpc": "vpc-example",
                },
              },
            },
          ],
        },
      }
  }
}

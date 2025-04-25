export const predefinedScenarios = [
  {
    id: "vpc-s3",
    name: "IAM Role in VPC accessing S3",
    description: "IAM role in a VPC with endpoint accessing S3 bucket",
    resourceType: "s3",
    principalType: "iam-role",
    policies: ["identity", "resource-based", "vpc-endpoint"],
  },
  {
    id: "lambda-kms",
    name: "Lambda with Permission Boundary",
    description: "Lambda function calling KMS within an account with permission boundaries",
    resourceType: "kms",
    principalType: "lambda",
    policies: ["identity", "resource-based", "permission-boundary"],
  },
  {
    id: "cross-account",
    name: "Cross-Account Role Assumption",
    description: "Cross-account role assumption with SCP enforcement",
    resourceType: "iam-role",
    principalType: "iam-role",
    policies: ["identity", "resource-based", "scp"],
  },
  {
    id: "secure-transport",
    name: "S3 with Secure Transport",
    description: "IAM role in VPC accessing S3 with secure transport requirement",
    resourceType: "s3",
    principalType: "iam-role",
    policies: ["identity", "resource-based", "vpc-endpoint"],
  },
]

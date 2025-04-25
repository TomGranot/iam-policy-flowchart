type PolicyStatement = {
  Effect: string
  Action?: string | string[]
  NotAction?: string | string[]
  Resource?: string | string[]
  NotResource?: string | string[]
  Principal?: any
  Condition?: any
}

type Policy = {
  Version: string
  Statement: PolicyStatement | PolicyStatement[]
}

export function parsePolicy(policyJson: string): {
  resourceType: string
  principalType: string
  policies: string[]
  statements: PolicyStatement[]
} {
  try {
    const policy: Policy = JSON.parse(policyJson)

    // Ensure statements is an array
    const statements = Array.isArray(policy.Statement) ? policy.Statement : [policy.Statement]

    // Determine resource type
    let resourceType = "unknown"
    for (const statement of statements) {
      if (statement.Resource) {
        const resources = Array.isArray(statement.Resource) ? statement.Resource : [statement.Resource]
        for (const resource of resources) {
          if (typeof resource === "string") {
            if (resource.includes("s3")) resourceType = "s3"
            else if (resource.includes("dynamodb")) resourceType = "dynamodb"
            else if (resource.includes("lambda")) resourceType = "lambda"
            else if (resource.includes("kms")) resourceType = "kms"
          }
        }
      }
    }

    // Determine principal type
    let principalType = "iam-role"
    for (const statement of statements) {
      if (statement.Principal) {
        if (statement.Principal.Service && statement.Principal.Service.includes("lambda")) {
          principalType = "lambda"
        } else if (statement.Principal.AWS && statement.Principal.AWS.includes("ec2")) {
          principalType = "ec2"
        }
      }
    }

    // Determine policy types
    const policies: string[] = ["identity"]

    // Check for resource-based policy
    if (statements.some((s) => s.Principal)) {
      policies.push("resource-based")
    }

    // Check for conditions that might indicate other policy types
    for (const statement of statements) {
      if (statement.Condition) {
        if (
          statement.Condition.StringEquals &&
          (statement.Condition.StringEquals["aws:SourceVpc"] || statement.Condition.StringEquals["aws:SourceVpce"])
        ) {
          policies.push("vpc-endpoint")
        }

        if (statement.Condition.Bool && statement.Condition.Bool["aws:SecureTransport"]) {
          // This is a common condition but doesn't necessarily indicate a specific policy type
        }
      }
    }

    return {
      resourceType,
      principalType,
      policies,
      statements,
    }
  } catch (error) {
    console.error("Error parsing policy:", error)
    throw new Error("Invalid policy JSON")
  }
}

export function generatePolicyDescription(parsedPolicy: ReturnType<typeof parsePolicy>): string {
  const { resourceType, principalType, policies } = parsedPolicy

  const resourceTypeDisplay =
    {
      s3: "S3 bucket",
      dynamodb: "DynamoDB table",
      lambda: "Lambda function",
      kms: "KMS key",
      unknown: "resource",
    }[resourceType] || "resource"

  const principalTypeDisplay =
    {
      "iam-role": "IAM role",
      "iam-user": "IAM user",
      lambda: "Lambda function",
      ec2: "EC2 instance",
    }[principalType] || "principal"

  const policyTypes = policies
    .map((p) => {
      return (
        {
          identity: "identity policy",
          "resource-based": "resource-based policy",
          "vpc-endpoint": "VPC endpoint policy",
          scp: "service control policy",
          "permission-boundary": "permission boundary",
        }[p] || p
      )
    })
    .join(", ")

  return `${principalTypeDisplay} accessing ${resourceTypeDisplay} with ${policyTypes}`
}

import type { Scenario } from "./store"

export function generateFlowchartDefinition(scenario: Scenario): string {
  // Base flowchart structure
  let flowchart = `graph TD;
    classDef allow fill:#10b981,stroke:#047857,color:white;
    classDef deny fill:#ef4444,stroke:#b91c1c,color:white;
    classDef implicitDeny fill:#6b7280,stroke:#4b5563,color:white;
    classDef condition fill:#f59e0b,stroke:#d97706,color:white;
    classDef default fill:#f3f4f6,stroke:#d1d5db,color:black;
    
    Start([Request]) --> FirstCheck;
  `

  // Handle uploaded policy scenario
  if (scenario.id === "uploaded" && scenario.uploadedPolicy) {
    return generateUploadedPolicyFlowchart(scenario)
  }

  // Generate flowchart based on scenario
  switch (scenario.id) {
    case "vpc-s3":
      flowchart += `
        FirstCheck{SCP Check} -->|No explicit Deny| IdentityCheck
        FirstCheck -->|Explicit Deny| ExplicitDeny[Deny - SCP]
        
        IdentityCheck{Identity Policy Check} -->|Allow| VPCCheck
        IdentityCheck -->|No Allow| ImplicitDeny[Deny - Implicit]
        
        VPCCheck{VPC Endpoint Policy Check} -->|Allow| ResourceCheck
        VPCCheck -->|No Allow| VPCDeny[Deny - VPC Endpoint]
        
        ResourceCheck{S3 Bucket Policy Check} -->|Allow| ConditionCheck
        ResourceCheck -->|No Allow| ResourceDeny[Deny - Resource Policy]
        
        ConditionCheck{aws:SourceVpc = vpc-1234567?} -->|Yes| SecureCheck
        ConditionCheck -->|No| ConditionDeny[Deny - Source VPC]
        
        SecureCheck{aws:SecureTransport = true?} -->|Yes| Allow[Allow]
        SecureCheck -->|No| SecureDeny[Deny - Insecure Transport]
        
        ExplicitDeny:::deny
        ImplicitDeny:::implicitDeny
        VPCDeny:::deny
        ResourceDeny:::implicitDeny
        ConditionDeny:::deny
        SecureDeny:::deny
        Allow:::allow
      `
      break

    case "lambda-kms":
      flowchart += `
        FirstCheck{Permission Boundary Check} -->|No explicit Deny| IdentityCheck
        FirstCheck -->|Explicit Deny| BoundaryDeny[Deny - Permission Boundary]
        
        IdentityCheck{Lambda Execution Role Check} -->|Allow| ResourceCheck
        IdentityCheck -->|No Allow| ImplicitDeny[Deny - Implicit]
        
        ResourceCheck{KMS Key Policy Check} -->|Allow| ConditionCheck
        ResourceCheck -->|No Allow| ResourceDeny[Deny - Key Policy]
        
        ConditionCheck{kms:ViaService = lambda?} -->|Yes| Allow[Allow]
        ConditionCheck -->|No| ConditionDeny[Deny - Via Service]
        
        BoundaryDeny:::deny
        ImplicitDeny:::implicitDeny
        ResourceDeny:::implicitDeny
        ConditionDeny:::deny
        Allow:::allow
      `
      break

    case "cross-account":
      flowchart += `
        FirstCheck{Source Account SCP Check} -->|No explicit Deny| TargetSCP
        FirstCheck -->|Explicit Deny| SourceSCPDeny[Deny - Source SCP]
        
        TargetSCP{Target Account SCP Check} -->|No explicit Deny| IdentityCheck
        TargetSCP -->|Explicit Deny| TargetSCPDeny[Deny - Target SCP]
        
        IdentityCheck{Source Identity Policy Check} -->|Allow| ResourceCheck
        IdentityCheck -->|No Allow| ImplicitDeny[Deny - Implicit]
        
        ResourceCheck{Target Role Trust Policy Check} -->|Allow| ConditionCheck
        ResourceCheck -->|No Allow| TrustDeny[Deny - Trust Policy]
        
        ConditionCheck{aws:PrincipalOrgID matches?} -->|Yes| MFACheck
        ConditionCheck -->|No| OrgDeny[Deny - Organization]
        
        MFACheck{aws:MultiFactorAuthPresent = true?} -->|Yes| Allow[Allow]
        MFACheck -->|No| MFADeny[Deny - MFA Required]
        
        SourceSCPDeny:::deny
        TargetSCPDeny:::deny
        ImplicitDeny:::implicitDeny
        TrustDeny:::implicitDeny
        OrgDeny:::deny
        MFADeny:::deny
        Allow:::allow
      `
      break

    case "secure-transport":
      flowchart += `
        FirstCheck{SCP Check} -->|No explicit Deny| IdentityCheck
        FirstCheck -->|Explicit Deny| ExplicitDeny[Deny - SCP]
        
        IdentityCheck{Identity Policy Check} -->|Allow| ResourceCheck
        IdentityCheck -->|No Allow| ImplicitDeny[Deny - Implicit]
        
        ResourceCheck{S3 Bucket Policy Check} -->|Allow| VPCCheck
        ResourceCheck -->|No Allow| ResourceDeny[Deny - Resource Policy]
        
        VPCCheck{aws:SourceVpc = vpc-1234567?} -->|Yes| SecureCheck
        VPCCheck -->|No| VPCDeny[Deny - Source VPC]
        
        SecureCheck{aws:SecureTransport = true?} -->|Yes| Allow[Allow]
        SecureCheck -->|No| SecureDeny[Deny - Insecure Transport]
        
        ExplicitDeny:::deny
        ImplicitDeny:::implicitDeny
        ResourceDeny:::implicitDeny
        VPCDeny:::deny
        SecureDeny:::deny
        Allow:::allow
      `
      break

    case "custom":
      // Generate a custom flowchart based on selected policies
      flowchart += `
        FirstCheck([Start Evaluation]) --> PolicyCheck
      `

      let lastNode = "PolicyCheck"

      if (scenario.policies.includes("scp")) {
        flowchart += `
          PolicyCheck{SCP Check} -->|No explicit Deny| IdentityCheck
          PolicyCheck -->|Explicit Deny| SCPDeny[Deny - SCP]
        `
        lastNode = "IdentityCheck"
      } else {
        flowchart += `
          PolicyCheck([Policy Evaluation]) --> IdentityCheck
        `
      }

      if (scenario.policies.includes("identity")) {
        flowchart += `
          IdentityCheck{Identity Policy Check} -->|Allow| NextCheck1
          IdentityCheck -->|No Allow| IdentityDeny[Deny - Implicit]
        `
        lastNode = "NextCheck1"
      }

      if (scenario.policies.includes("permission-boundary")) {
        flowchart += `
          ${lastNode}{Permission Boundary Check} -->|No explicit Deny| NextCheck2
          ${lastNode} -->|Explicit Deny| BoundaryDeny[Deny - Permission Boundary]
        `
        lastNode = "NextCheck2"
      }

      if (scenario.policies.includes("vpc-endpoint")) {
        flowchart += `
          ${lastNode}{VPC Endpoint Policy Check} -->|Allow| NextCheck3
          ${lastNode} -->|No Allow| VPCDeny[Deny - VPC Endpoint]
        `
        lastNode = "NextCheck3"
      }

      if (scenario.policies.includes("resource-based")) {
        flowchart += `
          ${lastNode}{Resource Policy Check} -->|Allow| ConditionCheck
          ${lastNode} -->|No Allow| ResourceDeny[Deny - Resource Policy]
        `
        lastNode = "ConditionCheck"
      }

      flowchart += `
        ${lastNode}{Condition Evaluation} -->|Conditions Met| Allow[Allow]
        ${lastNode} -->|Conditions Not Met| ConditionDeny[Deny - Conditions]
        
        SCPDeny:::deny
        IdentityDeny:::implicitDeny
        BoundaryDeny:::deny
        VPCDeny:::deny
        ResourceDeny:::implicitDeny
        ConditionDeny:::deny
        Allow:::allow
      `
      break

    default:
      flowchart += `
        FirstCheck([No Scenario Selected]) --> NoData[Please select a scenario]
      `
  }

  return flowchart
}

function generateUploadedPolicyFlowchart(scenario: Scenario): string {
  let flowchart = `graph TD;
    classDef allow fill:#10b981,stroke:#047857,color:white;
    classDef deny fill:#ef4444,stroke:#b91c1c,color:white;
    classDef implicitDeny fill:#6b7280,stroke:#4b5563,color:white;
    classDef condition fill:#f59e0b,stroke:#d97706,color:white;
    classDef default fill:#f3f4f6,stroke:#d1d5db,color:black;
    
    Start([Request]) --> FirstCheck;
  `

  // Start building the flowchart based on the policy structure
  let lastNode = "FirstCheck"
  let nodeCounter = 0

  // Extract statements from the policy
  const policy = scenario.uploadedPolicy
  const statements = Array.isArray(policy.Statement) ? policy.Statement : [policy.Statement]

  // Check if we have identity policies
  if (scenario.policies.includes("identity")) {
    flowchart += `
      FirstCheck{Identity Policy Check} -->|Evaluation| IdentityEval
    `
    lastNode = "IdentityEval"

    // Add nodes for each statement with Allow effect
    const allowStatements = statements.filter((s) => s.Effect === "Allow")
    if (allowStatements.length > 0) {
      flowchart += `
        IdentityEval{Allow Statements} -->|Has Allow| AllowPath
      `

      // Add action nodes for the first few allow statements
      for (let i = 0; i < Math.min(allowStatements.length, 3); i++) {
        const statement = allowStatements[i]
        const actions = Array.isArray(statement.Action)
          ? statement.Action.slice(0, 2).join(", ") + (statement.Action.length > 2 ? "..." : "")
          : statement.Action || "All Actions"

        nodeCounter++
        const nodeId = `Allow${nodeCounter}`
        flowchart += `
          AllowPath --> ${nodeId}["${actions}"]
        `
      }

      // Add condition nodes if present
      const conditionStatements = allowStatements.filter((s) => s.Condition)
      if (conditionStatements.length > 0) {
        flowchart += `
          AllowPath --> CondCheck{Condition Check}
        `

        // Add a few condition examples
        for (let i = 0; i < Math.min(conditionStatements.length, 2); i++) {
          const statement = conditionStatements[i]
          const conditions = Object.keys(statement.Condition).slice(0, 2).join(", ")

          nodeCounter++
          const nodeId = `Cond${nodeCounter}`
          flowchart += `
            CondCheck -->|${conditions}| ${nodeId}[Condition]
          `
        }

        flowchart += `
          CondCheck -->|Conditions Met| FinalAllow[Allow]
          CondCheck -->|Conditions Not Met| CondDeny[Deny - Conditions]
          CondDeny:::deny
        `
      } else {
        flowchart += `
          AllowPath --> FinalAllow[Allow]
        `
      }

      flowchart += `
        FinalAllow:::allow
      `
    }

    // Add nodes for each statement with Deny effect
    const denyStatements = statements.filter((s) => s.Effect === "Deny")
    if (denyStatements.length > 0) {
      flowchart += `
        IdentityEval -->|Has Deny| DenyPath
      `

      // Add action nodes for the first few deny statements
      for (let i = 0; i < Math.min(denyStatements.length, 3); i++) {
        const statement = denyStatements[i]
        const actions = Array.isArray(statement.Action)
          ? statement.Action.slice(0, 2).join(", ") + (statement.Action.length > 2 ? "..." : "")
          : statement.Action || "All Actions"

        nodeCounter++
        const nodeId = `Deny${nodeCounter}`
        flowchart += `
          DenyPath --> ${nodeId}["${actions}"]
        `
      }

      flowchart += `
        DenyPath --> FinalDeny[Deny - Explicit]
        FinalDeny:::deny
      `
    }

    // If no allow statements, add implicit deny
    if (allowStatements.length === 0) {
      flowchart += `
        IdentityEval -->|No Allow| ImplicitDeny[Deny - Implicit]
        ImplicitDeny:::implicitDeny
      `
    }
  }

  // Check if we have resource-based policies
  if (scenario.policies.includes("resource-based")) {
    const nextNode = `ResourceCheck`

    if (lastNode === "FirstCheck") {
      flowchart += `
        FirstCheck{Resource Policy Check} -->|Evaluation| ResourceEval
      `
    } else {
      flowchart += `
        ${lastNode} -->|Next| ${nextNode}
        ${nextNode}{Resource Policy Check} -->|Evaluation| ResourceEval
      `
    }

    lastNode = "ResourceEval"

    // Similar logic as above for resource policies
    flowchart += `
      ResourceEval -->|Has Allow| ResourceAllow[Allow]
      ResourceEval -->|No Allow| ResourceDeny[Deny - Resource]
      ResourceAllow:::allow
      ResourceDeny:::implicitDeny
    `
  }

  // Add VPC endpoint policy check if applicable
  if (scenario.policies.includes("vpc-endpoint")) {
    const nextNode = `VPCCheck`

    if (lastNode === "FirstCheck") {
      flowchart += `
        FirstCheck{VPC Endpoint Policy} -->|Evaluation| VPCEval
      `
    } else {
      flowchart += `
        ${lastNode} -->|Next| ${nextNode}
        ${nextNode}{VPC Endpoint Policy} -->|Evaluation| VPCEval
      `
    }

    lastNode = "VPCEval"

    // Check for VPC conditions
    const vpcConditions = statements.filter(
      (s) =>
        s.Condition && (s.Condition.StringEquals?.["aws:SourceVpc"] || s.Condition.StringEquals?.["aws:SourceVpce"]),
    )

    if (vpcConditions.length > 0) {
      const vpcValue =
        vpcConditions[0].Condition.StringEquals?.["aws:SourceVpc"] ||
        vpcConditions[0].Condition.StringEquals?.["aws:SourceVpce"] ||
        "vpc-example"

      flowchart += `
        VPCEval{aws:SourceVpc Check} -->|${vpcValue}| VPCAllow[Allow]
        VPCEval -->|Other VPC| VPCDeny[Deny - VPC]
        VPCAllow:::allow
        VPCDeny:::deny
      `
    } else {
      flowchart += `
        VPCEval -->|Default| VPCResult[VPC Policy Result]
      `
    }
  }

  // Add SCP check if applicable
  if (scenario.policies.includes("scp")) {
    const nextNode = `SCPCheck`

    if (lastNode === "FirstCheck") {
      flowchart += `
        FirstCheck{SCP Check} -->|Evaluation| SCPEval
      `
    } else {
      flowchart += `
        ${lastNode} -->|Next| ${nextNode}
        ${nextNode}{SCP Check} -->|Evaluation| SCPEval
      `
    }

    lastNode = "SCPEval"

    flowchart += `
      SCPEval -->|No explicit Deny| SCPAllow[Continue]
      SCPEval -->|Explicit Deny| SCPDeny[Deny - SCP]
      SCPDeny:::deny
    `
  }

  // Add permission boundary check if applicable
  if (scenario.policies.includes("permission-boundary")) {
    const nextNode = `BoundaryCheck`

    if (lastNode === "FirstCheck") {
      flowchart += `
        FirstCheck{Permission Boundary} -->|Evaluation| BoundaryEval
      `
    } else {
      flowchart += `
        ${lastNode} -->|Next| ${nextNode}
        ${nextNode}{Permission Boundary} -->|Evaluation| BoundaryEval
      `
    }

    lastNode = "BoundaryEval"

    flowchart += `
      BoundaryEval -->|Within boundary| BoundaryAllow[Continue]
      BoundaryEval -->|Outside boundary| BoundaryDeny[Deny - Boundary]
      BoundaryDeny:::deny
    `
  }

  // If we have secure transport conditions, add them
  const secureTransportConditions = statements.filter(
    (s) => s.Condition && s.Condition.Bool && s.Condition.Bool["aws:SecureTransport"],
  )

  if (secureTransportConditions.length > 0) {
    const nextNode = `SecureCheck`

    flowchart += `
      ${lastNode} -->|Next| ${nextNode}
      ${nextNode}{aws:SecureTransport Check} -->|true| SecureAllow[Allow]
      ${nextNode} -->|false| SecureDeny[Deny - Insecure]
      SecureAllow:::allow
      SecureDeny:::deny
    `

    lastNode = "SecureCheck"
  }

  return flowchart
}

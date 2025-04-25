"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { useFlowchartStore } from "@/lib/store"
import { getExamplePolicies } from "@/lib/policies"

export function PolicyExamples() {
  const scenario = useFlowchartStore((state) => state.scenario)
  const [activeTab, setActiveTab] = useState("allow-based")
  const [copied, setCopied] = useState(false)

  const policies = scenario ? getExamplePolicies(scenario) : null

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!scenario) {
    return null
  }

  // If this is an uploaded policy, show it directly
  if (scenario.id === "uploaded" && scenario.uploadedPolicy) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Policy</CardTitle>
          <CardDescription>Your uploaded IAM policy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="p-4 rounded-md bg-muted overflow-auto max-h-[300px]">
              <code className="text-sm">{JSON.stringify(scenario.uploadedPolicy, null, 2)}</code>
            </pre>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(JSON.stringify(scenario.uploadedPolicy, null, 2))}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Example Policies</CardTitle>
        <CardDescription>Compare different policy approaches for this scenario</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="allow-based">Allow-based</TabsTrigger>
            <TabsTrigger value="deny-based">Deny-based</TabsTrigger>
          </TabsList>

          <TabsContent value="allow-based" className="space-y-4">
            <div className="relative">
              <pre className="p-4 rounded-md bg-muted overflow-auto max-h-[300px]">
                <code className="text-sm">{JSON.stringify(policies?.allowBased, null, 2)}</code>
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(JSON.stringify(policies?.allowBased, null, 2))}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="mb-2 font-medium">Key Points:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Uses explicit Allow statements with specific actions</li>
                <li>
                  Relies on conditions like <code>aws:SourceVpc</code> to restrict access
                </li>
                <li>Simpler to read but may be less secure for sensitive resources</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="deny-based" className="space-y-4">
            <div className="relative">
              <pre className="p-4 rounded-md bg-muted overflow-auto max-h-[300px]">
                <code className="text-sm">{JSON.stringify(policies?.denyBased, null, 2)}</code>
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(JSON.stringify(policies?.denyBased, null, 2))}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="mb-2 font-medium">Key Points:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Uses explicit Deny statements with <code>NotAction</code> and <code>NotResource</code>
                </li>
                <li>
                  Adds explicit Deny for conditions like <code>StringNotEquals</code> on <code>aws:SourceVpc</code>
                </li>
                <li>More complex but provides stronger security guarantees</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 p-3 bg-muted rounded-md">
          <p className="text-sm font-medium mb-1">Validation Command:</p>
          <pre className="text-xs overflow-x-auto p-2 bg-background rounded">
            <code>
              aws accessanalyzer check-no-new-access --existing-policy-document existing.json --new-policy-document
              new.json
            </code>
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}

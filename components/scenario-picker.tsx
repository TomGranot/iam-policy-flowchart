"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Trash2, HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { predefinedScenarios } from "@/lib/scenarios"
import { useFlowchartStore } from "@/lib/store"
import { parsePolicy, generatePolicyDescription } from "@/lib/policy-parser"

export function ScenarioPicker() {
  const [activeTab, setActiveTab] = useState("predefined")
  const [selectedScenario, setSelectedScenario] = useState("")
  const [policyInput, setPolicyInput] = useState("")
  const [policyError, setPolicyError] = useState<string | null>(null)
  const [parsedPolicy, setParsedPolicy] = useState<ReturnType<typeof parsePolicy> | null>(null)

  const { scenario, setScenario, uploadedPolicies, addUploadedPolicy, removeUploadedPolicy } = useFlowchartStore()

  // Load saved state from localStorage
  useEffect(() => {
    if (scenario) {
      if (scenario.id === "uploaded") {
        setActiveTab("upload")
        if (scenario.uploadedPolicy) {
          setPolicyInput(JSON.stringify(scenario.uploadedPolicy, null, 2))
          try {
            setParsedPolicy(parsePolicy(JSON.stringify(scenario.uploadedPolicy)))
          } catch (error) {
            console.error("Error parsing saved policy:", error)
          }
        }
      } else {
        setActiveTab("predefined")
        setSelectedScenario(scenario.id)
      }
    }
  }, [])

  const handleApply = () => {
    if (activeTab === "predefined" && selectedScenario) {
      setScenario(predefinedScenarios.find((s) => s.id === selectedScenario) || null)
    } else if (activeTab === "upload" && parsedPolicy) {
      try {
        const policyObj = JSON.parse(policyInput)
        const policyId = `uploaded-${Date.now()}`
        addUploadedPolicy(policyId, policyObj)

        setScenario({
          id: "uploaded",
          name: "Uploaded Policy",
          description: generatePolicyDescription(parsedPolicy),
          resourceType: parsedPolicy.resourceType,
          principalType: parsedPolicy.principalType,
          policies: parsedPolicy.policies,
          uploadedPolicy: policyObj,
        })
      } catch (error) {
        setPolicyError("Failed to save policy")
      }
    }
  }

  const handlePolicyInputChange = (value: string) => {
    setPolicyInput(value)
    setPolicyError(null)

    try {
      if (value.trim()) {
        const parsed = parsePolicy(value)
        setParsedPolicy(parsed)
      } else {
        setParsedPolicy(null)
      }
    } catch (error) {
      setPolicyError("Invalid JSON format")
      setParsedPolicy(null)
    }
  }

  const handleSelectSavedPolicy = (id: string) => {
    const policy = uploadedPolicies[id]
    if (policy) {
      setPolicyInput(JSON.stringify(policy, null, 2))
      try {
        const parsed = parsePolicy(JSON.stringify(policy))
        setParsedPolicy(parsed)
      } catch (error) {
        setPolicyError("Error parsing saved policy")
      }
    }
  }

  const handleDeleteSavedPolicy = (id: string) => {
    removeUploadedPolicy(id)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenario Picker</CardTitle>
        <CardDescription>Choose a predefined scenario or upload your own policy</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="predefined">Predefined</TabsTrigger>
            <TabsTrigger value="upload">Upload Policy</TabsTrigger>
          </TabsList>

          <TabsContent value="predefined" className="space-y-4">
            <RadioGroup value={selectedScenario} onValueChange={setSelectedScenario} className="space-y-3">
              {predefinedScenarios.map((scenario) => (
                <div key={scenario.id} className="flex items-start space-x-2">
                  <RadioGroupItem value={scenario.id} id={scenario.id} />
                  <Label htmlFor={scenario.id} className="font-normal cursor-pointer">
                    <span className="font-medium">{scenario.name}</span>
                    <p className="text-sm text-muted-foreground">{scenario.description}</p>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="policyInput">Paste IAM Policy JSON</Label>
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <HelpCircle className="h-4 w-4" />
                          <span className="sr-only">Upload instructions</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="end" className="max-w-xs p-2">
                        <div className="text-xs">
                          <p className="font-medium mb-1">How to upload a policy:</p>
                          <ol className="list-decimal pl-4 space-y-1">
                            <li>Paste your IAM policy JSON in the text area</li>
                            <li>The system will automatically analyze it</li>
                            <li>Click "Apply Scenario" to generate the flowchart</li>
                            <li>Your policy will be saved for future use</li>
                          </ol>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Textarea
                  id="policyInput"
                  value={policyInput}
                  onChange={(e) => handlePolicyInputChange(e.target.value)}
                  placeholder='{"Version": "2012-10-17", "Statement": [...]}'
                  className="font-mono text-sm h-48"
                />
              </div>

              {policyError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{policyError}</AlertDescription>
                </Alert>
              )}

              {parsedPolicy && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium mb-1">Detected Policy:</p>
                  <ul className="text-sm space-y-1">
                    <li>
                      <strong>Resource Type:</strong> {parsedPolicy.resourceType}
                    </li>
                    <li>
                      <strong>Principal Type:</strong> {parsedPolicy.principalType}
                    </li>
                    <li>
                      <strong>Policy Types:</strong> {parsedPolicy.policies.join(", ")}
                    </li>
                  </ul>
                </div>
              )}

              {Object.keys(uploadedPolicies).length > 0 && (
                <div className="space-y-2">
                  <Label>Previously Uploaded Policies</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {Object.entries(uploadedPolicies).map(([id, policy]) => (
                      <div key={id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-left justify-start h-auto py-1"
                          onClick={() => handleSelectSavedPolicy(id)}
                        >
                          {id.replace("uploaded-", "Policy ")}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteSavedPolicy(id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Button
          onClick={handleApply}
          className="w-full mt-4"
          disabled={
            (activeTab === "predefined" && !selectedScenario) ||
            (activeTab === "upload" && (!parsedPolicy || !!policyError))
          }
        >
          Apply Scenario
        </Button>
      </CardContent>
    </Card>
  )
}
